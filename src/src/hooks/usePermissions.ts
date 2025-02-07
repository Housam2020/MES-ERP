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
          .eq('id', user.id)
          .single();

        if (error) throw error;

        const perms = data?.roles?.role_permissions?.map(
          rp => rp.permissions.name
        ) as Permission[] || [];

        setPermissions(perms);
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