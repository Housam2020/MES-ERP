import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Get the authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to login if no user is found
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-8 sm:p-20">
      <div className="text-center">
        <h1 className="text-xl font-bold mb-4">Admin Dashboard</h1>
        <h2 className="text-lg mb-6">Welcome, {user.email}</h2>
        <form action="/auth/signout" method="post">
          <button className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
