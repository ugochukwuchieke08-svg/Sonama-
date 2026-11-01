
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Settings,
  Store,
  ChevronLeft,
  Zap,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Products",
    href: "/admin/products",
    icon: Package,
  },
  {
    name: "Orders",
    href: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    name: "Customers",
    href: "/admin/customers",
    icon: Users,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-full flex-col border-r border-gray-200 bg-white">
      {/* Brand */}
      <div className="flex h-[82px] items-center justify-between border-b border-gray-100 px-6">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1769e0] text-white shadow-sm">
            <Zap size={22} fill="currentColor" />
          </div>

          <div>
            <h1 className="text-[15px] font-extrabold tracking-tight text-[#142d4e]">
              SONAMA WILLS
            </h1>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[2px] text-gray-400">
              Admin Panel
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 py-7">
        <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[1.8px] text-gray-400">
          Management
        </p>

        <nav className="space-y-1.5">
          {navigation.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-[#1769e0]/10 text-[#1769e0]"
                    : "text-gray-500 hover:bg-gray-50 hover:text-[#142d4e]"
                }`}
              >
                <Icon
                  size={19}
                  strokeWidth={isActive ? 2.4 : 1.8}
                  className={
                    isActive
                      ? "text-[#1769e0]"
                      : "text-gray-400 group-hover:text-[#142d4e]"
                  }
                />

                <span>{item.name}</span>

                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#1769e0]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Store link */}
      <div className="border-t border-gray-100 p-4">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-500 transition hover:bg-gray-50 hover:text-[#1769e0]"
        >
          <Store size={19} />
          <span>View Storefront</span>
          <ChevronLeft size={16} className="ml-auto rotate-180" />
        </Link>

        <div className="mt-3 rounded-xl bg-[#f5f8ff] p-3.5">
          <p className="text-xs font-bold text-[#142d4e]">
            SONAMA WILLS
          </p>
          <p className="mt-1 text-[11px] leading-5 text-gray-500">
            Manage your store from one place.
          </p>
        </div>
      </div>
    </aside>
  );
}

