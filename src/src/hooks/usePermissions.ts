import { useState, useEffect } from 'react';
import { createClient } from "@/utils/supabase/client";
import type { Permission } from '@/config/permissions';

export function usePermissions() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchPermissions() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setPermissions([]);
          return;
        }
        
        // Query the user_roles table to get all roles for the user
        const { data, error } = await supabase
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
          
        if (error) throw error;
        
        // Flatten permissions from all roles
        const perms = data?.flatMap(
          role => role.roles?.role_permissions?.map(
            rp => rp.permissions.name
          ) || []
        ) as Permission[] || [];
        
        // Remove duplicates (a user might have the same permission from multiple roles)
        const uniquePerms = [...new Set(perms)];
        
        setPermissions(uniquePerms);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch permissions'));
      } finally {
        setLoading(false);
      }
    }
    
    fetchPermissions();
  }, []);
  
  return { permissions, loading, error };
}
