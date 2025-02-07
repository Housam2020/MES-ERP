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
   const { data: permissionsData, error } = await supabase
     .from('users')
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
     .eq('id', user.id)
     .single();

   if (error) {
     console.error("Error fetching user permissions:", error);
     return NextResponse.redirect(new URL("/login", request.url));
   }

   userPermissions = permissionsData?.roles?.role_permissions?.map(
     rp => rp.permissions.name as Permission
   ) || [];
 }

 // Define required permissions for actual routes
 const pathPermissions: Record<string, Permission[]> = {
  "/dashboard/analytics": ['view_all_requests', 'view_club_requests'],
  "/dashboard/requests": ['create_requests'] , // Remove permission restriction
  "/dashboard/users": ['manage_all_users', 'manage_club_users'],
  "/dashboard/home": null// Basic access
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
