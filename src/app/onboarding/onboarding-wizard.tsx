'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboarding } from './onboarding-context'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  ArrowLeftIcon,
  Loader2Icon,
  PencilIcon,
} from 'lucide-react'
import { AddressSearch } from '@/components/address-search'

function AirbnbIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 93.3 100" fill="currentColor" className={className}>
      <path d="M91.5,71c-0.5-1.2-1-2.5-1.5-3.6c-0.8-1.8-1.6-3.5-2.3-5.1l-0.1-0.1c-6.9-15-14.3-30.2-22.1-45.2l-0.3-0.6c-0.8-1.5-1.6-3.1-2.4-4.7c-1-1.8-2-3.7-3.6-5.5C56,2.2,51.4,0,46.5,0c-5,0-9.5,2.2-12.8,6c-1.5,1.8-2.6,3.7-3.6,5.5c-0.8,1.6-1.6,3.2-2.4,4.7l-0.3,0.6C19.7,31.8,12.2,47,5.3,62l-0.1,0.2c-0.7,1.6-1.5,3.3-2.3,5.1c-0.5,1.1-1,2.3-1.5,3.6c-1.3,3.7-1.7,7.2-1.2,10.8c1.1,7.5,6.1,13.8,13,16.6c2.6,1.1,5.3,1.6,8.1,1.6c0.8,0,1.8-0.1,2.6-0.2c3.3-0.4,6.7-1.5,10-3.4c4.1-2.3,8-5.6,12.4-10.4c4.4,4.8,8.4,8.1,12.4,10.4c3.3,1.9,6.7,3,10,3.4c0.8,0.1,1.8,0.2,2.6,0.2c2.8,0,5.6-0.5,8.1-1.6c7-2.8,11.9-9.2,13-16.6C93.2,78.2,92.8,74.7,91.5,71z M46.4,76.2c-5.4-6.8-8.9-13.2-10.1-18.6c-0.5-2.3-0.6-4.3-0.3-6.1c0.2-1.6,0.8-3,1.6-4.2c1.9-2.7,5.1-4.4,8.8-4.4c3.7,0,7,1.6,8.8,4.4c0.8,1.2,1.4,2.6,1.6,4.2c0.3,1.8,0.2,3.9-0.3,6.1C55.3,62.9,51.8,69.3,46.4,76.2z M86.3,80.9c-0.7,5.2-4.2,9.7-9.1,11.7c-2.4,1-5,1.3-7.6,1c-2.5-0.3-5-1.1-7.6-2.6c-3.6-2-7.2-5.1-11.4-9.7c6.6-8.1,10.6-15.5,12.1-22.1c0.7-3.1,0.8-5.9,0.5-8.5c-0.4-2.5-1.3-4.8-2.7-6.8c-3.1-4.5-8.3-7.1-14.1-7.1s-11,2.7-14.1,7.1c-1.4,2-2.3,4.3-2.7,6.8c-0.4,2.6-0.3,5.5,0.5,8.5c1.5,6.6,5.6,14.1,12.1,22.2c-4.1,4.6-7.8,7.7-11.4,9.7c-2.6,1.5-5.1,2.3-7.6,2.6c-2.7,0.3-5.3-0.1-7.6-1c-4.9-2-8.4-6.5-9.1-11.7c-0.3-2.5-0.1-5,0.9-7.8c0.3-1,0.8-2,1.3-3.2c0.7-1.6,1.5-3.3,2.3-5l0.1-0.2c6.9-14.9,14.3-30.1,22-44.9l0.3-0.6c0.8-1.5,1.6-3.1,2.4-4.6c0.8-1.6,1.7-3.1,2.8-4.4c2.1-2.4,4.9-3.7,8-3.7c3.1,0,5.9,1.3,8,3.7c1.1,1.3,2,2.8,2.8,4.4c0.8,1.5,1.6,3.1,2.4,4.6l0.3,0.6C67.7,34.8,75.1,50,82,64.9L82,65c0.8,1.6,1.5,3.4,2.3,5c0.5,1.2,1,2.2,1.3,3.2C86.4,75.8,86.7,78.3,86.3,80.9z" />
    </svg>
  )
}
import { api, ApiError } from '@/lib/api-client'
import { extractListingId } from '@/lib/airbnb-scraper'
import type { AirbnbListingInfo } from '@/lib/airbnb-scraper'

// ─── Shared Components ───────────────────────────────────────────────────────

function SectionCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-2xl border border-outline bg-white p-5 sm:p-6', className)}>
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
        className="text-xs font-semibold tracking-wide uppercase text-on-surface-muted"
      >
        {label}
        {required && <span className="text-brand ml-0.5">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-brand flex items-center gap-1 mt-0.5">{error}</p>
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
        'flex-1 flex items-center justify-center gap-2.5 h-11 rounded-xl text-sm font-semibold text-white transition-all',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        'hover:opacity-90 active:scale-[0.99]',
      )}
      style={{ backgroundColor: 'var(--brand)', boxShadow: '0 2px 12px rgba(212,66,30,0.25)' }}
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
        'flex items-center justify-center h-11 px-5 rounded-xl text-sm font-medium text-on-surface border border-outline bg-white transition-all',
        'hover:border-on-surface/25 active:scale-[0.99]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
      )}
    >
      {children}
    </button>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// ─── Step 1: Airbnb registered? ──────────────────────────────────────────────

function Step1({
  backHref,
  onYes,
  onNo,
  onBack,
}: {
  backHref?: string
  onYes: () => void
  onNo: () => void
  onBack?: () => void
}) {
  return (
    <div className="flex flex-col gap-8 animate-fade-in-fast">
      {backHref && (
        <Link
          href={backHref}
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-on-surface-subtle hover:text-on-surface transition-colors"
        >
          <ArrowLeftIcon className="size-4" />
          돌아가기
        </Link>
      )}
      <div>
        <h2
          className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface leading-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          에어비앤비에 등록된
          <br />숙소인가요?
        </h2>
        <p className="text-sm text-on-surface-subtle mt-2" style={{ fontFamily: 'var(--font-body)' }}>
          등록된 숙소라면 정보를 자동으로 가져올 수 있어요.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={onYes}
          className={cn(
            'flex items-center gap-4 p-5 rounded-2xl border border-outline bg-white text-left transition-all',
            'hover:border-brand/40 hover:shadow-md',
          )}
        >
          <div
            className="size-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(212,66,30,0.1)' }}
          >
            <AirbnbIcon className="size-5 text-brand-airbnb" />
          </div>
          <div>
            <p className="text-sm font-semibold text-on-surface">네, 에어비앤비에 등록되어 있어요</p>
            <p className="text-xs text-on-surface-subtle mt-0.5">숙소 링크를 입력하면 사진과 정보를 자동으로 채워드려요</p>
          </div>
        </button>

        <button
          onClick={onNo}
          className={cn(
            'flex items-center gap-4 p-5 rounded-2xl border border-outline bg-white text-left transition-all',
            'hover:border-on-surface-subtle/40 hover:shadow-md',
          )}
        >
          <div className="size-10 rounded-xl flex items-center justify-center shrink-0 bg-surface">
            <PencilIcon className="size-5 text-on-surface-subtle" />
          </div>
          <div>
            <p className="text-sm font-semibold text-on-surface">아니오, 직접 입력할게요</p>
            <p className="text-xs text-on-surface-subtle mt-0.5">주소와 숙소 정보를 직접 입력해서 등록합니다</p>
          </div>
        </button>
      </div>
    </div>
  )
}

// ─── Step 2A: Airbnb URL input ───────────────────────────────────────────────

function StepAirbnbUrl({
  initialUrl,
  onUrlChange,
  onFetched,
  onBack,
}: {
  initialUrl: string
  onUrlChange: (url: string) => void
  onFetched: (detail: AirbnbListingInfo) => void
  onBack: () => void
}) {
  const [url, setUrl] = useState(initialUrl)
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
      try {
        const listing = await api.get<AirbnbListingInfo>(`/airroi/listing/${listingId}`)
        onFetched(listing)
      } catch {
        setError('리스팅 정보를 가져올 수 없습니다. URL을 확인해주세요.')
      }
    })
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in-fast">
      <div>
        <h2
          className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface leading-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          에어비앤비 링크를
          <br />입력해주세요
        </h2>
        <p className="text-sm text-on-surface-subtle mt-2" style={{ fontFamily: 'var(--font-body)' }}>
          에어비앤비 앱 또는 웹에서 숙소 링크를 복사해서 붙여넣어주세요.
        </p>
      </div>

      <SectionCard>
        <Field id="airbnb-url" label="에어비앤비 숙소 링크" required>
          <Input
            id="airbnb-url"
            type="text"
            value={url}
            onChange={(e) => { setUrl(e.target.value); onUrlChange(e.target.value) }}
            placeholder="https://www.airbnb.com/rooms/12345678"
            className="h-10 text-sm"
            autoComplete="off"
          />
        </Field>
        <p className="text-xs text-on-surface-subtle mt-2">
          에어비앤비 앱 → 숙소 → 공유 → 링크 복사
        </p>
      </SectionCard>

      {error && (
        <div className="flex items-center gap-2 text-sm text-brand bg-brand/8 border border-brand/20 px-4 py-3 rounded-xl">
          <span>!</span>
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <SecondaryButton onClick={onBack} disabled={isPending}>
          이전으로
        </SecondaryButton>
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
  )
}

