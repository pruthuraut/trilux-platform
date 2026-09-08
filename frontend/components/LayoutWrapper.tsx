"use client"; // This is now a client component

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/toaster";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Define auth routes where Sidebar should be hidden
  const authRoutes = ["/login", "/register", "/reset-password", "/forgot-password", "/verify", "/auto-login"];

  // Check if current path is an auth route
  const isAuthPage = authRoutes.some(route => pathname.startsWith(route));

  // Check if the path is a UUID auto-login route (e.g., /7f9c87db-97ed-4c70-b7d8-996f93b76a79)
  const uuidRegex = /^\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isUUIDLoginPage = uuidRegex.test(pathname);

  // Skip sidebar for auth pages and UUID login pages
  const shouldHideSidebar = isAuthPage || isUUIDLoginPage;

  return (
    <>
      {!shouldHideSidebar ? <Sidebar>{children}</Sidebar> : children}
      <Toaster />
    </>
  );
}
