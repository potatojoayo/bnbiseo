import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#EBEBEB] px-6 h-16 flex items-center">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--brand)' }}
        >
          비앤비서
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-start md:items-center justify-center px-6 py-8 md:py-12">
        <div className="w-full max-w-[440px]">
          {children}
        </div>
      </main>
    </div>
  )
}
