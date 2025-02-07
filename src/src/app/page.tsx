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

  // Fetch user permissions
  const { data: permissions, error } = await supabase
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
    redirect("/login");
  }

  // All users now go to the same dashboard
  redirect("/dashboard/home");

  return null; // Prevent unnecessary rendering
}

