import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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

  // Refreshing auth token
  await supabase.auth.getUser();

  // Get the authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Redirect unauthenticated users to login (except for login/register pages)
  if (!user && !["/login", "/register"].includes(path)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from login/register pages
  if (user && ["/login", "/register"].includes(path)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Fetch user role
  let userRole = "user"; // Default to "user" if fetching role fails
  if (user) {
    const { data: userRecord, error } = await supabase
      .from("Users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching user role:", error);
      return NextResponse.redirect(new URL("/login", request.url)); // Redirect to login if role fetch fails
    }

    userRole = userRecord.role;
  }

  // Define access control for different dashboards
  const mesAdminOnlyPaths = ["/dashboard/mes-admin"];
  const clubAdminOnlyPaths = ["/dashboard/club-admin"];
  const userOnlyPaths = ["/dashboard/user"];

  // Restrict access based on roles
  if (mesAdminOnlyPaths.includes(path) && userRole !== "mes_admin") {
    return NextResponse.redirect(new URL("/dashboard/user", request.url)); // Redirect unauthorized users
  }
  if (clubAdminOnlyPaths.includes(path) && userRole !== "club_admin") {
    return NextResponse.redirect(new URL("/dashboard/user", request.url)); // Redirect unauthorized users
  }
  if (userOnlyPaths.includes(path) && userRole !== "user") {
    return NextResponse.redirect(new URL("/dashboard/user", request.url)); // Redirect unauthorized users
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard/mes-admin", "/dashboard/club-admin", "/dashboard/user", "/login", "/register"],
};
