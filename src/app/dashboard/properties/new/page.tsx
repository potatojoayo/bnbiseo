'use client'

import Link from 'next/link'
import { PropertyForm } from '../components/property-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export default function NewPropertyPage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/properties">
            <ArrowLeft className="h-4 w-4" />
            목록으로
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle style={{ fontFamily: 'var(--font-display)' }}>숙소 등록</CardTitle>
        </CardHeader>
        <CardContent>
          <PropertyForm submitLabel="숙소 등록" />
        </CardContent>
      </Card>
    </div>
  )
}
