import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const cookieStore = await cookies(); // ✅ Await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value || ""; // ✅ Ensure value is properly returned
        },
      },
    }
  );

  const { userId, newGroupId } = await req.json();

  // Ensure user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ensure only MES Admins can update groups
  const { data: userRole, error: roleError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (roleError || !userRole || userRole.role !== "mes_admin") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Update the user's group
  const { error } = await supabase
    .from("users")
    .update({ group_id: newGroupId || null }) // Set to NULL if empty
    .eq("id", userId);

  if (error) {
    console.error("Failed to update user group:", error);
    return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
  }

  return NextResponse.json({ message: "Group updated successfully" });
}