// ─── Step 2B: Manual address input ───────────────────────────────────────────

type ManualData = {
  zonecode: string
  address: string
  addressDetail: string
}

function StepManualAddress({
  initialData,
  onNext,
  onBack,
}: {
  initialData: ManualData | null
  onNext: (data: ManualData) => void
  onBack: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<ManualData>(initialData ?? {
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
          className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface leading-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          숙소 주소를
          <br />알려주세요
        </h2>
      </div>

      <SectionCard>
        <div className="flex flex-col gap-4">
          <Field id="address-search-manual" label="주소 검색" required>
            <AddressSearch
              onSelect={(zonecode, address) => {
                setForm((prev) => ({ ...prev, zonecode, address }))
                setError(null)
              }}
              placeholder="도로명 주소 또는 지번을 입력하세요"
            />
          </Field>

          {form.address && (
            <Field id="address" label="주소" required>
              <Input
                id="address"
                value={form.address}
                disabled
                placeholder="주소 검색을 해주세요"
                className="h-10 text-sm bg-surface"
              />
            </Field>
          )}

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
        <div className="flex items-center gap-2 text-sm text-brand bg-brand/8 border border-brand/20 px-4 py-3 rounded-xl">
          <span>!</span>
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <SecondaryButton onClick={onBack}>이전으로</SecondaryButton>
        <PrimaryButton onClick={handleNext} disabled={!form.address}>
          다음
        </PrimaryButton>
      </div>
    </div>
  )
}

// ─── Step 3: Confirm & register ──────────────────────────────────────────────

function StepRegister({
  airroiDetail,
  manualAddress,
  airbnbListingId,
  onBack,
  onClearProgress,
  onRestoreProgress,
}: {
  airroiDetail: AirbnbListingInfo | null
  manualAddress: ManualData | null
  airbnbListingId: string | null
  onBack: () => void
  onClearProgress: () => void
  onRestoreProgress: () => void
}) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [message, setMessage] = useState<string | undefined>()

  const defaultName = airroiDetail?.name ?? ''
  const initialZonecode = manualAddress?.zonecode ?? ''
  const initialAddress = manualAddress?.address ?? ''
  const initialAddressDetail = manualAddress?.addressDetail ?? ''

  const [zonecode, setZonecode] = useState(initialZonecode)
  const [address, setAddress] = useState(initialAddress)
  const [addressDetail, setAddressDetail] = useState(initialAddressDetail)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)
    setErrors({})
    setMessage(undefined)
    onClearProgress()

    const formData = new FormData(e.currentTarget)
    const body = {
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      addressDetail: (formData.get('addressDetail') as string) || undefined,
      propertyType: formData.get('propertyType') as string,
      airbnbListingId: (formData.get('airbnbListingId') as string) || undefined,
    }

    try {
      await api.post('/properties', body)
      router.push('/onboarding/complete')
    } catch (err) {
      onRestoreProgress()
      if (err instanceof ApiError && err.data.errors) {
        setErrors(err.data.errors as Record<string, string[]>)
      } else if (err instanceof ApiError) {
        setMessage(err.message)
      } else {
        setMessage('숙소 등록 중 오류가 발생했습니다. 다시 시도해주세요.')
      }
      setIsPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in-fast">
      <div>
        <h2
          className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface leading-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {airroiDetail ? '숙소 정보를' : '숙소 정보를'}
          <br />{airroiDetail ? '확인해주세요' : '입력해주세요'}
        </h2>
        <p className="text-sm text-on-surface-subtle mt-2" style={{ fontFamily: 'var(--font-body)' }}>
          {airroiDetail
            ? '에어비앤비에서 가져온 정보를 확인하고 수정할 수 있어요.'
            : '숙소 정보를 입력하면 등록이 완료됩니다.'}
        </p>
      </div>

      {/* Thumbnail */}
      {airroiDetail?.imageUrl && (
        <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-outline">
          <Image
            src={airroiDetail.imageUrl!}
            alt="숙소 사진"
            fill
            className="object-cover"
            sizes="560px"
            unoptimized
          />
        </div>
      )}


      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <input type="hidden" name="propertyType" value="apartment" />
        {airbnbListingId && (
          <input type="hidden" name="airbnbListingId" value={airbnbListingId} />
        )}

        <SectionCard>
          <div className="flex flex-col gap-4">
            <Field id="name" label="숙소 이름" required error={errors.name?.[0]}>
              <Input
                id="name"
                name="name"
                required
                defaultValue={defaultName}
                placeholder="예: 합정 감성 아파트"
                className="h-10 text-sm"
              />
            </Field>

            <Field id="address-search-register" label="주소 검색" required>
              <AddressSearch
                onSelect={(zc, addr) => {
                  setZonecode(zc)
                  setAddress(addr)
                }}
                placeholder="도로명 주소 또는 지번을 입력하세요"
              />
            </Field>

            {/* hidden inputs so form submit always includes address values */}
            <input type="hidden" name="address" value={address} />

            {address ? (
              <Field id="address-display" label="주소" required error={errors.address?.[0]}>
                <Input
                  value={address}
                  readOnly
                  className="h-10 text-sm bg-surface"
                />
              </Field>
            ) : errors.address?.[0] ? (
              <p className="text-xs text-brand">주소를 검색해서 선택해주세요.</p>
            ) : null}

            <Field id="addressDetail" label="상세 주소">
              <Input
                id="addressDetail"
                name="addressDetail"
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                placeholder="예: 3층 301호"
                className="h-10 text-sm"
              />
            </Field>
          </div>
        </SectionCard>

        {message && (
          <div className="flex items-center gap-2 text-sm text-brand bg-brand/8 border border-brand/20 px-4 py-3 rounded-xl">
            <span>!</span>
            {message}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <SecondaryButton onClick={onBack} disabled={isPending}>
            이전으로
          </SecondaryButton>
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
      </form>
    </div>
  )
}

// ─── Wizard shell ────────────────────────────────────────────────────────────

type WizardStep = 'ask' | 'airbnb-url' | 'manual-address' | 'register'

export function OnboardingWizard({ backHref }: { backHref?: string } = {}) {
  const { wizardStep, goTo, savedState, savedUrl: ctxSavedUrl, saveProgress, clearProgress, resetAll } = useOnboarding()
  const [airroiDetail, setAirroiDetail] = useState<AirbnbListingInfo | null>(
    (savedState?.airroiDetail as AirbnbListingInfo) ?? null,
  )
  const [manualAddress, setManualAddress] = useState<ManualData | null>(
    savedState?.manualAddress ?? null,
  )
  // savedUrl is kept in sync with context so panel navigation preserves the typed URL
  const [savedUrl, setSavedUrl] = useState(ctxSavedUrl ?? '')

  function handleUrlChange(url: string) {
    setSavedUrl(url)
    saveProgress({ savedUrl: url })
  }

  return (
    <div className="flex flex-col">
      {wizardStep === 'ask' && (
        <Step1
          backHref={backHref}
          onBack={resetAll}
          onYes={() => {
            setAirroiDetail(null)
            setManualAddress(null)
            setSavedUrl('')
            goTo('airbnb-url', { resetFromStep1: true })
          }}
          onNo={() => {
            setAirroiDetail(null)
            setManualAddress(null)
            setSavedUrl('')
            goTo('manual-address', { resetFromStep1: true })
          }}
        />
      )}

      {wizardStep === 'airbnb-url' && (
        <StepAirbnbUrl
          initialUrl={savedUrl}
          onUrlChange={handleUrlChange}
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
          initialData={manualAddress}
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
          airbnbListingId={airroiDetail ? extractListingId(savedUrl) : null}
          onBack={() => {
            // Use step2Path stored in context: airroiDetail present → came via airbnb-url
            if (airroiDetail) goTo('airbnb-url')
            else goTo('manual-address')
          }}
          onClearProgress={clearProgress}
          onRestoreProgress={() =>
            saveProgress({ airroiDetail: airroiDetail ?? null, manualAddress: manualAddress ?? null })
          }
        />
      )}
    </div>
  )
}
