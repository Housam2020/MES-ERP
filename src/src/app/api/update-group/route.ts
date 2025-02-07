import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { userId, newGroupId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
  }

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get current user's permissions and group
  const { data: currentUser } = await supabase
    .from('users')
    .select(`
      group_id,
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

  const permissions = currentUser?.roles?.role_permissions?.map(
    rp => rp.permissions.name
  ) || [];

  const canManageAllUsers = permissions.includes('manage_all_users');
  const canManageClubUsers = permissions.includes('manage_club_users');

  if (!canManageAllUsers && !canManageClubUsers) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // If user only has club-level permissions, ensure they're only updating users in their group
  if (!canManageAllUsers) {
    // Get the target user's current group
    const { data: targetUser } = await supabase
      .from('users')
      .select('group_id')
      .eq('id', userId)
      .single();

    // Club admin can only:
    // 1. Remove users from their own group (set to null)
    // 2. Add users to their own group
    // 3. Modify users currently in their group
    if (newGroupId && newGroupId !== currentUser?.group_id) {
      return NextResponse.json(
        { error: "Cannot assign users to other groups" }, 
        { status: 403 }
      );
    }

    if (targetUser?.group_id && 
        targetUser.group_id !== currentUser?.group_id && 
        targetUser.group_id !== null) {
      return NextResponse.json(
        { error: "Cannot modify users from other groups" }, 
        { status: 403 }
      );
    }
  }

  // Update the user's group
  const { error } = await supabase
    .from("users")
    .update({ group_id: newGroupId || null })
    .eq("id", userId);

  if (error) {
    console.error("Failed to update user group:", error);
    return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
  }

  return NextResponse.json({ message: "Group updated successfully" });
}
