'use client'

import { useState, useTransition } from 'react'
import { useActionState } from 'react'
import { useOnboarding } from './onboarding-context'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Building2Icon,
  CheckIcon,
  ExternalLinkIcon,
  Loader2Icon,
  PenLineIcon,
  WifiIcon,
} from 'lucide-react'
import DaumPostcodeEmbed from 'react-daum-postcode'
import { fetchAirbnbListing } from '@/actions/airroi'
import { createProperty } from '@/actions/properties'
import type { AirroiListingDetail } from '@/lib/airroi'
import type { PropertyFormState } from '@/actions/properties'

// ─── Shared Components ───────────────────────────────────────────────────────

function SectionCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-2xl border border-[#E8E3DC] bg-white p-5 sm:p-6', className)}>
      {children}
    </div>
  )
}

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label
        htmlFor={id}
        className="text-xs font-semibold tracking-wide uppercase text-[#6b6b63]"
      >
        {label}
        {required && <span className="text-[#D4421E] ml-0.5">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-[#D4421E] flex items-center gap-1 mt-0.5">{error}</p>
      )}
    </div>
  )
}

function PrimaryButton({
  children,
  disabled,
  onClick,
  type = 'button',
}: {
  children: React.ReactNode
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center justify-center gap-2.5 h-11 rounded-xl text-sm font-semibold text-white transition-all',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        'hover:opacity-90 active:scale-[0.99]',
      )}
      style={{ backgroundColor: '#D4421E', boxShadow: '0 2px 12px rgba(212,66,30,0.25)' }}
    >
      {children}
    </button>
  )
}

function SecondaryButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center justify-center h-11 px-5 rounded-xl text-sm font-medium text-[#1a1a1a] border border-[#E8E3DC] bg-white transition-all',
        'hover:bg-[#F6F4F0] active:scale-[0.99]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
      )}
    >
      {children}
    </button>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractListingId(input: string): number | null {
  // Handle full URL: https://www.airbnb.com/rooms/12345678 or airbnb.com/rooms/12345678?...
  const urlMatch = input.match(/airbnb\.[a-z.]+\/rooms\/(\d+)/)
  if (urlMatch) return Number(urlMatch[1])

  // Handle just a number
  const numMatch = input.trim().match(/^(\d+)$/)
  if (numMatch) return Number(numMatch[1])

  return null
}

// ─── Step 1: Airbnb registered? ──────────────────────────────────────────────

function Step1({
  onYes,
  onNo,
}: {
  onYes: () => void
  onNo: () => void
}) {
  return (
    <div className="flex flex-col gap-8 animate-fade-in-fast">
      <div>
        <h2
          className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1a1a1a] leading-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          에어비앤비에 등록된
          <br />숙소인가요?
        </h2>
        <p className="text-sm text-[#8a8a82] mt-2" style={{ fontFamily: 'var(--font-body)' }}>
          등록된 숙소라면 정보를 자동으로 가져올 수 있어요.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={onYes}
          className={cn(
            'flex items-center gap-4 p-5 rounded-2xl border border-[#E8E3DC] bg-white text-left transition-all',
            'hover:border-[#D4421E]/40 hover:shadow-md',
          )}
        >
          <div
            className="size-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(212,66,30,0.1)' }}
          >
            <ExternalLinkIcon className="size-5 text-[#D4421E]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1a1a1a]">네, 에어비앤비에 등록되어 있어요</p>
            <p className="text-xs text-[#8a8a82] mt-0.5">숙소 링크를 입력하면 사진과 정보를 자동으로 채워드려요</p>
          </div>
        </button>

        <button
          onClick={onNo}
          className={cn(
            'flex items-center gap-4 p-5 rounded-2xl border border-[#E8E3DC] bg-white text-left transition-all',
            'hover:border-[#8a8a82]/40 hover:shadow-md',
          )}
        >
          <div className="size-10 rounded-xl flex items-center justify-center shrink-0 bg-[#F6F4F0]">
            <PenLineIcon className="size-5 text-[#8a8a82]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1a1a1a]">아니오, 직접 입력할게요</p>
            <p className="text-xs text-[#8a8a82] mt-0.5">주소와 숙소 정보를 직접 입력해서 등록합니다</p>
          </div>
        </button>
      </div>
    </div>
  )
}

