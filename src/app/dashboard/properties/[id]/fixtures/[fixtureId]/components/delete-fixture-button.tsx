'use client'

import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface DeleteFixtureButtonProps {
  fixtureId: string
  propertyId: string
  action: (formData: FormData) => Promise<void>
}

export function DeleteFixtureButton({ fixtureId, propertyId, action }: DeleteFixtureButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm('시설물을 삭제하면 관련 사진도 함께 삭제됩니다. 계속하시겠습니까?')) {
          e.preventDefault()
        }
      }}
    >
      <input type="hidden" name="fixtureId" value={fixtureId} />
      <input type="hidden" name="propertyId" value={propertyId} />
      <Button type="submit" variant="destructive" size="sm">
        <Trash2 className="h-4 w-4" />
        삭제
      </Button>
    </form>
  )
}
