'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { type FixtureFormState } from '@/actions/fixtures'
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
  action: (state: FixtureFormState, formData: FormData) => Promise<FixtureFormState>
  propertyId: string
  defaultValues?: {
    fixtureId?: string
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

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? '저장 중...' : label}
    </Button>
  )
}

export function FixtureForm({
  action,
  propertyId,
  defaultValues,
  submitLabel = '저장',
}: FixtureFormProps) {
  const [state, formAction] = useActionState<FixtureFormState, FormData>(
    action,
    undefined,
  )
  const [uploadedPaths, setUploadedPaths] = useState<string[]>([])

  const photoFolder = defaultValues?.fixtureId
    ? `fixtures/${defaultValues.fixtureId}`
    : `fixtures/temp-${propertyId}`

  return (
    <form action={formAction} className="space-y-5">
      {/* Hidden fields */}
      <input type="hidden" name="propertyId" value={propertyId} />
      {defaultValues?.fixtureId && (
        <input type="hidden" name="fixtureId" value={defaultValues.fixtureId} />
      )}
      {/* Pass uploaded photo paths as repeated hidden inputs */}
      {uploadedPaths.map((p, i) => (
        <input key={i} type="hidden" name="photoPaths[]" value={p} />
      ))}

      {/* Global error */}
      {state?.message && (
        <div className="text-sm px-4 py-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
          {state.message}
        </div>
      )}

      {/* Category */}
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
        {state?.errors?.category && (
          <p className="text-xs text-brand">{state.errors.category[0]}</p>
        )}
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">
          시설물 이름 <span className="text-brand">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="예) 거실 천장 조명"
          defaultValue={defaultValues?.name ?? ''}
        />
        {state?.errors?.name && (
          <p className="text-xs text-brand">{state.errors.name[0]}</p>
        )}
      </div>

      {/* Location */}
      <div className="space-y-1.5">
        <Label htmlFor="location">
          위치 <span className="text-brand">*</span>
        </Label>
        <Input
          id="location"
          name="location"
          placeholder="예) 거실, 안방 욕실, 주방"
          defaultValue={defaultValues?.location ?? ''}
        />
        {state?.errors?.location && (
          <p className="text-xs text-brand">{state.errors.location[0]}</p>
        )}
      </div>

      {/* Brand + Model */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="brand">브랜드</Label>
          <Input
            id="brand"
            name="brand"
            placeholder="예) 삼성, LG"
            defaultValue={defaultValues?.brand ?? ''}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="modelNumber">모델 번호</Label>
          <Input
            id="modelNumber"
            name="modelNumber"
            placeholder="예) WF21BB6600AW"
            defaultValue={defaultValues?.modelNumber ?? ''}
          />
        </div>
      </div>

      {/* Spec Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="specNotes">사양 메모</Label>
        <Textarea
          id="specNotes"
          name="specNotes"
          placeholder="용량, 전압 등 사양 정보를 입력하세요."
          rows={2}
          defaultValue={defaultValues?.specNotes ?? ''}
        />
      </div>

      {/* Installed At */}
      <div className="space-y-1.5">
        <Label htmlFor="installedAt">설치일</Label>
        <Input
          id="installedAt"
          name="installedAt"
          type="date"
          defaultValue={defaultValues?.installedAt ?? ''}
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">메모</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="추가 메모를 입력하세요."
          rows={2}
          defaultValue={defaultValues?.notes ?? ''}
        />
      </div>

      {/* Photo upload */}
      <div className="space-y-1.5">
        <Label>사진</Label>
        <PhotoUploader
          folder={photoFolder}
          onUploaded={setUploadedPaths}
        />
      </div>

      <div className="pt-2">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  )
}
