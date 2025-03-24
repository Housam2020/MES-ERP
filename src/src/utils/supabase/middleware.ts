import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { type Permission } from "@/config/permissions";

export async function updateSession(request: NextRequest) {
 let supabaseResponse = NextResponse.next({ request });

 const supabase = createServerClient(
   process.env.NEXT_PUBLIC_SUPABASE_URL!,
   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
   {
     cookies: {
       getAll() {
         return request.cookies.getAll();
       },
       setAll(cookiesToSet) {
         cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
         supabaseResponse = NextResponse.next({ request });
         cookiesToSet.forEach(({ name, value, options }) =>
           supabaseResponse.cookies.set(name, value, options)
         );
       },
     },
   }
 );

 await supabase.auth.getUser();

 const {
   data: { user },
 } = await supabase.auth.getUser();

 const path = request.nextUrl.pathname;

 if (!user && !["/login", "/register"].includes(path)) {
   return NextResponse.redirect(new URL("/login", request.url));
 }

 if (user && ["/login", "/register"].includes(path)) {
   return NextResponse.redirect(new URL("/dashboard/home", request.url));
 }

 let userPermissions: Permission[] = [];
 if (user) {
   // Fetch user permissions from the user_roles junction table
   const { data: userRolesData, error } = await supabase
     .from('user_roles')
     .select(`
       role_id,
       roles!inner (
         role_permissions!inner (
           permissions!inner (
             name
           )
         )
       )
     `)
     .eq('user_id', user.id);

   if (error) {
     console.error("Error fetching user permissions:", error);
     return NextResponse.redirect(new URL("/login", request.url));
   }

   // Collect all unique permissions across all user roles
   const allPermissions = new Set<Permission>();
   
   userRolesData?.forEach(userRole => {
     userRole.roles?.role_permissions?.forEach(rp => {
       allPermissions.add(rp.permissions.name as Permission);
     });
   });
   
   userPermissions = Array.from(allPermissions);
 }

 // Define required permissions for protected routes
 const pathPermissions: Record<string, Permission[]> = {
  "/dashboard/analytics": ['view_all_requests', 'view_club_requests'],
  "/dashboard/requests": ['create_requests'], // Basic request creation
  "/dashboard/users": ['manage_all_users', 'manage_club_users'],
  "/dashboard/roles": ['manage_all_roles', 'manage_club_roles'], // Add roles page protection
  "/dashboard/home": null // Basic access
};

const requiredPermissions = pathPermissions[path];
if (requiredPermissions) {
  const hasRequiredPermissions = requiredPermissions.some(
    permission => userPermissions.includes(permission)
  );

  if (!hasRequiredPermissions) {
    return NextResponse.redirect(new URL("/dashboard/home", request.url));
  }
}

 return supabaseResponse;
}

export const config = {
 matcher: [
   "/dashboard/:path*",
   "/login",
   "/register"
 ],
};
