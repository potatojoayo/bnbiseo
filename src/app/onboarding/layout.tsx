import { OnboardingProvider } from './onboarding-context'
import { OnboardingPanel } from './onboarding-panel'
import { MobileStepHeader } from './mobile-step-header'
import { ContentPanel } from './content-panel'

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
        <ContentPanel>
          <MobileStepHeader />

          <main className="flex-1 flex flex-col items-center justify-center px-6 py-10 lg:py-14">
            <div className="w-full max-w-[560px]">{children}</div>
          </main>
        </ContentPanel>
      </div>
    </OnboardingProvider>
  )
}
