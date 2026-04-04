import Link from 'next/link'
import { OnboardingProvider } from './onboarding-context'
import { OnboardingPanel } from './onboarding-panel'

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <OnboardingProvider>
      <div className="min-h-screen flex overflow-hidden">
        {/* Left brand panel with dynamic steps */}
        <OnboardingPanel />

        {/* Right content panel */}
        <div
          className="flex-1 flex flex-col overflow-y-auto"
          style={{ backgroundColor: '#F6F4F0' }}
        >
          {/* Mobile-only header */}
          <header className="flex items-center justify-between px-6 py-5 lg:hidden border-b border-[#E8E3DC] shrink-0">
            <Link href="/">
              <span
                className="text-xl font-bold tracking-tight"
                style={{ fontFamily: 'var(--font-display)', color: '#D4421E' }}
              >
                비엔비서
              </span>
            </Link>
          </header>

          <main className="flex-1 flex flex-col items-center justify-center px-6 py-10 lg:py-14">
            <div className="w-full max-w-[560px]">{children}</div>
          </main>
        </div>
      </div>
    </OnboardingProvider>
  )
}
