import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { PROTECTED_PERMISSIONS, type ProtectedPermission } from "@/config/permissions";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { userId, newRoleId }: { userId: string, newRoleId: string } = await req.json();

  console.log('Received request:', { userId, newRoleId }); // Debug log

  if (!userId || newRoleId === undefined) {
    return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
  }

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get current user's permissions and role
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

  // Get the role name for the old column
  const { data: roleData } = await supabase
    .from('roles')
    .select('name')
    .eq('id', newRoleId)
    .single();

  if (!roleData) {
    return NextResponse.json({ error: "Role not found" }, { status: 400 });
  }

  // If user only has club-level permissions
  if (!canManageAllUsers) {
    // Get the new role's permissions
    const { data: newRolePerms } = await supabase
      .from('roles')
      .select(`
        role_permissions!inner (
          permissions!inner (
            name
          )
        )
      `)
      .eq('id', newRoleId)
      .single();

    const newRolePermissions = newRolePerms?.role_permissions?.map(
      rp => rp.permissions.name
    ) || [];

    // Check if new role has protected permissions
    if (newRolePermissions.some(p => PROTECTED_PERMISSIONS.includes(p as ProtectedPermission))) {
      return NextResponse.json(
        { error: "Cannot assign role with protected permissions" }, 
        { status: 403 }
      );
    }

    // Get the target user's current group
    const { data: targetUser } = await supabase
      .from('users')
      .select('group_id')
      .eq('id', userId)
      .single();

    // Club admin can only modify users in their group
    if (targetUser?.group_id !== currentUser?.group_id) {
      return NextResponse.json(
        { error: "Cannot modify users from other groups" }, 
        { status: 403 }
      );
    }
  }

  // Update the user's role
  const { error } = await supabase
    .from("users")
    .update({ role_id: newRoleId })
    .eq("id", userId);

  if (error) {
    console.error("Failed to update user role:", error);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }

  return NextResponse.json({ message: "Role updated successfully" });
}
