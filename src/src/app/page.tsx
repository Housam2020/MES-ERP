import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();

  // Check if the user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user role
  const { data: userRecord, error } = await supabase
    .from("Users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !userRecord) {
    console.error("Error fetching user role:", error);
    redirect("/login"); // Redirect to login if role fetch fails
  }

  // 🚀 Correct role-based redirects
  if (userRecord.role === "mes_admin") {
    redirect("/dashboard/mes-admin");
  } else if (userRecord.role === "club_admin") {
    redirect("/dashboard/club-admin");
  } else {
    redirect("/dashboard/user");
  }

  return null; // Prevent unnecessary rendering
}

