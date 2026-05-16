/** 매니저가 청소 전/후 사진을 올려야 하는 공간 카테고리 */
export const PHOTO_SPACE_CATEGORIES = ['living_room', 'bedroom', 'bathroom'] as const

export type PhotoSpaceCategory = (typeof PHOTO_SPACE_CATEGORIES)[number]

export function isPhotoSpaceCategory(category: string): category is PhotoSpaceCategory {
  return (PHOTO_SPACE_CATEGORIES as readonly string[]).includes(category)
}
