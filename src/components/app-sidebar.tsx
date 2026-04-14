"use client"

import * as React from "react"
import Link from "next/link"
import { Logo } from "@/components/logo"
import {
  LayoutDashboardIcon,
  Building2Icon,
  WrenchIcon,
  ClipboardListIcon,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

type Property = { id: string; name: string }

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: { email: string }
  userProperties: Property[]
}

export function AppSidebar({ user, userProperties, ...props }: AppSidebarProps) {
  const navMain = [
    {
      title: "대시보드",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "숙소 목록",
      url: "/dashboard/properties",
      icon: <Building2Icon />,
      items: userProperties.map((p) => ({
        title: p.name,
        url: `/dashboard/properties/${p.id}`,
      })),
    },
    {
      title: "수리 접수",
      url: "/dashboard/repairs/new",
      icon: <WrenchIcon />,
    },
  ]

  const navSecondary = [
    {
      title: "수리 이력",
      url: "/dashboard/repairs",
      icon: <ClipboardListIcon />,
    },
  ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/dashboard"><Logo size="sm" /></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
