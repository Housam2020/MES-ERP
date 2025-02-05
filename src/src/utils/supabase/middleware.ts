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

  // Fetch user role_id
  let roleName = "member"; // Default to "member" if fetching role fails
  if (user) {
    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("role_id")
      .eq("id", user.id)
      .single();

    if (userError || !userRecord?.role_id) {
      console.error("Error fetching user role:", userError);
      return NextResponse.redirect(new URL("/login", request.url)); // Redirect to login if role fetch fails
    }

    // Fetch the actual role name
    const { data: roleData, error: roleError } = await supabase
      .from("roles")
      .select("name")
      .eq("id", userRecord.role_id)
      .single();

    if (roleError || !roleData?.name) {
      console.error("Error fetching role name:", roleError);
      return NextResponse.redirect(new URL("/login", request.url));
    }

    roleName = roleData.name;
  }

  // Define access control for different dashboards
  const mesAdminOnlyPaths = ["/dashboard/mes-admin"];
  const clubAdminOnlyPaths = ["/dashboard/club-admin"];
  const memberPaths = ["/dashboard/user"];

  // Restrict access based on roles
  if (mesAdminOnlyPaths.includes(path) && roleName !== "mes_admin") {
    return NextResponse.redirect(new URL("/dashboard/user", request.url));
  }
  if (clubAdminOnlyPaths.includes(path) && roleName !== "club_admin") {
    return NextResponse.redirect(new URL("/dashboard/user", request.url));
  }
  if (memberPaths.includes(path) && roleName === "mes_admin") {
    return NextResponse.redirect(new URL("/dashboard/mes-admin", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard/mes-admin", "/dashboard/club-admin", "/dashboard/user", "/login", "/register"],
};
