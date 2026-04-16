'use client'

import { useState } from 'react'
import { supabase } from '@/lib/api-client'
import { api } from '@/lib/api-client'
import { X } from 'lucide-react'

interface Photo {
  id: string
  storagePath: string
  caption: string | null
  sortOrder: number | null
}

interface FixturePhotoGalleryProps {
  photos: Photo[]
  propertyId: string
  fixtureId: string
}

export function FixturePhotoGallery({ photos: initialPhotos, propertyId, fixtureId }: FixturePhotoGalleryProps) {
  const [photos, setPhotos] = useState(initialPhotos)

  function getPublicUrl(path: string) {
    const { data } = supabase.storage.from('fixture-photos').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleDelete(photoId: string) {
    if (!confirm('사진을 삭제하시겠습니까?')) return
    await api.delete(`/fixtures/photos/${photoId}`)
    setPhotos((prev) => prev.filter((p) => p.id !== photoId))
  }

  if (photos.length === 0) {
    return <p className="text-sm text-ink-faint">등록된 사진이 없습니다.</p>
  }

  return (
    <div className="flex flex-wrap gap-3">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="group relative h-24 w-24 overflow-hidden rounded-lg border border-outline"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getPublicUrl(photo.storagePath)}
            alt={photo.caption ?? ''}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={() => handleDelete(photo.id)}
            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 p-0.5 text-white hover:bg-black/80 m-0.5 rounded-full"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  )
}
