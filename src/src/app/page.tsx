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

  // Fetch user role_id
  const { data: userRecord, error: userError } = await supabase
    .from("users")
    .select("role_id")
    .eq("id", user.id)
    .single();

  if (userError || !userRecord?.role_id) {
    console.error("Error fetching user role:", userError);
    redirect("/login"); // Redirect to login if role fetch fails
  }

  // Fetch role name from the roles table
  const { data: roleData, error: roleError } = await supabase
    .from("roles")
    .select("name")
    .eq("id", userRecord.role_id)
    .single();

  if (roleError || !roleData?.name) {
    console.error("Error fetching role name:", roleError);
    redirect("/login");
  }

  // 🚀 Role-based redirection
  if (roleData.name === "mes_admin") {
    redirect("/dashboard/mes-admin");
  } else if (roleData.name === "club_admin") {
    redirect("/dashboard/club-admin");
  } else {
    redirect("/dashboard/user");
  }

  return null; // Prevent unnecessary rendering
}
