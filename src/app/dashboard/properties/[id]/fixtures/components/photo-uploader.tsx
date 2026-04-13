'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { ImagePlus, X, Loader2 } from 'lucide-react'

interface PhotoUploaderProps {
  /** Folder prefix in Supabase Storage (e.g. "fixtures/fixture-id") */
  folder: string
  /** Called when upload completes with the storage path */
  onUploaded: (paths: string[]) => void
}

export function PhotoUploader({ folder, onUploaded }: PhotoUploaderProps) {
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadedPaths, setUploadedPaths] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const newPreviews = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }))
    setPreviews((prev) => [...prev, ...newPreviews])
  }

  function removePreview(index: number) {
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index].url)
      return prev.filter((_, i) => i !== index)
    })
  }

  async function upload() {
    if (previews.length === 0) return
    setUploading(true)

    const paths: string[] = []
    for (const { file } of previews) {
      const ext = file.name.split('.').pop()
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage
        .from('fixture-photos')
        .upload(path, file, { upsert: false })

      if (!error) {
        paths.push(path)
      }
    }

    setUploadedPaths((prev) => [...prev, ...paths])
    onUploaded([...uploadedPaths, ...paths])
    setPreviews([])
    setUploading(false)
  }

  return (
    <div className="space-y-3">
      {/* Preview thumbnails */}
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previews.map((p, i) => (
            <div key={p.url} className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#D1C9BC]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePreview(i)}
                className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 text-white hover:bg-black/80"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded count indicator */}
      {uploadedPaths.length > 0 && (
        <p className="text-xs text-green-600">{uploadedPaths.length}장 업로드 완료</p>
      )}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="h-4 w-4" />
          사진 선택
        </Button>

        {previews.length > 0 && (
          <Button
            type="button"
            size="sm"
            onClick={upload}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                업로드 중...
              </>
            ) : (
              `${previews.length}장 업로드`
            )}
          </Button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}