// ─── Step 2A: Airbnb URL input ───────────────────────────────────────────────

function StepAirbnbUrl({
  onFetched,
  onBack,
}: {
  onFetched: (detail: AirroiListingDetail) => void
  onBack: () => void
}) {
  const [url, setUrl] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleNext() {
    const listingId = extractListingId(url)
    if (!listingId) {
      setError('올바른 에어비앤비 링크를 입력해주세요. 예: https://www.airbnb.com/rooms/12345678')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await fetchAirbnbListing(listingId)
      if (!result.success) {
        setError('리스팅 정보를 가져올 수 없습니다. URL을 확인해주세요.')
        return
      }
      onFetched(result.listing)
    })
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in-fast">
      <div>
        <h2
          className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1a1a1a] leading-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          에어비앤비 링크를
          <br />입력해주세요
        </h2>
        <p className="text-sm text-[#8a8a82] mt-2" style={{ fontFamily: 'var(--font-body)' }}>
          에어비앤비 앱 또는 웹에서 숙소 링크를 복사해서 붙여넣어주세요.
        </p>
      </div>

      <SectionCard>
        <Field id="airbnb-url" label="에어비앤비 숙소 링크" required>
          <Input
            id="airbnb-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.airbnb.com/rooms/12345678"
            className="h-10 text-sm"
          />
        </Field>
        <p className="text-xs text-[#8a8a82] mt-2">
          에어비앤비 앱 → 숙소 → 공유 → 링크 복사
        </p>
      </SectionCard>

      {error && (
        <div className="flex items-center gap-2 text-sm text-[#D4421E] bg-[#D4421E]/8 border border-[#D4421E]/20 px-4 py-3 rounded-xl">
          <span>!</span>
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <SecondaryButton onClick={onBack} disabled={isPending}>
          이전으로
        </SecondaryButton>
        <div className="flex-1">
          <PrimaryButton onClick={handleNext} disabled={isPending || !url.trim()}>
            {isPending ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                정보 가져오는 중...
              </>
            ) : (
              '다음'
            )}
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}

// ─── Step 2B: Manual address input ───────────────────────────────────────────

type ManualData = {
  zonecode: string
  address: string
  addressDetail: string
}

