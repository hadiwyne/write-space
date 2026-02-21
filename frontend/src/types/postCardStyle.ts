
/** Border style for the card. */
export type PostCardBorderStyle = 'solid' | 'dashed' | 'double' | 'none'

/** Footer button size. */
export type PostCardButtonSize = 'default' | 'small' | 'large'

/** Per-post card style (stored as JSON on Post). */
export type PostCardStyle = {
  backgroundColor?: string
  backgroundImage?: string
  /** Card overall opacity (0–1). */
  opacity?: number
  /** Background layer transparency (0–1). */
  backgroundOpacity?: number
  borderColor?: string
  borderWidth?: number
  borderStyle?: PostCardBorderStyle
  /** Border image source (URL). If set, overrides borderColor/Style for the border visual (though width is still used). */
  borderImage?: string
  gradient?: {
    colors: string[]
    angle?: number
    conic?: boolean
    animated?: boolean
    speed?: number
  }
  /** URL for an overlay layer (image or GIF). */
  overlayUrl?: string
  /** Deprecated alias; kept to render older cards. */
  overlayGifUrl?: string
  /** Overlay opacity (0–1) for either image or GIF. */
  overlayOpacity?: number
  /** Legacy alias for backward compatibility. */
  overlayGifOpacity?: number
  /** Determines stacking of overlay. 'cover' places it above all card content; 'background' keeps it beneath buttons/text/etc. */
  overlayMode?: 'cover' | 'background'
  /** Legacy alias. */
  overlayGifMode?: 'cover' | 'background'
  buttonSize?: PostCardButtonSize
  /** Box shadow override (e.g. "0 4px 20px rgba(0,0,0,0.15)"). */
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