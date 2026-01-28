"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"

interface AdminSidebarWrapperProps {
  currentPath?: string;
  adminUser?: {
    full_name?: string | null;
    username?: string;
    profile_image?: string | null;
  } | null;
  children?: React.ReactNode;
}

export function AdminSidebarWrapper({ currentPath, adminUser, children }: AdminSidebarWrapperProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar currentPath={currentPath} adminUser={adminUser} />
      <SidebarInset className="flex flex-col min-h-screen">
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
