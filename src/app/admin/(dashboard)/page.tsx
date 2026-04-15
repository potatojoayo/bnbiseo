'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
    api.get<Stats>('/admin/stats').then(setStats).catch(() => {})
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
              { label: '배정 대기', value: stats?.todayCleaning.pending ?? '-', color: 'text-brand', href: '/admin/cleaning?status=pending' },
              { label: '배정 완료', value: stats?.todayCleaning.confirmed ?? '-', color: 'text-[#2E7D32]', href: '/admin/cleaning?status=confirmed' },
              { label: '진행 중', value: stats?.todayCleaning.inProgress ?? '-', color: 'text-[#1565C0]', href: '/admin/cleaning?status=in_progress' },
              { label: '완료', value: stats?.todayCleaning.completed ?? '-', color: 'text-[#222222]', href: '/admin/cleaning?status=completed' },
            ].map((item) => (
              <Link key={item.label} href={item.href} className="rounded-xl border border-[#EBEBEB] px-4 py-4 hover:bg-[#F7F7F7] transition-colors">
                <p className="text-[12px] text-[#717171] mb-1">{item.label}</p>
                <p className={`text-[28px] font-semibold ${item.color}`}>{item.value}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick stats */}
        <div>
          <h2 className="text-[14px] font-medium text-[#717171] mb-3">전체 현황</h2>
          <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
            {[
              { label: '등록 숙소', value: stats?.totalProperties ?? '-', href: '/admin/properties' },
              { label: '회원 수', value: stats?.totalUsers ?? '-', href: '/admin/users' },
              { label: '매니저 수', value: stats?.totalManagers ?? '-', href: '/admin/managers' },
            ].map((item) => (
              <Link key={item.label} href={item.href} className="rounded-xl border border-[#EBEBEB] px-4 py-4 hover:bg-[#F7F7F7] transition-colors">
                <p className="text-[12px] text-[#717171] mb-1">{item.label}</p>
                <p className="text-[28px] font-semibold text-[#222222]">{item.value}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
