import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

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
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshing the auth token
  await supabase.auth.getUser();

  // Check if user is authenticated, redirect if necessary
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users to /login if not accessing /login or /register
  if (!user && !["/login", "/register"].includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from /login or /register
  if (user && ["/login", "/register"].includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If the user is authenticated, check their role
  if (user) {
    const { data: userRecord, error } = await supabase
      .from("Users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error || !userRecord) {
      console.error("Error fetching user role:", error);
      return NextResponse.redirect(new URL("/login", request.url)); // Redirect to login if role fetch fails
    }

    const userRole = userRecord.role;

    // Define restricted paths for different roles
    const adminOnlyPaths = ["/dashboard/admin"];
    const userOnlyPaths = ["/dashboard/user"];

    // Restrict access to admin-only paths
    if (adminOnlyPaths.includes(request.nextUrl.pathname) && userRole !== "admin") {
      return NextResponse.redirect(new URL("/dashboard/user", request.url)); // Redirect non-admins to user dashboard
    }

    // Restrict access to user-only paths
    if (userOnlyPaths.includes(request.nextUrl.pathname) && userRole !== "user") {
      return NextResponse.redirect(new URL("/dashboard/admin", request.url)); // Redirect non-users to admin dashboard
    }
  }

  // Fetch data from the payment_requests table (optional, based on your requirements)
  const { data: paymentRequests, error: paymentError } = await supabase
    .from("payment_requests")
    .select("*");

  if (paymentError) {
    console.error("Error fetching payment requests:", paymentError);
    // Handle the error or return a response as needed
  } else {
    console.log("Payment requests:", paymentRequests);
    // You can attach this data to the response or use it as needed
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard/admin", "/dashboard/user", "/login", "/register"], // Adjust as needed
};
