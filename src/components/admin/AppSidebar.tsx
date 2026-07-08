"use client"

import {
  LayoutDashboard,
  Package,
  FolderTree,
  FileText,
  FileEdit,
  Users,
  Tag,
  Home,
  LogOut,
  Trophy,
  Layers,
  Settings,
  MessageCircle,
  Phone,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"

interface AppSidebarProps {
  currentPath?: string;
  adminUser?: {
    full_name?: string | null;
    username?: string;
    profile_image?: string | null;
  } | null;
}

export function AppSidebar({ currentPath = '', adminUser }: AppSidebarProps) {
  const menuItems = [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Productos",
      url: "/admin/products",
      icon: Package,
    },
    {
      title: "Categorías Filtros",
      url: "/admin/filter-categories",
      icon: FolderTree,
    },
    {
      title: "Órdenes",
      url: "/admin/orders",
      icon: FileText,
    },
    {
      title: "Blog",
      url: "/admin/blog",
      icon: FileEdit,
    },
    {
      title: "Casos de Éxito",
      url: "/admin/casos-de-exito",
      icon: Trophy,
    },
    {
      title: "Soluciones",
      url: "/admin/soluciones",
      icon: Layers,
    },
    {
      title: "Usuarios",
      url: "/admin/users",
      icon: Users,
    },
    {
      title: "Códigos Descuento",
      url: "/admin/discount-codes",
      icon: Tag,
    },
  ]

  const settingsItems = [
    {
      title: "Teléfonos",
      url: "/admin/settings/contact",
      icon: Phone,
    },
    {
      title: "WhatsApp",
      url: "/admin/settings/whatsapp",
      icon: MessageCircle,
    },
  ]

  const footerItems = [
    {
      title: "Ver Sitio Web",
      url: "/",
      icon: Home,
    },
    {
      title: "Cerrar Sesión",
      url: "/logout",
      icon: LogOut,
    },
  ]

  // Manejar casos donde adminUser puede ser null o undefined
  const displayName = adminUser?.full_name || adminUser?.username || 'Admin User'

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="Dashboard">
              <a href="/admin/dashboard" className="flex items-center gap-2">
                <img
                  src="/logos/logo-starfilters.png"
                  alt="Starfilters Admin"
                  className="h-6 w-auto"
                />
                <span>Admin</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Menú principal */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = currentPath.startsWith(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Configuración */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Settings className="h-3.5 w-3.5" />
            Configuración
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => {
                const isActive = currentPath.startsWith(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {footerItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  )
}
