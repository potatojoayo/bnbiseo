'use client'

import { api, supabase } from '@/lib/api-client'

export type AdminImageKind = 'spaces' | 'assets' | 'cleaning-prep'

export type UploadedAdminImage = {
  storagePath: string
  thumbnailStoragePath: string
  previewUrl: string
}

type UploadUrlResponse = {
  original: {
    path: string
    token: string
  }
  thumbnail: {
    path: string
    token: string
  }
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('이미지를 불러오지 못했어요.'))
    }
    image.src = objectUrl
  })
}

async function createThumbnailBlob(file: File, size = 320) {
  const image = await loadImage(file)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('썸네일을 만들 수 없어요.')
  }

  const sourceSize = Math.min(image.width, image.height)
  const sourceX = (image.width - sourceSize) / 2
  const sourceY = (image.height - sourceSize) / 2

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    size,
    size,
  )

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.8)
  })

  if (!blob) {
    throw new Error('썸네일을 만들 수 없어요.')
  }

  return blob
}

export async function uploadAdminImage(
  propertyId: string,
  kind: AdminImageKind,
  file: File,
) {
  const signed = await api.post<UploadUrlResponse>(`/admin/properties/${propertyId}/registration/upload-url`, {
    fileName: file.name,
    kind,
  })

  return uploadToSignedUrls(file, signed)
}

export async function uploadAdminCleaningManualImage(propertyId: string, file: File) {
  const signed = await api.post<UploadUrlResponse>(`/admin/properties/${propertyId}/cleaning-manual/upload-url`, {
    fileName: file.name,
  })

  return uploadToSignedUrls(file, signed)
}

async function uploadToSignedUrls(file: File, signed: UploadUrlResponse) {
  const thumbnailBlob = await createThumbnailBlob(file)
  const thumbnailFile = new File([thumbnailBlob], `${file.name.replace(/\.[^.]+$/, '') || 'thumb'}.jpg`, {
    type: 'image/jpeg',
  })

  const [{ error: originalError }, { error: thumbnailError }] = await Promise.all([
    supabase.storage.from('images').uploadToSignedUrl(signed.original.path, signed.original.token, file),
    supabase.storage.from('images').uploadToSignedUrl(signed.thumbnail.path, signed.thumbnail.token, thumbnailFile),
  ])

  if (originalError || thumbnailError) {
    throw new Error(originalError?.message || thumbnailError?.message || '사진 업로드에 실패했어요.')
  }

  return {
    storagePath: signed.original.path,
    thumbnailStoragePath: signed.thumbnail.path,
    previewUrl: URL.createObjectURL(file),
  } satisfies UploadedAdminImage
}
