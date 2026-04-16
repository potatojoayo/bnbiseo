'use client'

import { createContext, useContext } from 'react'
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger, SidebarContext } from "@/components/ui/sidebar"

export const SiteHeaderVisibilityContext = createContext(true)

export function SiteHeader({ title = "대시보드" }: { title?: string }) {
  const hasSidebar = useContext(SidebarContext) !== null
  const isVisible = useContext(SiteHeaderVisibilityContext)

  if (!isVisible) {
    return null
  }

  if (!hasSidebar) {
    return (
      <div className="px-6 pt-6 pb-2">
        <h1 className="text-[22px] font-semibold text-ink">{title}</h1>
      </div>
    )
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
      </div>
    </header>
  )
}
