'use client'

import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface DeleteButtonProps {
  propertyId: string
  action: (formData: FormData) => Promise<void>
}

export function DeleteButton({ propertyId, action }: DeleteButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm('숙소를 삭제하면 모든 시설물과 수리 이력도 함께 삭제됩니다. 계속하시겠습니까?')) {
          e.preventDefault()
        }
      }}
    >
      <input type="hidden" name="id" value={propertyId} />
      <Button type="submit" variant="destructive" size="sm">
        <Trash2 className="h-4 w-4" />
        삭제
      </Button>
    </form>
  )
}
