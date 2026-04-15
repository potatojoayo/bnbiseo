'use client'

import { useEffect, useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { api } from '@/lib/api-client'
import { MapPinIcon } from 'lucide-react'

type Property = {
  id: string
  name: string
  address: string
  pyeong: number | null
  bedrooms: number
  bathrooms: number
  hostName: string | null
  hostEmail: string | null
  createdAt: string
}

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Property[]>('/admin/properties').then((data) => {
      setProperties(data)
      setLoading(false)
    })
  }, [])

  return (
    <>
      <SiteHeader title="숙소 관리" />
      <div className="flex flex-1 flex-col p-6">
        <p className="text-[14px] text-[#717171] mb-6">총 {properties.length}개</p>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-[#EBEBEB] border-t-[#717171] animate-spin" />
          </div>
        ) : properties.length === 0 ? (
          <p className="text-center text-[14px] text-[#717171] py-20">등록된 숙소가 없어요</p>
        ) : (
          <div className="flex flex-col gap-3">
            {properties.map((p) => {
              const details = [
                p.pyeong && `${p.pyeong}평`,
                `방 ${p.bedrooms}`,
                `욕실 ${p.bathrooms}`,
              ].filter(Boolean)

              return (
                <div key={p.id} className="rounded-xl border border-[#EBEBEB] px-4 py-4">
                  <p className="text-[15px] font-semibold text-[#222222]">{p.name}</p>
                  {details.length > 0 && (
                    <p className="text-[13px] text-[#717171] mt-0.5">{details.join(' · ')}</p>
                  )}
                  <p className="text-[12px] text-[#B0B0B0] mt-0.5 flex items-center gap-0.5">
                    <MapPinIcon size={11} strokeWidth={1.75} />
                    {p.address}
                  </p>
                  <p className="text-[12px] text-[#717171] mt-2">
                    호스트: {p.hostName || p.hostEmail || '-'}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
