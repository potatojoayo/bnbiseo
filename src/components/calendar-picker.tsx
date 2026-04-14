'use client'

import { useState, useCallback, useEffect } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { cn, nowKST } from '@/lib/utils'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function getMonthCells(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevDays = new Date(year, month, 0).getDate()

  const cells: { day: number; month: number; year: number; outside: boolean }[] = []

  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({
      day: prevDays - i,
      month: month === 0 ? 11 : month - 1,
      year: month === 0 ? year - 1 : year,
      outside: true,
    })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month, year, outside: false })
  }

  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    cells.push({
      day: d,
      month: month === 11 ? 0 : month + 1,
      year: month === 11 ? year + 1 : year,
      outside: true,
    })
  }

  return cells
}

function toIso(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** Generate months: from minDate's month to 12 months ahead */
function generateMonths(minDate: string) {
  const min = new Date(minDate + 'T00:00:00')
  const months: { year: number; month: number }[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(min.getFullYear(), min.getMonth() + i, 1)
    months.push({ year: d.getFullYear(), month: d.getMonth() })
  }
  return months
}

interface CalendarPickerProps {
  selected: string
  onSelect: (date: string) => void
  minDate?: string
}

export function CalendarPicker({ selected, onSelect, minDate }: CalendarPickerProps) {
  const today = nowKST()
  const todayIso = toIso(today.getFullYear(), today.getMonth(), today.getDate())
  const min = minDate ?? todayIso

  const months = generateMonths(min)

  // Find initial slide index based on selected date
  const selectedDate = new Date(selected + 'T00:00:00')
  const initialIndex = months.findIndex(
    (m) => m.year === selectedDate.getFullYear() && m.month === selectedDate.getMonth()
  )

  const [api, setApi] = useState<CarouselApi>()
  const [currentIndex, setCurrentIndex] = useState(Math.max(0, initialIndex))

  useEffect(() => {
    if (!api) return
    api.on('select', () => {
      setCurrentIndex(api.selectedScrollSnap())
    })
  }, [api])

  const scrollPrev = useCallback(() => api?.scrollPrev(), [api])
  const scrollNext = useCallback(() => api?.scrollNext(), [api])

  const currentMonth = months[currentIndex]
  const canPrev = currentIndex > 0

  return (
    <div className="w-full select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-3">
        <button
          type="button"
          onClick={scrollPrev}
          disabled={!canPrev}
          className="p-1.5 rounded-full hover:bg-[#F7F7F7] text-[#222222] disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronLeftIcon size={18} />
        </button>
        <span className="text-[15px] font-semibold text-[#222222]">
          {currentMonth ? `${currentMonth.year}년 ${currentMonth.month + 1}월` : ''}
        </span>
        <button
          type="button"
          onClick={scrollNext}
          disabled={currentIndex >= months.length - 1}
          className="p-1.5 rounded-full hover:bg-[#F7F7F7] text-[#222222] disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronRightIcon size={18} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-[13px] font-medium text-[#717171] text-center py-1.5">
            {w}
          </div>
        ))}
      </div>

      {/* Carousel */}
      <Carousel
        setApi={setApi}
        opts={{ startIndex: Math.max(0, initialIndex), loop: false }}
        className="w-full"
      >
        <CarouselContent>
          {months.map(({ year, month }, idx) => {
            const cells = getMonthCells(year, month)
            return (
              <CarouselItem key={`${year}-${month}`}>
                <div className="grid grid-cols-7">
                  {cells.map((cell, i) => {
                    const iso = toIso(cell.year, cell.month, cell.day)
                    const isSelected = iso === selected
                    const isToday = iso === todayIso
                    const isDisabled = iso < min || cell.outside

                    return (
                      <div key={i} className="flex items-center justify-center py-[3px]">
                        <button
                          type="button"
                          disabled={isDisabled}
                          onClick={() => !isDisabled && onSelect(iso)}
                          className={cn(
                            'w-[40px] h-[40px] rounded-full text-[14px] flex items-center justify-center transition-all',
                            isSelected
                              ? 'bg-[#222222] text-white font-semibold'
                              : isToday
                                ? 'font-bold text-[#222222] hover:bg-[#F7F7F7]'
                                : isDisabled
                                  ? 'text-[#D0D0D0] cursor-default'
                                  : 'text-[#222222] hover:bg-[#F7F7F7] active:scale-90',
                          )}
                        >
                          {cell.day}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
