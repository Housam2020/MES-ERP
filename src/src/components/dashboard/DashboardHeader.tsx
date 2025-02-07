"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import { createClient } from "@/utils/supabase/client";
import { useState } from "react";
import { UserCircleIcon } from "@heroicons/react/24/outline"; // Import the user icon

export default function DashboardHeader() {
  const pathname = usePathname();
  const { permissions, loading } = usePermissions();
  const router = useRouter();
  const supabase = createClient();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State to manage dropdown visibility

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleAccountClick = () => {
    router.push('/dashboard/accountInfo'); // Redirect to account info page
    setIsDropdownOpen(false); // Close the dropdown
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
      href: '/dashboard/groups', // New groups page
      label: 'Groups',
      permission: ['manage_groups']
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
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="px-6 py-4 text-sm font-medium text-white hover:bg-blue-700 flex items-center"
            >
              <UserCircleIcon className="h-6 w-6" /> {/* User icon */}
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg">
                <div
                  onClick={handleAccountClick} // Use handleAccountClick here
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  Account
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}