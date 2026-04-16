type SpaceCategory = 'living_room' | 'bedroom' | 'bathroom'

export type PropertySpaceSummary = {
  pyeong: number | null
  livingRooms: number | null
  bedrooms: number | null
  bathrooms: number | null
}

export function summarizeSpaces(
  spaces: Array<{ category: SpaceCategory; pyeong: number | null }>,
): PropertySpaceSummary {
  const totalPyeong = spaces.reduce((sum, space) => sum + (space.pyeong ?? 0), 0)
  const livingRooms = spaces.filter((space) => space.category === 'living_room').length
  const bedrooms = spaces.filter((space) => space.category === 'bedroom').length
  const bathrooms = spaces.filter((space) => space.category === 'bathroom').length

  return {
    pyeong: totalPyeong > 0 ? totalPyeong : null,
    livingRooms: livingRooms > 0 ? livingRooms : null,
    bedrooms: bedrooms > 0 ? bedrooms : null,
    bathrooms: bathrooms > 0 ? bathrooms : null,
  }
}

export function summarizeSpacesByProperty<T extends {
  propertyId: string
  category: SpaceCategory
  pyeong: number | null
}>(spaces: T[]) {
  const grouped = new Map<string, Array<{ category: SpaceCategory; pyeong: number | null }>>()

  for (const space of spaces) {
    const current = grouped.get(space.propertyId) ?? []
    current.push({ category: space.category, pyeong: space.pyeong })
    grouped.set(space.propertyId, current)
  }

  return new Map(
    Array.from(grouped.entries()).map(([propertyId, groupedSpaces]) => [
      propertyId,
      summarizeSpaces(groupedSpaces),
    ]),
  )
}
