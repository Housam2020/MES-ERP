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

  // Fetch user permissions using the new junction table
  const { data: userRoles, error: userRolesError } = await supabase
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

  if (userRolesError) {
    console.error("Error fetching user roles:", userRolesError);
    redirect("/login");
  }

  // No need to check permissions here, just send to dashboard
  redirect("/dashboard/home");

  return null; // Prevent unnecessary rendering
}
