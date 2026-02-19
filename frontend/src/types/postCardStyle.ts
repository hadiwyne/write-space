/** Post card shape. */
export type PostCardShape = 'default' | 'rounded' | 'square' | 'squircle' | 'pill'

/** Border style for the card. */
export type PostCardBorderStyle = 'solid' | 'dashed' | 'double' | 'none'

/** Badge shown on the card (e.g. corner). */
export type PostCardBadge = 'none' | 'star' | 'crown' | 'flame' | 'heart' | 'sparkle' | 'bolt' | 'custom'

/** Badge position on the card. */
export type PostCardBadgePosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

/** Badge movement animation around the card. */
export type PostCardBadgeMovement = 'none' | 'float' | 'orbit'

/** Card surface animation (no movement of the card itself). */
export type PostCardAnimation = 'none' | 'shimmer' | 'glitter' | 'gradient-shift'

/** Footer button size. */
export type PostCardButtonSize = 'default' | 'small' | 'large'

/** Per-post card style (stored as JSON on Post). */
export type PostCardStyle = {
  shape?: PostCardShape
  backgroundColor?: string
  backgroundImage?: string
  /** Card overall opacity (0–1). */
  opacity?: number
  /** Background layer transparency (0–1). */
  backgroundOpacity?: number
  borderColor?: string
  borderWidth?: number
  borderStyle?: PostCardBorderStyle
  gradient?: {
    colors: string[]
    angle?: number
    conic?: boolean
    animated?: boolean
    speed?: number
  }
  badge?: PostCardBadge
  badgePosition?: PostCardBadgePosition
  badgeMovement?: PostCardBadgeMovement
  badgeImageUrl?: string
  overlayGifUrl?: string
  buttonSize?: PostCardButtonSize
  animation?: PostCardAnimation
  /** Box shadow override (e.g. "0 4px 20px rgba(0,0,0,0.15)"). */
  boxShadow?: string
} | null

export const DEFAULT_POST_CARD_STYLE: PostCardStyle = null

export const SHAPE_LABELS: Record<PostCardShape, string> = {
  default: 'Default',
  rounded: 'Rounded',
  square: 'Square',
  squircle: 'Squircle',
  pill: 'Pill',
}

export const BORDER_STYLE_LABELS: Record<PostCardBorderStyle, string> = {
  solid: 'Solid',
  dashed: 'Dashed',
  double: 'Double',
  none: 'None',
}

export const BADGE_LABELS: Record<PostCardBadge, string> = {
  none: 'None',
  star: 'Star',
  crown: 'Crown',
  flame: 'Flame',
  heart: 'Heart',
  sparkle: 'Sparkle',
  bolt: 'Bolt',
  custom: 'Custom (URL)',
}

export const BADGE_POSITION_LABELS: Record<PostCardBadgePosition, string> = {
  'top-right': 'Top right',
  'top-left': 'Top left',
  'bottom-right': 'Bottom right',
  'bottom-left': 'Bottom left',
}

export const BADGE_MOVEMENT_LABELS: Record<PostCardBadgeMovement, string> = {
  none: 'None',
  float: 'Float',
  orbit: 'Orbit',
}

export const ANIMATION_LABELS: Record<PostCardAnimation, string> = {
  none: 'None',
  shimmer: 'Shimmer',
  glitter: 'Glitter',
  'gradient-shift': 'Gradient shift',
}

export const BUTTON_SIZE_LABELS: Record<PostCardButtonSize, string> = {
  default: 'Default',
  small: 'Small',
  large: 'Large',
}

export const BADGE_EMOJI: Record<Exclude<PostCardBadge, 'none' | 'custom'>, string> = {
  star: '⭐',
  crown: '👑',
  flame: '🔥',
  heart: '❤️',
  sparkle: '✨',
  bolt: '⚡',
}
