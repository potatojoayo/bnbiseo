'use client'

import { useEffect, useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { api } from '@/lib/api-client'

type Stats = {
  todayCleaning: { pending: number; confirmed: number; inProgress: number; completed: number }
  totalProperties: number
  totalUsers: number
  totalManagers: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    // TODO: admin stats API
    setStats({
      todayCleaning: { pending: 0, confirmed: 0, inProgress: 0, completed: 0 },
      totalProperties: 0,
      totalUsers: 0,
      totalManagers: 0,
    })
  }, [])

  return (
    <>
      <SiteHeader title="대시보드" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Today's cleaning summary */}
        <div>
          <h2 className="text-[14px] font-medium text-[#717171] mb-3">오늘의 청소</h2>
          <div className="grid grid-cols-4 gap-3 max-md:grid-cols-2">
            {[
              { label: '배정 대기', value: stats?.todayCleaning.pending ?? 0, color: 'text-brand' },
              { label: '배정 완료', value: stats?.todayCleaning.confirmed ?? 0, color: 'text-[#2E7D32]' },
              { label: '진행 중', value: stats?.todayCleaning.inProgress ?? 0, color: 'text-[#1565C0]' },
              { label: '완료', value: stats?.todayCleaning.completed ?? 0, color: 'text-[#222222]' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-[#EBEBEB] px-4 py-4">
                <p className="text-[12px] text-[#717171] mb-1">{item.label}</p>
                <p className={`text-[28px] font-semibold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick stats */}
        <div>
          <h2 className="text-[14px] font-medium text-[#717171] mb-3">전체 현황</h2>
          <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
            {[
              { label: '등록 숙소', value: stats?.totalProperties ?? 0 },
              { label: '회원 수', value: stats?.totalUsers ?? 0 },
              { label: '매니저 수', value: stats?.totalManagers ?? 0 },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-[#EBEBEB] px-4 py-4">
                <p className="text-[12px] text-[#717171] mb-1">{item.label}</p>
                <p className="text-[28px] font-semibold text-[#222222]">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
