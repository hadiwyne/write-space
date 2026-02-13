/** Badge shown as corner overlay on avatar. */
export type AvatarBadge = 'none' | 'star' | 'crown' | 'flame' | 'heart' | 'sparkle' | 'bolt'

/** Extra animation applied to the frame. */
export type AvatarFrameAnimation = 'none' | 'shimmer' | 'dashed' | 'spin'

/** User avatar border/frame customization (stored as JSON). */
export type AvatarFrame = {
  borderType?: 'none' | 'gradient' | 'glow' | 'preset'
  gradient?: {
    colors: string[]
    angle?: number
    conic?: boolean
    animated?: boolean
    speed?: number
  }
  glow?: {
    enabled?: boolean
    color?: string
    intensity?: number
    pulse?: boolean
  }
  preset?: 'gamer' | 'soft' | 'premium' | 'fire' | null
  /** Corner badge (e.g. star, crown). Can be used with or without a border. */
  badge?: AvatarBadge | null
  /** Extra animation on the frame (shimmer, dashed ring, spin). */
  animation?: AvatarFrameAnimation | null
} | null

export const DEFAULT_AVATAR_FRAME: AvatarFrame = null

export const PRESET_LABELS: Record<string, string> = {
  gamer: 'Gamer (RGB ring)',
  soft: 'Soft (pastel halo)',
  premium: 'Premium (gold)',
  fire: 'Fire',
}

export const BADGE_LABELS: Record<AvatarBadge, string> = {
  none: 'None',
  star: 'Star',
  crown: 'Crown',
  flame: 'Flame',
  heart: 'Heart',
  sparkle: 'Sparkle',
  bolt: 'Bolt',
}

export const BADGE_EMOJI: Record<Exclude<AvatarBadge, 'none'>, string> = {
  star: '⭐',
  crown: '👑',
  flame: '🔥',
  heart: '❤️',
  sparkle: '✨',
  bolt: '⚡',
}

export const ANIMATION_LABELS: Record<AvatarFrameAnimation, string> = {
  none: 'None',
  shimmer: 'Shimmer',
  dashed: 'Dashed ring',
  spin: 'Spin',
}
