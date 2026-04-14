export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-[100dvh] bg-white flex flex-col">
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[440px]">
          {children}
        </div>
      </main>
    </div>
  )
}
