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
} | null

export const DEFAULT_AVATAR_FRAME: AvatarFrame = null

export const PRESET_LABELS: Record<string, string> = {
  gamer: 'Gamer (RGB ring)',
  soft: 'Soft (pastel halo)',
  premium: 'Premium (gold)',
  fire: 'Fire',
}
