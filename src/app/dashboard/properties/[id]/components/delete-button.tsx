'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface DeleteButtonProps {
  propertyId: string
}

export function DeleteButton({ propertyId }: DeleteButtonProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleDelete() {
    if (!confirm('숙소를 삭제하면 모든 시설물과 수리 이력도 함께 삭제됩니다. 계속하시겠습니까?')) {
      return
    }
    setPending(true)
    await api.delete(`/properties/${propertyId}`)
    router.push('/dashboard/properties')
    router.refresh()
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={handleDelete}
    >
      <Trash2 className="h-4 w-4" />
      삭제
    </Button>
  )
}
