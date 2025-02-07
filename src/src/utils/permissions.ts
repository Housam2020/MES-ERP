import { createClient } from "@/utils/supabase/server";

export async function hasPermission(userId: string, requiredPermission: string): Promise<boolean> {
  const supabase = await createClient();

  // Query to check if user has the required permission through their role
  const { data, error } = await supabase
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
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Permission check error:', error);
    return false;
  }

  // Check if the required permission exists in the user's permissions
  const userPermissions = data?.roles?.role_permissions?.map(
    rp => rp.permissions.name
  ) || [];

  return userPermissions.includes(requiredPermission);
}

// Helper to check multiple permissions (any of them)
export async function hasAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
  const supabase = await createClient();
  
  // Same query as above but check for any of the permissions
  const { data, error } = await supabase
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
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Permission check error:', error);
    return false;
  }

  const userPermissions = data?.roles?.role_permissions?.map(
    rp => rp.permissions.name
  ) || [];

  return permissions.some(permission => userPermissions.includes(permission));
} 