function StepManualAddress({
  onNext,
  onBack,
}: {
  onNext: (data: ManualData) => void
  onBack: () => void
}) {
  const [showPostcode, setShowPostcode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<ManualData>({
    zonecode: '',
    address: '',
    addressDetail: '',
  })

  function handleNext() {
    if (!form.address.trim()) {
      setError('주소를 검색해주세요.')
      return
    }
    onNext(form)
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in-fast">
      <div>
        <h2
          className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1a1a1a] leading-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          숙소 주소를
          <br />알려주세요
        </h2>
      </div>

      <SectionCard>
        <div className="flex flex-col gap-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Field id="zonecode" label="우편번호" required>
                <Input
                  id="zonecode"
                  value={form.zonecode}
                  disabled
                  placeholder="우편번호"
                  className="h-10 text-sm bg-[#F6F4F0]"
                />
              </Field>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setShowPostcode(true)}
                className="h-10 px-4 rounded-lg text-sm font-medium border border-[#E8E3DC] bg-white hover:bg-[#F6F4F0] transition-colors"
              >
                주소 검색
              </button>
            </div>
          </div>

          {showPostcode && (
            <div className="border border-[#E8E3DC] rounded-xl overflow-hidden">
              <DaumPostcodeEmbed
                onComplete={(data) => {
                  setForm((prev) => ({
                    ...prev,
                    zonecode: data.zonecode,
                    address: data.roadAddress || data.jibunAddress,
                  }))
                  setShowPostcode(false)
                }}
                style={{ height: 400 }}
              />
            </div>
          )}

          <Field id="address" label="주소" required>
            <Input
              id="address"
              value={form.address}
              disabled
              placeholder="주소 검색을 해주세요"
              className="h-10 text-sm bg-[#F6F4F0]"
            />
          </Field>

          <Field id="addressDetail" label="상세 주소">
            <Input
              id="addressDetail"
              placeholder="예: 3층 301호"
              value={form.addressDetail}
              onChange={(e) => setForm((prev) => ({ ...prev, addressDetail: e.target.value }))}
              className="h-10 text-sm"
            />
          </Field>
        </div>
      </SectionCard>

      {error && (
        <div className="flex items-center gap-2 text-sm text-[#D4421E] bg-[#D4421E]/8 border border-[#D4421E]/20 px-4 py-3 rounded-xl">
          <span>!</span>
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <SecondaryButton onClick={onBack}>이전으로</SecondaryButton>
        <div className="flex-1">
          <PrimaryButton onClick={handleNext} disabled={!form.address}>
            다음
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}

// ─── Step 3: Confirm & register ──────────────────────────────────────────────

function StepRegister({
  airroiDetail,
  manualAddress,
  onBack,
  onClearProgress,
}: {
  airroiDetail: AirroiListingDetail | null
  manualAddress: ManualData | null
  onBack: () => void
  onClearProgress: () => void
}) {
  const [state, formAction, isPending] = useActionState<PropertyFormState, FormData>(
    async (prev, formData) => {
      onClearProgress()
      return createProperty(prev, formData)
    },
    undefined,
  )

  const listingInfo = airroiDetail?.listing_info
  const propertyDetails = airroiDetail?.property_details
  const amenities = propertyDetails?.amenities ?? []

  const defaultName = listingInfo?.listing_name ?? ''
  const defaultAddress = manualAddress?.address ?? propertyDetails?.address ?? ''
  const defaultAddressDetail = manualAddress?.addressDetail ?? ''
  const defaultDescription = listingInfo?.description ?? ''

  return (
    <div className="flex flex-col gap-6 animate-fade-in-fast">
      <div>
        <h2
          className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1a1a1a] leading-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {airroiDetail ? '숙소 정보를' : '숙소 정보를'}
          <br />{airroiDetail ? '확인해주세요' : '입력해주세요'}
        </h2>
        <p className="text-sm text-[#8a8a82] mt-2" style={{ fontFamily: 'var(--font-body)' }}>
          {airroiDetail
            ? '에어비앤비에서 가져온 정보를 확인하고 수정할 수 있어요.'
            : '숙소 정보를 입력하면 등록이 완료됩니다.'}
        </p>
      </div>

      {/* Photo gallery */}
      {listingInfo?.photo_urls && listingInfo.photo_urls.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#6b6b63] mb-2.5">
            사진
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {listingInfo.photo_urls.slice(0, 6).map((url, i) => (
              <div
                key={i}
                className={cn(
                  'relative flex-shrink-0 rounded-xl overflow-hidden border border-[#E8E3DC]',
                  i === 0 ? 'w-40 h-28' : 'w-24 h-28',
                )}
              >
                <Image
                  src={url}
                  alt={`사진 ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="160px"
                  unoptimized
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Amenities */}
      {amenities.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#6b6b63] mb-2.5">
            편의시설
          </p>
          <div className="flex flex-wrap gap-1.5">
            {amenities.slice(0, 14).map((a, i) => (
              <span
                key={i}
                className="inline-flex items-center h-6 px-2.5 rounded-full text-xs font-medium bg-[#F6F4F0] text-[#1a1a1a] border border-[#E8E3DC]"
              >
                {a}
              </span>
            ))}
            {amenities.length > 14 && (
              <span className="inline-flex items-center h-6 px-2.5 rounded-full text-xs font-medium border border-[#E8E3DC] text-[#8a8a82]">
                +{amenities.length - 14}개
              </span>
            )}
          </div>
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="propertyType" value="apartment" />
        {defaultAddressDetail && (
          <input type="hidden" name="addressDetail" value={defaultAddressDetail} />
        )}

        {/* Basic info */}
        <SectionCard>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#6b6b63] mb-4">
            기본 정보
          </p>
          <div className="flex flex-col gap-4">
            <Field id="name" label="숙소 이름" required error={state?.errors?.name?.[0]}>
              <Input
                id="name"
                name="name"
                required
                defaultValue={defaultName}
                placeholder="예: 합정 감성 아파트"
                className="h-10 text-sm"
              />
            </Field>
            <Field id="address" label="주소" required error={state?.errors?.address?.[0]}>
              <Input
                id="address"
                name="address"
                required
                defaultValue={defaultAddress}
                disabled={!!manualAddress}
                placeholder="예: 서울시 마포구 합정동 123-4"
                className={cn('h-10 text-sm', manualAddress && 'bg-[#F6F4F0]')}
              />
            </Field>
            <Field id="description" label="숙소 설명">
              <Textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={defaultDescription}
                placeholder="게스트에게 보여줄 숙소 설명을 입력해주세요."
                className="resize-none text-sm leading-relaxed"
              />
            </Field>
          </div>
        </SectionCard>

        {/* Guest info */}
        <SectionCard>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#6b6b63] mb-4">
            게스트 안내
          </p>
          <div className="flex flex-col gap-4">
            <Field id="nearbyInfo" label="주변 정보">
              <Textarea
                id="nearbyInfo"
                name="nearbyInfo"
                rows={2}
                placeholder="예: 합정역 도보 5분, 편의점 24시간 운영"
                className="resize-none text-sm"
              />
            </Field>
            <Field id="checkinInfo" label="체크인 안내">
              <Textarea
                id="checkinInfo"
                name="checkinInfo"
                rows={2}
                placeholder="예: 도어락 비밀번호: 1234#, 체크인 오후 3시"
                className="resize-none text-sm"
              />
            </Field>
          </div>
        </SectionCard>

        {/* Wifi */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-4">
            <WifiIcon className="size-4 text-[#D4421E]" />
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#6b6b63]">
              와이파이 정보
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field id="wifiSsid" label="네트워크 이름">
              <Input id="wifiSsid" name="wifiSsid" placeholder="MyWifi_5G" className="h-10 text-sm" />
            </Field>
            <Field id="wifiPassword" label="비밀번호">
              <Input
                id="wifiPassword"
                name="wifiPassword"
                type="password"
                autoComplete="off"
                placeholder="••••••••"
                className="h-10 text-sm"
              />
            </Field>
          </div>
        </SectionCard>

        {state?.message && (
          <div className="flex items-center gap-2 text-sm text-[#D4421E] bg-[#D4421E]/8 border border-[#D4421E]/20 px-4 py-3 rounded-xl">
            <span>!</span>
            {state.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <SecondaryButton onClick={onBack} disabled={isPending}>
            이전으로
          </SecondaryButton>
          <div className="flex-1">
            <PrimaryButton type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  등록 중...
                </>
              ) : (
                <>
                  <CheckIcon className="size-4" strokeWidth={2.5} />
                  숙소 등록하기
                </>
              )}
            </PrimaryButton>
          </div>
        </div>
      </form>
    </div>
  )
}

// ─── Wizard shell ────────────────────────────────────────────────────────────

type WizardStep = 'ask' | 'airbnb-url' | 'manual-address' | 'register'

export function OnboardingWizard() {
  const { wizardStep, goTo, savedState, saveProgress, clearProgress } = useOnboarding()
  const [airroiDetail, setAirroiDetail] = useState<AirroiListingDetail | null>(
    (savedState?.airroiDetail as AirroiListingDetail) ?? null,
  )
  const [manualAddress, setManualAddress] = useState<ManualData | null>(
    savedState?.manualAddress ?? null,
  )

  return (
    <div className="flex flex-col">
      {wizardStep === 'ask' && (
        <Step1
          onYes={() => goTo('airbnb-url')}
          onNo={() => goTo('manual-address')}
        />
      )}

      {wizardStep === 'airbnb-url' && (
        <StepAirbnbUrl
          onFetched={(detail) => {
            setAirroiDetail(detail)
            setManualAddress(null)
            saveProgress({ airroiDetail: detail, manualAddress: null })
            goTo('register')
          }}
          onBack={() => goTo('ask')}
        />
      )}

      {wizardStep === 'manual-address' && (
        <StepManualAddress
          onNext={(data) => {
            setManualAddress(data)
            setAirroiDetail(null)
            saveProgress({ manualAddress: data, airroiDetail: null })
            goTo('register')
          }}
          onBack={() => goTo('ask')}
        />
      )}

      {wizardStep === 'register' && (
        <StepRegister
          airroiDetail={airroiDetail}
          manualAddress={manualAddress}
          onBack={() => {
            if (airroiDetail) goTo('airbnb-url')
            else goTo('manual-address')
          }}
          onClearProgress={clearProgress}
        />
      )}
    </div>
  )
}
