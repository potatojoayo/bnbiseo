'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
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
  HelpCircleIcon,
} from 'lucide-react'
import { AddressSearch } from '@/components/address-search'
import { FloatingInput, FloatingTextarea, CompoundInput, CompoundField } from '@/components/ui/floating-input'
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer'

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

// ─── Airbnb Link Help Drawer ─────────────────────────────────────────────────

function AirbnbLinkHelp() {
  const steps = [
    { num: 1, text: '에어비앤비 앱 또는 웹사이트를 열어주세요' },
    { num: 2, text: '등록된 숙소의 상세 페이지로 이동하세요' },
    { num: 3, text: '공유 버튼을 눌러 링크를 복사하세요' },
    { num: 4, text: '복사한 링크를 위 입력란에 붙여넣으세요' },
  ]

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button
          type="button"
          className="text-[13px] text-[#717171] underline underline-offset-2 hover:text-[#222222] transition-colors -mt-5"
        >
          링크는 어디서 복사하나요?
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-[440px] px-6 pb-8">
          <DrawerHeader className="px-0">
            <DrawerTitle className="text-[18px] font-semibold text-[#222222]">
              에어비앤비 숙소 링크 복사 방법
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-4 mt-2">
            {steps.map((step, i) => (
              <div key={step.num} className="flex items-start gap-3">
                <div className="size-7 rounded-full bg-[#F7F7F7] flex items-center justify-center shrink-0 text-[13px] font-semibold text-[#222222]">
                  {step.num}
                </div>
                <p className="text-[15px] text-[#222222] pt-0.5 leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#717171] mb-2">링크 예시</p>
            <div className="rounded-lg bg-[#F7F7F7] px-4 py-3">
              <p className="text-[14px] text-[#222222] break-all">https://www.airbnb.com/rooms/12345678</p>
            </div>
          </div>
          <DrawerClose asChild>
            <button
              type="button"
              className="w-full h-12 rounded-lg text-[15px] font-semibold text-white mt-6 bg-[#222222] transition-all active:scale-[0.98]"
            >
              확인
            </button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

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
        'flex-1 flex items-center justify-center gap-2.5 h-12 rounded-lg text-sm font-semibold text-white transition-all',
        'bg-[#222222] hover:bg-[#333333] active:scale-[0.99]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
      )}
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
        'flex items-center justify-center h-12 px-5 rounded-lg text-sm font-medium text-on-surface border border-outline bg-white transition-all',
        'hover:border-[#B0B0B0] active:scale-[0.99]',
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
    <div className="flex flex-col gap-8 animate-fade-up-fast">
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
          className="text-2xl sm:text-3xl font-semibold tracking-tight text-on-surface leading-tight"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          에어비앤비에 등록된
          <br />숙소인가요?
        </h2>
      </div>

      <div className="rounded-xl border border-[#B0B0B0] overflow-hidden divide-y divide-[#B0B0B0]">
        <button
          onClick={onYes}
          className="flex items-center gap-4 px-4 py-4 w-full text-left transition-all hover:bg-[#F7F7F7] active:scale-[0.99]"
        >
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-[#222222]">네, 에어비앤비에 등록되어 있어요</p>
            <p className="text-[13px] text-[#717171] mt-0.5">링크를 입력하면 정보를 자동으로 채워드려요</p>
          </div>
        </button>

        <button
          onClick={onNo}
          className="flex items-center gap-4 px-4 py-4 w-full text-left transition-all hover:bg-[#F7F7F7] active:scale-[0.99]"
        >
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-[#222222]">아니요, 직접 입력할게요</p>
            <p className="text-[13px] text-[#717171] mt-0.5">주소와 숙소 정보를 직접 입력합니다</p>
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
    <div className="flex flex-col gap-8 animate-fade-up-fast">
      <div>
        <h2
          className="text-2xl sm:text-3xl font-semibold tracking-tight text-on-surface leading-tight"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          에어비앤비 링크를
          <br />입력해주세요
        </h2>
      </div>

      <CompoundInput>
        <FloatingTextarea
          id="airbnb-url"
          label="에어비앤비 숙소 링크"
          value={url}
          onChange={(e) => {
            let val = e.target.value
            // Strip query params from airbnb URL on paste
            if (val.includes('airbnb') && val.includes('?')) {
              val = val.split('?')[0]
            }
            setUrl(val)
            onUrlChange(val)
          }}
          placeholder="https://airbnb.com/rooms/12345678"
          autoComplete="off"
          borderRadius="12px"
        />
      </CompoundInput>
      <AirbnbLinkHelp />

      {error && (
        <div className="flex items-center gap-2 text-sm text-brand bg-brand/8 border border-brand/20 px-4 py-3 rounded-xl">
          <span>!</span>
          {error}
        </div>
      )}

      <div className="flex gap-3">
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
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ roadAddress: string; jibunAddress: string; zonecode: string; buildingName: string }[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleQueryChange(val: string) {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.trim().length < 2) {
      setResults([])
      setShowResults(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const key = process.env.NEXT_PUBLIC_JUSO_API_KEY
        if (!key) return
        const url = new URL('https://business.juso.go.kr/addrlink/addrLinkApi.do')
        url.searchParams.set('confmKey', key)
        url.searchParams.set('keyword', val)
        url.searchParams.set('currentPage', '1')
        url.searchParams.set('countPerPage', '10')
        url.searchParams.set('resultType', 'json')
        const res = await fetch(url.toString())
        const json = await res.json()
        const juso = json.results?.juso ?? []
        setResults(juso.map((item: Record<string, string>) => ({
          roadAddress: item.roadAddr ?? '',
          jibunAddress: item.jibunAddr ?? '',
          zonecode: item.zipNo ?? '',
          buildingName: item.bdNm ?? '',
        })))
        setShowResults(true)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 500)
  }

  function handleSelect(result: typeof results[0]) {
    const address = result.roadAddress || result.jibunAddress
    setForm((prev) => ({ ...prev, zonecode: result.zonecode, address }))
    setQuery('')
    setResults([])
    setShowResults(false)
    setError(null)
    // Focus detail input after slide-down animation
    setTimeout(() => {
      document.getElementById('addressDetail')?.focus()
    }, 380)
  }

  function handleNext() {
    if (!form.address.trim()) {
      setError('주소를 검색해주세요.')
      return
    }
    onNext(form)
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-up-fast">
      <div>
        <h2
          className="text-2xl sm:text-3xl font-semibold tracking-tight text-on-surface leading-tight"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          숙소 주소를
          <br />알려주세요
        </h2>
      </div>

      <div ref={containerRef}>
        <div className={`rounded-xl border border-[#B0B0B0] ${form.address ? 'divide-y divide-[#B0B0B0]' : ''}`}>
          {/* 주소 검색 / 선택된 주소 */}
          {!form.address ? (
            <CompoundField
              label="주소 검색"
              focused={focused}
              borderRadius="12px"
            >
              <input
                type="search"
                enterKeyHint="search"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur() } }}
                onFocus={() => { setFocused(true); if (results.length > 0) setShowResults(true) }}
                onBlur={() => setFocused(false)}
                placeholder="도로명 주소 또는 지번을 입력하세요"
                className="w-full bg-transparent text-[16px] text-[#222222] placeholder:text-[#C0C0C0] outline-none [&::-webkit-search-cancel-button]:hidden"
                autoComplete="off"
              />
            </CompoundField>
          ) : (
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, zonecode: '', address: '' }))}
              className="relative w-full px-4 pt-[22px] pb-[10px] text-left bg-[#F7F7F7] rounded-t-xl hover:bg-[#EFEFEF] transition-colors"
            >
              <span className="absolute top-[8px] left-4 text-[11px] font-semibold uppercase tracking-wider text-[#717171]">
                주소
              </span>
              <p className="text-[16px] text-[#222222]">{form.address}</p>
              <span className="absolute top-[8px] right-4 text-[11px] text-[#717171]">변경</span>
            </button>
          )}

          {/* 상세 주소 — slide down */}
          <div
            style={{
              maxHeight: form.address ? 80 : 0,
              opacity: form.address ? 1 : 0,
              transition: 'max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease',
              overflow: 'hidden',
            }}
          >
            <CompoundField label="상세 주소">
              <input
                id="addressDetail"
                placeholder="예: 3층 301호"
                value={form.addressDetail}
                onChange={(e) => setForm((prev) => ({ ...prev, addressDetail: e.target.value }))}
                className="w-full bg-transparent text-[16px] text-[#222222] placeholder:text-[#C0C0C0] outline-none"
              />
            </CompoundField>
          </div>
        </div>

      </div>

      {/* 검색 결과 목록 */}
      {showResults && results.length > 0 && (
        <div className="rounded-xl border border-[#EBEBEB] overflow-hidden shadow-sm -mt-2">
          {results.map((r, i) => (
            <div key={i}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleSelect(r) }}
                className="w-full text-left py-3 px-4 hover:bg-[#F7F7F7] transition-colors"
              >
                <p className="text-[15px] text-[#222222]">
                  {r.roadAddress}
                  {r.buildingName && <span className="text-[#717171] ml-1.5">({r.buildingName})</span>}
                </p>
                {r.jibunAddress && (
                  <p className="text-[13px] text-[#717171] mt-0.5">{r.jibunAddress}</p>
                )}
              </button>
              {i < results.length - 1 && <div className="h-px bg-[#EBEBEB] mx-4" />}
            </div>
          ))}
        </div>
      )}

      {showResults && !searching && results.length === 0 && query.trim().length >= 2 && (
        <div className="rounded-xl border border-[#EBEBEB] py-4 text-center text-[14px] text-[#717171] -mt-2">
          검색 결과가 없습니다
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-brand bg-brand/8 border border-brand/20 px-4 py-3 rounded-xl">
          <span>!</span>
          {error}
        </div>
      )}

      <div className="flex gap-3">
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

  const [name, setName] = useState(defaultName)
  const [zonecode, setZonecode] = useState(initialZonecode)
  const [address, setAddress] = useState(initialAddress)
  const [addressDetail, setAddressDetail] = useState(initialAddressDetail)
  const [focused, setFocused] = useState<string | null>(null)

  // Address search state
  const [addrQuery, setAddrQuery] = useState('')
  const [addrResults, setAddrResults] = useState<{ roadAddress: string; jibunAddress: string; zonecode: string; buildingName: string }[]>([])
  const [addrSearching, setAddrSearching] = useState(false)
  const [showAddrResults, setShowAddrResults] = useState(false)
  const addrDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const addrContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (addrContainerRef.current && !addrContainerRef.current.contains(e.target as Node)) {
        setShowAddrResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleAddrQueryChange(val: string) {
    setAddrQuery(val)
    if (addrDebounceRef.current) clearTimeout(addrDebounceRef.current)
    if (val.trim().length < 2) {
      setAddrResults([])
      setShowAddrResults(false)
      return
    }
    addrDebounceRef.current = setTimeout(async () => {
      setAddrSearching(true)
      try {
        const key = process.env.NEXT_PUBLIC_JUSO_API_KEY
        if (!key) return
        const url = new URL('https://business.juso.go.kr/addrlink/addrLinkApi.do')
        url.searchParams.set('confmKey', key)
        url.searchParams.set('keyword', val)
        url.searchParams.set('currentPage', '1')
        url.searchParams.set('countPerPage', '10')
        url.searchParams.set('resultType', 'json')
        const res = await fetch(url.toString())
        const json = await res.json()
        const juso = json.results?.juso ?? []
        setAddrResults(juso.map((item: Record<string, string>) => ({
          roadAddress: item.roadAddr ?? '',
          jibunAddress: item.jibunAddr ?? '',
          zonecode: item.zipNo ?? '',
          buildingName: item.bdNm ?? '',
        })))
        setShowAddrResults(true)
      } catch {
        setAddrResults([])
      } finally {
        setAddrSearching(false)
      }
    }, 500)
  }

  function handleAddrSelect(result: typeof addrResults[0]) {
    setAddress(result.roadAddress || result.jibunAddress)
    setZonecode(result.zonecode)
    setAddrQuery('')
    setAddrResults([])
    setShowAddrResults(false)
    setTimeout(() => {
      document.getElementById('register-addressDetail')?.focus()
    }, 380)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)
    setErrors({})
    setMessage(undefined)
    onClearProgress()

    const body = {
      name: name.trim(),
      address,
      addressDetail: addressDetail.trim() || undefined,
      propertyType: 'apartment',
      airbnbListingId: airbnbListingId || undefined,
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
    <div className="flex flex-col gap-6 animate-fade-up-fast">
      <div>
        <h2
          className="text-2xl sm:text-3xl font-semibold tracking-tight text-on-surface leading-tight"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {airroiDetail ? '숙소 정보를' : '숙소 정보를'}
          <br />{airroiDetail ? '확인해주세요' : '입력해주세요'}
        </h2>
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


      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <div ref={addrContainerRef}>
          <div className="rounded-xl border border-[#B0B0B0]">
            {/* 숙소 이름 */}
            <FloatingTextarea
              id="register-name"
              label="숙소 이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocused('name')}
              onBlur={() => setFocused(null)}
              placeholder="예: 합정 감성 아파트"
              borderRadius="12px 12px 0 0"
              error={errors.name?.[0]}
            />

            {/* 주소 검색 / 선택된 주소 */}
            <div className="border-t border-[#B0B0B0]" />
            {!address ? (
              <CompoundField
                label="주소 검색"
                focused={focused === 'address'}
                borderRadius={`0 0 12px 12px`}
              >
                <input
                  type="search"
                  enterKeyHint="search"
                  value={addrQuery}
                  onChange={(e) => handleAddrQueryChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur() } }}
                  onFocus={() => { setFocused('address'); if (addrResults.length > 0) setShowAddrResults(true) }}
                  onBlur={() => setFocused(null)}
                  placeholder="도로명 주소 또는 지번을 입력하세요"
                  className="w-full bg-transparent text-[16px] text-[#222222] placeholder:text-[#C0C0C0] outline-none [&::-webkit-search-cancel-button]:hidden"
                  autoComplete="off"
                />
                {errors.address?.[0] && (
                  <p className="text-[12px] text-[#C13515] mt-1">{errors.address[0]}</p>
                )}
              </CompoundField>
            ) : (
              <button
                type="button"
                onClick={() => setAddress('')}
                className="relative w-full px-4 pt-[26px] pb-[10px] text-left bg-[#F7F7F7] hover:bg-[#EFEFEF] transition-colors"
              >
                <span className="absolute top-[8px] left-4 text-[11px] font-semibold uppercase tracking-wider text-[#717171]">
                  주소
                </span>
                <p className="text-[16px] text-[#222222]">{address}</p>
                <span className="absolute top-[8px] right-4 text-[11px] text-[#717171]">변경</span>
              </button>
            )}

            {/* 상세 주소 — slide down */}
            <div
              style={{
                maxHeight: address ? 80 : 0,
                opacity: address ? 1 : 0,
                transition: 'max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease',
                overflow: 'hidden',
              }}
            >
              <div className="border-t border-[#B0B0B0]" />
              <div className="relative px-4 pt-[26px] pb-[10px]">
                <label
                  htmlFor="register-addressDetail"
                  className="absolute top-[8px] left-4 text-[11px] font-semibold uppercase tracking-wider text-[#717171]"
                >
                  상세 주소
                </label>
                <input
                  id="register-addressDetail"
                  placeholder="예: 3층 301호"
                  value={addressDetail}
                  onChange={(e) => setAddressDetail(e.target.value)}
                  className="w-full bg-transparent text-[16px] text-[#222222] placeholder:text-[#C0C0C0] outline-none"
                />
              </div>
            </div>
          </div>

          {/* 검색 결과 목록 */}
          {showAddrResults && addrResults.length > 0 && (
            <div className="rounded-xl border border-[#EBEBEB] overflow-hidden shadow-sm mt-2">
              {addrResults.map((r, i) => (
                <div key={i}>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleAddrSelect(r) }}
                    className="w-full text-left py-3 px-4 hover:bg-[#F7F7F7] transition-colors"
                  >
                    <p className="text-[15px] text-[#222222]">
                      {r.roadAddress}
                      {r.buildingName && <span className="text-[#717171] ml-1.5">({r.buildingName})</span>}
                    </p>
                    {r.jibunAddress && (
                      <p className="text-[13px] text-[#717171] mt-0.5">{r.jibunAddress}</p>
                    )}
                  </button>
                  {i < addrResults.length - 1 && <div className="h-px bg-[#EBEBEB] mx-4" />}
                </div>
              ))}
            </div>
          )}

          {showAddrResults && !addrSearching && addrResults.length === 0 && addrQuery.trim().length >= 2 && (
            <div className="rounded-xl border border-[#EBEBEB] py-4 text-center text-[14px] text-[#717171] mt-2">
              검색 결과가 없습니다
            </div>
          )}
        </div>

        {message && (
          <div className="flex items-center gap-2 text-sm text-brand bg-brand/8 border border-brand/20 px-4 py-3 rounded-xl">
            <span>!</span>
            {message}
          </div>
        )}

        <div className="flex">
          <PrimaryButton type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                등록 중...
              </>
            ) : (
              '숙소 등록하기'
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
