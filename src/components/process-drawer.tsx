'use client'

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

type ProcessStep = {
  num: number
  title: string
  desc: string
}

type ProcessDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  steps: readonly ProcessStep[]
}

export function ProcessDrawer({
  open,
  onOpenChange,
  title,
  steps,
}: ProcessDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="w-full px-5 pb-8 overflow-y-auto">
          <DrawerHeader className="px-0">
            <DrawerTitle className="text-[18px] font-semibold text-ink">
              {title}
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-0 mt-2">
            {steps.map((step, i) => (
              <div key={step.num} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-[13px] font-semibold text-white">
                    {step.num}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="my-1 w-px flex-1 bg-outline-dim" />
                  )}
                </div>
                <div className="pb-5">
                  <p className="text-[15px] font-semibold text-ink">
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-ink-muted">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
