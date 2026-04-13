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

interface PropertyFormProps {
  propertyId?: string
  defaultValues?: {
    name?: string
    address?: string
    addressDetail?: string
    propertyType?: string
    description?: string
    nearbyInfo?: string
    checkinInfo?: string
    wifiSsid?: string
    wifiPassword?: string
  }
  submitLabel?: string
  redirectTo?: string
}

export function PropertyForm({
  propertyId,
  defaultValues,
  submitLabel = '저장',
  redirectTo,
}: PropertyFormProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [message, setMessage] = useState<string | undefined>()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setErrors({})
    setMessage(undefined)

    const form = new FormData(e.currentTarget)
    const body = {
      name: form.get('name') as string,
      address: form.get('address') as string,
      addressDetail: (form.get('addressDetail') as string) || undefined,
      propertyType: form.get('propertyType') as string,
      description: (form.get('description') as string) || undefined,
      nearbyInfo: (form.get('nearbyInfo') as string) || undefined,
      checkinInfo: (form.get('checkinInfo') as string) || undefined,
      wifiSsid: (form.get('wifiSsid') as string) || undefined,
      wifiPassword: (form.get('wifiPassword') as string) || undefined,
    }

    try {
      if (propertyId) {
        await api.patch(`/properties/${propertyId}`, body)
        router.push(redirectTo ?? `/dashboard/properties/${propertyId}`)
      } else {
        const created = await api.post<{ id: string }>('/properties', body)
        router.push(redirectTo ?? `/dashboard/properties/${created.id}`)
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div className="text-sm px-4 py-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
          {message}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">
          숙소 이름 <span className="text-brand">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="예) 강남 아늑한 원룸"
          defaultValue={defaultValues?.name ?? ''}
        />
        {errors.name && <p className="text-xs text-brand">{errors.name[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>
          숙소 유형 <span className="text-brand">*</span>
        </Label>
        <Select name="propertyType" defaultValue={defaultValues?.propertyType ?? 'apartment'}>
          <SelectTrigger>
            <SelectValue placeholder="숙소 유형 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apartment">아파트</SelectItem>
            <SelectItem value="house">단독주택</SelectItem>
            <SelectItem value="studio">원룸</SelectItem>
            <SelectItem value="villa">빌라</SelectItem>
            <SelectItem value="other">기타</SelectItem>
          </SelectContent>
        </Select>
        {errors.propertyType && <p className="text-xs text-brand">{errors.propertyType[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">
          주소 <span className="text-brand">*</span>
        </Label>
        <Input
          id="address"
          name="address"
          placeholder="예) 서울특별시 강남구 테헤란로 123"
          defaultValue={defaultValues?.address ?? ''}
        />
        {errors.address && <p className="text-xs text-brand">{errors.address[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="addressDetail">상세 주소</Label>
        <Input
          id="addressDetail"
          name="addressDetail"
          placeholder="예) 101동 501호"
          defaultValue={defaultValues?.addressDetail ?? ''}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">숙소 설명</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="숙소에 대한 간단한 설명을 입력하세요."
          rows={3}
          defaultValue={defaultValues?.description ?? ''}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="nearbyInfo">주변 정보</Label>
        <Textarea
          id="nearbyInfo"
          name="nearbyInfo"
          placeholder="편의점, 마트, 교통 등 주변 정보를 입력하세요."
          rows={3}
          defaultValue={defaultValues?.nearbyInfo ?? ''}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="checkinInfo">체크인 안내</Label>
        <Textarea
          id="checkinInfo"
          name="checkinInfo"
          placeholder="체크인/체크아웃 방법, 키 수령 방법 등을 입력하세요."
          rows={3}
          defaultValue={defaultValues?.checkinInfo ?? ''}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="wifiSsid">와이파이 이름 (SSID)</Label>
          <Input
            id="wifiSsid"
            name="wifiSsid"
            placeholder="예) MyWifi_5G"
            defaultValue={defaultValues?.wifiSsid ?? ''}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wifiPassword">와이파이 비밀번호</Label>
          <Input
            id="wifiPassword"
            name="wifiPassword"
            placeholder="와이파이 비밀번호"
            defaultValue={defaultValues?.wifiPassword ?? ''}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? '저장 중...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
