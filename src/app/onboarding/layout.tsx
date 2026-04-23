import Link from 'next/link'
import { Logo } from '@/components/logo'

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-white flex flex-col items-center px-6 pt-24 max-md:pt-8 pb-8">
      <div className="w-full max-w-[560px]">
        <div className="text-center mb-8">
          <Link href="/"><Logo size="lg" /></Link>
        </div>
        {children}
      </div>
    </div>
  )
}
