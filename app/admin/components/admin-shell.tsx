
"use client";

import { usePathname } from "next/navigation";
import AdminSidebar from "./admin-sidebar";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Keep the login page separate from the admin dashboard layout.
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#fafafa] md:flex">
      {/* Sidebar */}
      <div className="hidden w-[260px] shrink-0 md:block">
        <div className="fixed bottom-0 left-0 top-0 w-[260px]">
          <AdminSidebar />
        </div>
      </div>

      {/* Main content */}
      <div className="min-w-0 flex-1">
        {children}
      </div>
    </div>
  );
}

