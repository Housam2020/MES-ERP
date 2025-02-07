"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import { createClient } from "@/utils/supabase/client";

export default function DashboardHeader() {
  const pathname = usePathname();
  const { permissions, loading } = usePermissions();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navItems = [
    { 
      href: '/dashboard/home', 
      label: 'Home',
      permission: null
    },
    { 
      href: '/dashboard/requests', 
      label: 'Requests',
      permission: ['create_requests']
    },
    { 
      href: '/dashboard/users', 
      label: 'Users',
      permission: ['manage_all_users', 'manage_club_users']
    },
    { 
      href: '/dashboard/analytics', 
      label: 'Analytics',
      permission: ['view_all_requests', 'view_club_requests']
    },
    { 
      href: '/dashboard/roles', 
      label: 'Roles',
      permission: ['manage_all_roles', 'manage_club_roles']
    }
  ];

  if (loading) return null;

  return (
    <header className="bg-blue-600">
      <nav className="container mx-auto">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-white font-medium px-6 py-4">MES Admin</span>
            <div className="flex space-x-1">
              {navItems.map((item) => {
                const visible = !item.permission || 
                  (item.permission && item.permission.some(p => permissions.includes(p)));

                if (!visible) return null;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-4 text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? "bg-blue-700 text-white"
                        : "text-white hover:bg-blue-700"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="px-6 py-4 text-sm font-medium text-white hover:bg-blue-700"
          >
            Sign Out
          </button>
        </div>
      </nav>
    </header>
  );
}
