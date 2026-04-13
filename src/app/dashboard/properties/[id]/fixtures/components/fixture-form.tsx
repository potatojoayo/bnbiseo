'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, ApiError } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PhotoUploader } from './photo-uploader'

interface FixtureFormProps {
  propertyId: string
  fixtureId?: string
  defaultValues?: {
    category?: string
    name?: string
    location?: string
    brand?: string
    modelNumber?: string
    specNotes?: string
    installedAt?: string
    notes?: string
  }
  submitLabel?: string
}

export function FixtureForm({
  propertyId,
  fixtureId,
  defaultValues,
  submitLabel = '저장',
}: FixtureFormProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [message, setMessage] = useState<string | undefined>()
  const [uploadedPaths, setUploadedPaths] = useState<string[]>([])

  const photoFolder = fixtureId
    ? `fixtures/${fixtureId}`
    : `fixtures/temp-${propertyId}`

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setErrors({})
    setMessage(undefined)

    const form = new FormData(e.currentTarget)
    const body = {
      propertyId,
      category: form.get('category') as string,
      name: form.get('name') as string,
      location: form.get('location') as string,
      brand: (form.get('brand') as string) || undefined,
      modelNumber: (form.get('modelNumber') as string) || undefined,
      specNotes: (form.get('specNotes') as string) || undefined,
      installedAt: (form.get('installedAt') as string) || undefined,
      notes: (form.get('notes') as string) || undefined,
      photoPaths: uploadedPaths.length > 0 ? uploadedPaths : undefined,
    }

    try {
      if (fixtureId) {
        const { propertyId: _, ...updateBody } = body
        await api.patch(`/fixtures/${fixtureId}`, updateBody)
        router.push(`/dashboard/properties/${propertyId}/fixtures/${fixtureId}`)
      } else {
        await api.post('/fixtures', body)
        router.push(`/dashboard/properties/${propertyId}`)
      }
      router.refresh()
    } catch (err) {
      if (err instanceof ApiError && err.data.errors) {
        setErrors(err.data.errors as Record<string, string[]>)
      } else if (err instanceof ApiError) {
        setMessage(err.message)
      } else {
        setMessage('오류가 발생했습니다. 다시 시도해주세요.')
      }
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {message && (
        <div className="text-sm px-4 py-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
          {message}
        </div>
      )}

      <div className="space-y-1.5">
        <Label>
          카테고리 <span className="text-brand">*</span>
        </Label>
        <Select name="category" defaultValue={defaultValues?.category ?? 'other'}>
          <SelectTrigger>
            <SelectValue placeholder="카테고리 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lighting">조명</SelectItem>
            <SelectItem value="faucet">수도/배관</SelectItem>
            <SelectItem value="boiler">보일러</SelectItem>
            <SelectItem value="appliance">가전</SelectItem>
            <SelectItem value="lock">잠금장치</SelectItem>
            <SelectItem value="ac">에어컨</SelectItem>
            <SelectItem value="washer">세탁기</SelectItem>
            <SelectItem value="dryer">건조기</SelectItem>
            <SelectItem value="vent">환기</SelectItem>
            <SelectItem value="other">기타</SelectItem>
          </SelectContent>
        </Select>
        {errors.category && <p className="text-xs text-brand">{errors.category[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">
          시설물 이름 <span className="text-brand">*</span>
        </Label>
        <Input id="name" name="name" placeholder="예) 거실 천장 조명" defaultValue={defaultValues?.name ?? ''} />
        {errors.name && <p className="text-xs text-brand">{errors.name[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="location">
          위치 <span className="text-brand">*</span>
        </Label>
        <Input id="location" name="location" placeholder="예) 거실, 안방 욕실, 주방" defaultValue={defaultValues?.location ?? ''} />
        {errors.location && <p className="text-xs text-brand">{errors.location[0]}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="brand">브랜드</Label>
          <Input id="brand" name="brand" placeholder="예) 삼성, LG" defaultValue={defaultValues?.brand ?? ''} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="modelNumber">모델 번호</Label>
          <Input id="modelNumber" name="modelNumber" placeholder="예) WF21BB6600AW" defaultValue={defaultValues?.modelNumber ?? ''} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="specNotes">사양 메모</Label>
        <Textarea id="specNotes" name="specNotes" placeholder="용량, 전압 등 사양 정보를 입력하세요." rows={2} defaultValue={defaultValues?.specNotes ?? ''} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="installedAt">설치일</Label>
        <Input id="installedAt" name="installedAt" type="date" defaultValue={defaultValues?.installedAt ?? ''} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">메모</Label>
        <Textarea id="notes" name="notes" placeholder="추가 메모를 입력하세요." rows={2} defaultValue={defaultValues?.notes ?? ''} />
      </div>

      <div className="space-y-1.5">
        <Label>사진</Label>
        <PhotoUploader folder={photoFolder} onUploaded={setUploadedPaths} />
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? '저장 중...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
