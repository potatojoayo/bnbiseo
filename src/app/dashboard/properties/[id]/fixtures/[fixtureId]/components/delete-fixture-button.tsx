'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface DeleteFixtureButtonProps {
  fixtureId: string
  propertyId: string
}

export function DeleteFixtureButton({ fixtureId, propertyId }: DeleteFixtureButtonProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleDelete() {
    if (!confirm('시설물을 삭제하면 관련 사진도 함께 삭제됩니다. 계속하시겠습니까?')) {
      return
    }
    setPending(true)
    await api.delete(`/fixtures/${fixtureId}`)
    router.push(`/dashboard/properties/${propertyId}`)
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
