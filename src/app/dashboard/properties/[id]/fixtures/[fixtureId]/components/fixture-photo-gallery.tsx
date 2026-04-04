'use client'

import { createClient } from '@/lib/supabase/client'
import { deleteFixturePhoto } from '@/actions/fixtures'
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

export function FixturePhotoGallery({ photos, propertyId, fixtureId }: FixturePhotoGalleryProps) {
  const supabase = createClient()

  function getPublicUrl(path: string) {
    const { data } = supabase.storage.from('fixture-photos').getPublicUrl(path)
    return data.publicUrl
  }

  if (photos.length === 0) {
    return <p className="text-sm text-[#9ca3af]">등록된 사진이 없습니다.</p>
  }

  return (
    <div className="flex flex-wrap gap-3">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="relative w-24 h-24 rounded-lg overflow-hidden border border-[#D1C9BC] group"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getPublicUrl(photo.storagePath)}
            alt={photo.caption ?? ''}
            className="w-full h-full object-cover"
          />
          <form
            action={deleteFixturePhoto}
            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <input type="hidden" name="photoId" value={photo.id} />
            <input type="hidden" name="propertyId" value={propertyId} />
            <input type="hidden" name="fixtureId" value={fixtureId} />
            <button
              type="submit"
              onClick={(e) => {
                if (!confirm('사진을 삭제하시겠습니까?')) e.preventDefault()
              }}
              className="bg-black/60 p-0.5 text-white hover:bg-black/80 m-0.5 rounded-full"
            >
              <X className="h-3 w-3" />
            </button>
          </form>
        </div>
      ))}
    </div>
  )
}
