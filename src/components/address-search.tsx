'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Loader2Icon, SearchIcon, MapPinIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type AddressResult = {
  roadAddress: string
  jibunAddress: string
  zonecode: string
  buildingName: string
}

type Props = {
  onSelect: (zonecode: string, address: string) => void
  placeholder?: string
  className?: string
}

async function searchAddress(query: string): Promise<AddressResult[]> {
  const key = process.env.NEXT_PUBLIC_JUSO_API_KEY
  if (!key) throw new Error('JUSO API key is not set')

  const url = new URL('https://business.juso.go.kr/addrlink/addrLinkApi.do')
  url.searchParams.set('confmKey', key)
  url.searchParams.set('keyword', query)
  url.searchParams.set('currentPage', '1')
  url.searchParams.set('countPerPage', '10')
  url.searchParams.set('resultType', 'json')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('주소 검색에 실패했습니다.')

  const json = await res.json()
  const juso = json.results?.juso ?? []

  return juso.map((item: Record<string, string>) => ({
    roadAddress: item.roadAddr ?? '',
    jibunAddress: item.jibunAddr ?? '',
    zonecode: item.zipNo ?? '',
    buildingName: item.bdNm ?? '',
  }))
}

export function AddressSearch({ onSelect, placeholder = '도로명 주소를 입력하세요', className }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AddressResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [error, setError] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const data = await searchAddress(q)
      setResults(data)
      setIsOpen(true)
      setActiveIndex(-1)
    } catch {
      setError('주소 검색 중 오류가 발생했습니다.')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      doSearch(val)
    }, 200)
  }

  function handleSelect(result: AddressResult) {
    const address = result.roadAddress || result.jibunAddress
    onSelect(result.zonecode, address)
    setQuery(address)
    setIsOpen(false)
    setResults([])
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && activeIndex < results.length) {
        handleSelect(results[activeIndex])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const showEmpty = isOpen && !isLoading && results.length === 0 && query.trim().length >= 2

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-subtle pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setIsOpen(true) }}
          placeholder={placeholder}
          className="h-10 text-sm pl-9 pr-9"
          autoComplete="new-password"
          autoCorrect="off"
          spellCheck={false}
          name="address-search-nonautocomplete"
        />
        {isLoading && (
          <Loader2Icon className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-subtle animate-spin pointer-events-none" />
        )}
      </div>

      {(isOpen || showEmpty) && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-outline bg-white shadow-lg overflow-hidden">
          {showEmpty ? (
            <div className="py-4 px-4 text-sm text-on-surface-subtle text-center">
              검색 결과가 없습니다
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto" style={{ scrollbarWidth: 'none' }} onMouseLeave={() => setActiveIndex(-1)}>
              <ul>
                {results.map((result, idx) => (
                  <li key={idx}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleSelect(result)
                      }}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={cn(
                        'w-full text-left py-3 px-4 flex items-start gap-3 transition-colors',
                        idx === activeIndex ? 'bg-black/[0.03]' : 'hover:bg-black/[0.03]',
                      )}
                    >
                      <MapPinIcon className="size-4 text-on-surface-subtle shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-on-surface truncate">
                          {result.roadAddress}
                          {result.buildingName && (
                            <span className="text-on-surface-subtle font-normal ml-1.5">({result.buildingName})</span>
                          )}
                        </p>
                        {result.jibunAddress && (
                          <p className="text-xs text-on-surface-subtle truncate mt-0.5">{result.jibunAddress}</p>
                        )}
                      </div>
                      {result.zonecode && (
                        <span className="text-xs text-on-surface-subtle shrink-0 mt-0.5 font-mono">{result.zonecode}</span>
                      )}
                    </button>
                    {idx < results.length - 1 && (
                      <div className="h-px bg-outline" />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {error && (
            <div className="py-3 px-4 text-sm text-brand text-center border-t border-outline">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
