/** Returns CSS class for avatar shape. Use with global .avatar-shape-* styles. */
export function avatarShapeClass(shape: string | null | undefined): string {
  if (shape === 'square') return 'avatar-shape-square'
  if (shape === 'rounded') return 'avatar-shape-rounded'
  if (shape === 'squircle') return 'avatar-shape-squircle'
  return 'avatar-shape-circle'
}
