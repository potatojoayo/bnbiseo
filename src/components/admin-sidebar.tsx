'use client'

import Link from 'next/link'
import { Logo } from '@/components/logo'
import {
  LayoutDashboardIcon,
  BrushCleaningIcon,
  UsersIcon,
  Building2Icon,
  UserCheckIcon,
} from 'lucide-react'

import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

type AdminSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: { email: string }
}

const navItems = [
  {
    title: '대시보드',
    url: '/admin',
    icon: <LayoutDashboardIcon />,
  },
  {
    title: '청소 관리',
    url: '/admin/cleaning',
    icon: <BrushCleaningIcon />,
  },
  {
    title: '매니저 관리',
    url: '/admin/managers',
    icon: <UserCheckIcon />,
  },
  {
    title: '숙소 관리',
    url: '/admin/properties',
    icon: <Building2Icon />,
  },
  {
    title: '회원 관리',
    url: '/admin/users',
    icon: <UsersIcon />,
  },
]

export function AdminSidebar({ user, ...props }: AdminSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/admin">
                <Logo size="sm" />
                <span className="text-[12px] text-[#717171] ml-1.5">Admin</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
