import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();

  // Check if the user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Redirect to login if no user is logged in
    redirect("/login");
  }

  // Fetch the user role
  const { data: userRecord, error } = await supabase
    .from("Users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching user role:", error);
    redirect("/login"); // Redirect to login if role fetch fails
  }

  // Redirect based on user role
  if (userRecord.role === "admin") {
    redirect("/dashboard/admin");
  } else if (userRecord.role === "user") {
    redirect("/dashboard/user");
  }

  // If redirection is successful, this part will not execute
  return null;
}
