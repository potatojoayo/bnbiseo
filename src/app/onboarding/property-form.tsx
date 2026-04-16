'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeftIcon, Loader2Icon } from 'lucide-react'
import { LoadingButton } from '@/components/ui/loading-button'
import { api, ApiError } from '@/lib/api-client'
import { useInvalidateProperties } from '@/lib/hooks/use-properties'
import { useAirbnbListing } from '@/lib/hooks/use-airbnb-listing'
import { FloatingTextarea, CompoundField } from '@/components/ui/floating-input'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

type PropertyData = {
  id?: string
  status?: 'pending_activation' | 'active'
  name?: string
  address?: string
  addressDetail?: string | null
  airbnbListingId?: string | null
}

type PropertyFormProps = {
  backHref?: string
  mode?: 'create' | 'edit'
  initialData?: PropertyData
  redirectTo?: string
  title?: string
  animated?: boolean
}

export function PropertyForm({ backHref, mode = 'create', initialData, redirectTo, title, animated = true }: PropertyFormProps) {
  const router = useRouter()
  const invalidateProperties = useInvalidateProperties()
  const [isPending, setIsPending] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [message, setMessage] = useState<string | undefined>()
  const [focused, setFocused] = useState<string | null>(null)
  const isAddressLocked = mode === 'edit' && initialData?.status === 'active'

  // Form fields
  const [name, setName] = useState(initialData?.name ?? '')
  const [address, setAddress] = useState(initialData?.address ?? '')
  const [addressDetail, setAddressDetail] = useState(initialData?.addressDetail ?? '')
  const [airbnbUrl, setAirbnbUrl] = useState(initialData?.airbnbListingId ?? '')
  const [debouncedAirbnbInput, setDebouncedAirbnbInput] = useState(initialData?.airbnbListingId ?? '')

  const airbnbDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Address search
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

  useEffect(() => {
    if (mode === 'edit') {
      setDebouncedAirbnbInput('')
      return
    }

    if (airbnbDebounceRef.current) clearTimeout(airbnbDebounceRef.current)
    airbnbDebounceRef.current = setTimeout(() => {
      setDebouncedAirbnbInput(airbnbUrl)
    }, 800)

    return () => {
      if (airbnbDebounceRef.current) clearTimeout(airbnbDebounceRef.current)
    }
  }, [airbnbUrl, mode])

  const {
    data: airbnbPreview,
    isLoading: airbnbFetching,
    isError: airbnbPreviewError,
  } = useAirbnbListing(debouncedAirbnbInput, {
    enabled: mode !== 'edit',
  })

  const airbnbError = mode !== 'edit'
    && debouncedAirbnbInput.trim()
    && !airbnbFetching
    && airbnbPreviewError
    ? '숙소 정보를 가져올 수 없습니다. 링크를 확인해주세요.'
    : null

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
    setAddrQuery('')
    setAddrResults([])
    setShowAddrResults(false)
    if (errors.address) setErrors((prev) => { const { address: _, ...rest } = prev; return rest })
    setTimeout(() => {
      document.getElementById('onboarding-addressDetail')?.focus()
    }, 380)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)
    setErrors({})
    setMessage(undefined)

    const newErrors: Record<string, string[]> = {}
    if (!name.trim()) newErrors.name = ['숙소 이름을 알려주세요']
    if (!address) newErrors.address = ['주소를 검색해주세요']
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsPending(false)
      return
    }

    // Clean airbnb URL
    let cleanUrl = airbnbUrl.trim()
    if (cleanUrl.includes('airbnb') && cleanUrl.includes('?')) {
      cleanUrl = cleanUrl.split('?')[0]
    }

    const body = {
      name: name.trim(),
      address,
      addressDetail: addressDetail.trim() || undefined,
      airbnbListingId: cleanUrl || undefined,
    }

    try {
      let createdId: string | undefined
      if (mode === 'edit' && initialData?.id) {
        await api.patch(`/properties/${initialData.id}`, body)
      } else {
        const created = await api.post<{ id: string }>('/properties', body)
        createdId = created.id
      }
      await invalidateProperties()
      const dest = redirectTo ?? '/onboarding/complete'
      router.push(createdId ? `${dest}?propertyId=${createdId}` : dest, { scroll: false })
    } catch (err) {
      if (err instanceof ApiError && err.data.errors) {
        setErrors(err.data.errors as Record<string, string[]>)
      } else if (err instanceof ApiError) {
        setMessage(err.message)
      } else {
        setMessage(mode === 'edit' ? '수정 중 문제가 생겼어요. 다시 시도해주세요' : '등록 중 문제가 생겼어요. 다시 시도해주세요')
      }
      setIsPending(false)
    }
  }

  return (
    <div className={`flex flex-col gap-6 ${animated ? 'animate-fade-up-fast' : ''}`}>
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-[13px] text-[#717171] hover:text-[#222222] transition-colors"
        >
          <ArrowLeftIcon className="size-3.5" />
          돌아가기
        </Link>
      )}
      <div>
        <h2
          className="text-2xl sm:text-3xl font-semibold tracking-tight text-on-surface leading-tight"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {title
            ? title
            : mode === 'edit'
              ? <>숙소 정보를<br />수정해주세요</>
              : backHref
                ? <>숙소 정보를<br />추가해주세요</>
                : <>첫 숙소 등록을<br />신청해주세요</>
          }
        </h2>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <div ref={addrContainerRef}>
          <div className="rounded-xl border border-[#B0B0B0]">
            {/* 숙소 이름 */}
            <FloatingTextarea
              id="onboarding-name"
              label="숙소 이름"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (errors.name) setErrors((prev) => { const { name: _, ...rest } = prev; return rest })
              }}
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
                borderRadius="0 0 12px 12px"
              >
                <input
                  type="search"
                  enterKeyHint="search"
                  value={addrQuery}
                  onChange={(e) => handleAddrQueryChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                  onFocus={() => { setFocused('address'); if (addrResults.length > 0) setShowAddrResults(true) }}
                  onBlur={() => setFocused(null)}
                  placeholder="도로명 주소 또는 지번을 입력하세요"
                  disabled={isAddressLocked}
                  className="w-full bg-transparent text-[16px] text-[#222222] placeholder:text-[#C0C0C0] outline-none [&::-webkit-search-cancel-button]:hidden"
                  autoComplete="off"
                />
                {errors.address?.[0] && (
                  <p className="text-[12px] text-[#C13515] mt-1">{errors.address[0]}</p>
                )}
              </CompoundField>
            ) : (
              isAddressLocked ? (
                <div className="relative w-full px-4 pt-[26px] pb-[10px] text-left bg-[#F7F7F7]">
                  <span className="absolute top-[8px] left-4 text-[11px] font-semibold uppercase tracking-wider text-[#717171]">
                    주소
                  </span>
                  <p className="text-[16px] text-[#222222]">{address}</p>
                  <span className="absolute top-[8px] right-4 text-[11px] text-[#B0B0B0]">등록 완료 후 잠금</span>
                </div>
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
              )
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
                  htmlFor="onboarding-addressDetail"
                  className="absolute top-[8px] left-4 text-[11px] font-semibold uppercase tracking-wider text-[#717171]"
                >
                  상세 주소
                </label>
                <input
                  id="onboarding-addressDetail"
                  placeholder="예: 3층 301호"
                  value={addressDetail}
                  onChange={(e) => setAddressDetail(e.target.value)}
                  disabled={isAddressLocked}
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

        {/* 에어비앤비 링크 (선택) */}
        <div className="rounded-xl border border-[#B0B0B0]">
          <FloatingTextarea
            id="onboarding-airbnb-url"
            label="에어비앤비 링크 (선택)"
            value={airbnbUrl}
            onChange={(e) => {
              let val = e.target.value
              if (val.includes('airbnb') && val.includes('?')) {
                val = val.split('?')[0]
              }
              setAirbnbUrl(val)
            }}
            placeholder="https://airbnb.com/rooms/12345678"
            borderRadius="12px"
          />
        </div>

        {/* Fetching indicator */}
        {mode !== 'edit' && airbnbFetching && (
          <div className="flex items-center gap-2 text-[13px] text-[#717171] -mt-4">
            <Loader2Icon className="size-3.5 animate-spin" />
            숙소 정보를 가져오는 중...
          </div>
        )}

        {/* Fetch error */}
        {mode !== 'edit' && airbnbError && !airbnbFetching && (
          <div className="text-[13px] text-[#C13515] -mt-4">
            {airbnbError}
          </div>
        )}

        {/* Preview card */}
        {mode !== 'edit' && airbnbPreview && !airbnbFetching && !airbnbError && (
          <div className="rounded-xl border border-[#EBEBEB] overflow-hidden -mt-4 animate-fade-up-fast">
            {airbnbPreview.imageUrl && (
              <div className="relative w-full h-40">
                <Image
                  src={airbnbPreview.imageUrl}
                  alt={airbnbPreview.name}
                  fill
                  className="object-cover"
                  sizes="560px"
                  unoptimized
                />
              </div>
            )}
            <div className="px-4 py-3">
              <p className="text-[15px] font-semibold text-[#222222] leading-snug">{airbnbPreview.name}</p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5 text-[13px] text-[#717171]">
                {airbnbPreview.location && <span>{airbnbPreview.location}</span>}
                {airbnbPreview.rating && <span>★ {airbnbPreview.rating}</span>}
                {airbnbPreview.bedrooms != null && <span>침실 {airbnbPreview.bedrooms}</span>}
                {airbnbPreview.beds != null && <span>침대 {airbnbPreview.beds}</span>}
                {airbnbPreview.bathrooms != null && <span>욕실 {airbnbPreview.bathrooms}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Help — only show when no preview */}
        {!airbnbPreview && !airbnbFetching && (
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="text-[13px] text-[#717171] underline underline-offset-2 hover:text-[#222222] transition-colors -mt-4"
          >
            링크는 어디서 복사하나요?
          </button>
        )}
        <Drawer open={helpOpen} onOpenChange={setHelpOpen}>
          <DrawerContent>
            <div className="mx-auto w-full max-w-[440px] px-6 pb-8">
              <DrawerHeader className="px-0">
                <DrawerTitle className="text-[18px] font-semibold text-[#222222]">
                  에어비앤비 숙소 링크 복사 방법
                </DrawerTitle>
              </DrawerHeader>
              <div className="flex flex-col gap-4 mt-2">
                {[
                  { num: 1, text: '에어비앤비 앱 또는 웹사이트를 열어주세요' },
                  { num: 2, text: '등록된 숙소의 상세 페이지로 이동하세요' },
                  { num: 3, text: '공유 버튼을 눌러 링크를 복사하세요' },
                  { num: 4, text: '복사한 링크를 위 입력란에 붙여넣으세요' },
                ].map((step) => (
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
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="w-full h-12 rounded-lg text-[15px] font-semibold text-white mt-6 bg-[#222222] transition-all active:scale-[0.98]"
              >
                확인
              </button>
            </div>
          </DrawerContent>
        </Drawer>

        {message && (
          <div className="flex items-center gap-2 text-sm text-brand bg-brand/8 border border-brand/20 px-4 py-3 rounded-xl">
            <span>!</span>
            {message}
          </div>
        )}

        {mode === 'create' && (
          <div className="rounded-xl border border-[#EBEBEB] bg-[#FAFAFA] px-4 py-4 text-[13px] leading-relaxed text-[#717171]">
            숙소 등록 후 48시간 이내에 비앤비서가 직접 방문해 운영 정보를 확인하고 등록을 완료해드려요.
          </div>
        )}

        <LoadingButton
          type="submit"
          loading={isPending}
          loadingText={mode === 'edit' ? '수정 중...' : '신청 중...'}
          disabled={airbnbFetching}
        >
          {mode === 'edit' ? '저장하기' : '숙소 등록 신청하기'}
        </LoadingButton>
      </form>
    </div>
  )
}
