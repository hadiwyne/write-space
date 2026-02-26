export type PostCardBorderStyle = 'solid' | 'dashed' | 'double' | 'none'

export type PostCardButtonSize = 'default' | 'small' | 'large'

/** Per-post card style stored as JSON on Post. */
export type PostCardStyle = {
  backgroundColor?: string
  backgroundImage?: string
  borderColor?: string
  borderWidth?: number
  borderStyle?: PostCardBorderStyle
  borderImage?: string
  gradient?: {
    colors: string[]
    angle?: number
    animated?: boolean
    speed?: number
  }
  overlayUrl?: string
  overlayOpacity?: number
  overlayMode?: 'cover' | 'background'
  buttonSize?: PostCardButtonSize
  boxShadow?: string
} | null

export const DEFAULT_POST_CARD_STYLE: PostCardStyle = null

export const BORDER_STYLE_LABELS: Record<PostCardBorderStyle, string> = {
  solid: 'Solid',
  dashed: 'Dashed',
  double: 'Double',
  none: 'None',
}



export const BUTTON_SIZE_LABELS: Record<PostCardButtonSize, string> = {
  default: 'Default',
  small: 'Small',
  large: 'Large',
}