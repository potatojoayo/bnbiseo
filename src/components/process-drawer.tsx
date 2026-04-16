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
            <DrawerTitle className="text-[18px] font-semibold text-[#222222]">
              {title}
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-0 mt-2">
            {steps.map((step, i) => (
              <div key={step.num} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-[#222222] text-white text-[13px] font-semibold flex items-center justify-center shrink-0">
                    {step.num}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-px flex-1 bg-[#EBEBEB] my-1" />
                  )}
                </div>
                <div className="pb-5">
                  <p className="text-[15px] font-semibold text-[#222222]">
                    {step.title}
                  </p>
                  <p className="text-[13px] text-[#717171] mt-0.5 leading-relaxed">
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
