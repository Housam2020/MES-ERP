"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import { UserCircleIcon, SunIcon, MoonIcon, QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

export default function DashboardHeader() {
  const pathname = usePathname();
  const { permissions, loading } = usePermissions();
  const router = useRouter();
  const supabase = createClient();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "light";
    }
    return "light";
  });
  
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleAccountClick = () => {
    router.push('/dashboard/accountInfo');
    setIsDropdownOpen(false);
  };

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else setTheme("light");
  };

  const handleGuideClick = () => {
    router.push('/dashboard/guide');
  };

  const navItems = [
    { href: '/dashboard/home', label: 'Home', permission: null },
    { href: '/dashboard/requests', label: 'Payment Requests', permission: ['create_requests'] },
    { href: '/dashboard/budget_requests', label: 'Budget Requests', permission: ['create_requests'] },
    { href: '/dashboard/users', label: 'Users', permission: ['manage_all_users', 'manage_club_users'] },
    { href: '/dashboard/groups', label: 'Groups', permission: ['manage_groups'] },
    { href: '/dashboard/analytics', label: 'Analytics', permission: ['view_all_requests', 'view_club_requests'] },
    { href: '/dashboard/roles', label: 'Roles', permission: ['manage_all_roles', 'manage_club_roles'] },
    { href: '/dashboard/operating_budget', label: 'Operating Budget', permission: ['manage_all_roles'] },
    { href: '/dashboard/annual_form', label: 'Annual Form', permission: ['manage_all_roles', 'manage_club_roles'] },
  ];

  if (loading) return null;

  return (
    <header className="bg-blue-600 dark:bg-[#1A365D] mcmaster:bg-[#7A003C]">
      <nav className="container mx-auto">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-white dark:text-white font-medium px-6 py-4">MES-ERP</span>
            <div className="flex space-x-1">
              {navItems.map((item) => {
                const visible = !item.permission || item.permission.some((p) => permissions.includes(p));

                if (!visible) return null;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-4 text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? "bg-blue-700 dark:bg-[#2C5282] mcmaster:bg-[#FDBF57] text-white mcmaster:text-[#7A003C]"
                        : "text-white hover:bg-blue-700 dark:hover:bg-[#2C5282] mcmaster:hover:bg-[#FDBF57] mcmaster:hover:text-[#7A003C]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={cycleTheme}
              className="p-2 text-white hover:bg-blue-700 dark:hover:bg-[#2C5282] mcmaster:hover:bg-[#FDBF57] rounded-full"
            >
              {theme === "light" ? (
                <MoonIcon className="h-6 w-6" />
              ) :(
                <SunIcon className="h-6 w-6" />
              )}
            </button>
            <button
              onClick={handleGuideClick}
              className="p-2 text-white hover:bg-blue-700 dark:hover:bg-[#2C5282] mcmaster:hover:bg-[#FDBF57] rounded-full"
            >
              <QuestionMarkCircleIcon className="h-6 w-6" />
            </button>
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-6 py-4 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-[#2C5282] mcmaster:hover:bg-[#FDBF57] flex items-center"
              >
                <UserCircleIcon className="h-6 w-6" />
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1A365D] mcmaster:bg-[#495965] rounded-md shadow-lg">
                  <div onClick={handleAccountClick} className="block px-4 py-2 text-sm text-gray-700 dark:text-white mcmaster:text-white hover:bg-gray-100 dark:hover:bg-[#2C5282] mcmaster:hover:bg-[#FDBF57] cursor-pointer">
                    Account
                  </div>
                  <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-white mcmaster:text-white hover:bg-gray-100 dark:hover:bg-[#2C5282] mcmaster:hover:bg-[#FDBF57]">
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}