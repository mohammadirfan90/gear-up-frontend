"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";

const WORKSPACE_ROUTES = ["/dashboard/admin", "/dashboard/provider"];

export function NavbarGate() {
  const pathname = usePathname();
  const isWorkspace = WORKSPACE_ROUTES.some((route) => pathname.startsWith(route));

  return isWorkspace ? null : <Navbar />;
}

export default NavbarGate;
