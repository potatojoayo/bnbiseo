export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 flex md:items-center items-start max-md:pt-[12vh] justify-center px-6 py-8 md:py-12">
        <div className="w-full max-w-[440px]">
          {children}
        </div>
      </main>
    </div>
  )
}
