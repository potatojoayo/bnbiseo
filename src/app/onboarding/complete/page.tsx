import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { properties } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { CheckIcon, MapPinIcon, PlusIcon, ArrowRightIcon } from 'lucide-react'
import { completeOnboarding } from '@/actions/profiles'

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export default async function CompletePage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const userProperties = await db
    .select({
      id: properties.id,
      name: properties.name,
      address: properties.address,
      addressDetail: properties.addressDetail,
      createdAt: properties.createdAt,
    })
    .from(properties)
    .where(eq(properties.hostId, user.id))
    .orderBy(properties.createdAt)

  if (userProperties.length === 0) redirect('/onboarding')

  return (
    <div className="flex flex-col gap-8 animate-fade-in-fast">
      {/* Success header */}
      <div className="flex flex-col gap-5">
        {/* Success icon — 명확하게 '성공/완료' 색상 사용 */}
        <div className="flex items-center gap-3">
          <div
            className="size-16 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(34,197,94,0.12)' }}
          >
            <div
              className="size-9 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(34,197,94,0.2)' }}
            >
              <CheckIcon
                className="size-5"
                style={{ color: '#16a34a' }}
                strokeWidth={2.5}
              />
            </div>
          </div>
          <div
            className="h-px flex-1"
            style={{ background: 'linear-gradient(to right, rgba(34,197,94,0.25), transparent)' }}
          />
        </div>

        <div>
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-2"
            style={{ color: '#16a34a', fontFamily: 'var(--font-body)' }}
          >
            등록 완료
          </p>
          <h2
            className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            숙소 등록이
            <br />완료되었어요!
          </h2>
          <p
            className="text-sm text-on-surface-subtle mt-2.5"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            이제 AI 공간 관리를 시작할 수 있어요.
          </p>
        </div>
      </div>

      {/* Property list */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-muted">
            등록된 숙소
          </p>
          <span
            className="text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full bg-surface-dim text-on-surface-muted"
          >
            {userProperties.length}개
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {userProperties.map((property, index) => (
            <div
              key={property.id}
              className="flex items-start gap-4 rounded-2xl border border-outline bg-white p-4"
            >
              {/* Number badge */}
              <div
                className="size-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold bg-surface-dim text-on-surface-muted"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {index + 1}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-on-surface leading-snug">
                  {property.name}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <MapPinIcon className="size-3 shrink-0 text-on-surface-muted" strokeWidth={1.75} />
                  <p className="text-xs text-on-surface-subtle truncate">
                    {property.address}
                    {property.addressDetail ? ` ${property.addressDetail}` : ''}
                  </p>
                </div>
                <p className="text-xs mt-1.5 text-on-surface-muted">
                  {formatDate(property.createdAt)} 등록
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <form action={completeOnboarding}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2.5 h-12 rounded-xl text-sm font-semibold text-white bg-brand transition-all duration-200 hover:scale-[1.03] group"
          >
            시작하기
            <ArrowRightIcon className="size-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2} />
          </button>
        </form>
        <Link
          href="/onboarding/add"
          className="flex items-center justify-center gap-2.5 h-11 rounded-xl text-sm font-medium text-on-surface-subtle border border-outline bg-white transition-all hover:border-outline-dim hover:text-on-surface active:scale-[0.99]"
        >
          <PlusIcon className="size-4" strokeWidth={2} />
          숙소 추가하기
        </Link>
      </div>
    </div>
  )
}
