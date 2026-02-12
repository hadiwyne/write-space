import { IsString, IsObject, MaxLength } from 'class-validator'

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/

export class CreateThemeDto {
  @IsString()
  @MaxLength(100)
  name: string

  @IsObject()
  palette: Record<string, string>
}

export function validatePalette(palette: unknown): palette is Record<string, string> {
  if (!palette || typeof palette !== 'object' || Array.isArray(palette)) return false
  for (const value of Object.values(palette)) {
    if (typeof value !== 'string' || !HEX_COLOR.test(value)) return false
  }
  return true
}
