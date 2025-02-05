"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminHeader() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard/mes-admin', label: 'Dashboard' },
    { href: '/dashboard/mes-admin/organization', label: 'Organization' },
    { href: '/dashboard/mes-admin/roles', label: 'Roles' },
    { href: '/dashboard/mes-admin/analytics', label: 'Analytics' }
  ];

  return (
    <div className="w-full bg-blue-600 text-white">
      <div className="container mx-auto">
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-8">
            <h1 className="text-lg font-semibold">MES Admin</h1>
            <nav className="flex gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    pathname === item.href
                      ? 'bg-blue-700 text-white'
                      : 'hover:bg-blue-700/50 text-white/90'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <form action="/auth/signout" method="post">
            <button className="rounded-full border border-solid border-white/[.2] transition-colors flex items-center justify-center hover:bg-blue-700 text-sm h-10 px-4">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
