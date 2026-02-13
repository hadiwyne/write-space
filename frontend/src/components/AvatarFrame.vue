<template>
  <div
    v-if="hasFrame"
    class="avatar-frame"
    :class="[frameClasses, shapeClass]"
    :style="frameStyle"
  >
    <slot />
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AvatarFrame as AvatarFrameType } from '@/types/avatarFrame'

const props = withDefaults(
  defineProps<{
    frame?: AvatarFrameType | null
    /** Shape class so frame border-radius matches avatar (e.g. avatar-shape-circle) */
    shapeClass?: string
  }>(),
  { frame: null, shapeClass: 'avatar-shape-circle' }
)

const hasFrame = computed(() => {
  const f = props.frame
  if (!f || typeof f !== 'object') return false
  const t = f.borderType
  if (t === 'none' || !t) return false
  if (t === 'gradient' && f.gradient?.colors?.length >= 2) return true
  if (t === 'glow' && f.glow?.enabled) return true
  if (t === 'preset' && f.preset) return true
  return false
})

const frameClasses = computed(() => {
  const f = props.frame
  if (!f || !hasFrame.value) return []
  const t = f.borderType
  const classes: string[] = ['avatar-frame--' + t]
  if (t === 'gradient' && f.gradient?.animated) {
    classes.push(f.gradient.conic ? 'avatar-frame--conic-animated' : 'avatar-frame--animated')
  }
  if (t === 'glow' && f.glow?.pulse) classes.push('avatar-frame--pulse')
  if (t === 'preset' && f.preset) classes.push('avatar-frame--preset-' + f.preset)
  return classes
})

const frameStyle = computed(() => {
  const f = props.frame
  if (!f || !hasFrame.value) return {}
  const t = f.borderType
  const style: Record<string, string> = {}

  if (t === 'gradient' && f.gradient?.colors?.length >= 2) {
    const colors = f.gradient.colors
    const angle = f.gradient.conic ? undefined : `${f.gradient.angle ?? 90}deg`
    const speed = f.gradient.animated ? `${f.gradient.speed ?? 1}s` : undefined
    if (f.gradient.conic) {
      style.background = `conic-gradient(from ${(f.gradient.angle ?? 0) * 0.1}deg, ${colors.join(', ')})`
    } else {
      style.background = `linear-gradient(${angle}, ${colors.join(', ')})`
    }
    if (speed) style['--frame-speed'] = speed
  }

  if (t === 'glow' && f.glow?.enabled) {
    const color = f.glow.color ?? '#ff00cc'
    const intensity = f.glow.intensity ?? 0.5
    const blur = Math.round(10 + intensity * 25)
    const spread = Math.round(intensity * 8)
    style['--frame-glow-color'] = color
    style['--frame-glow-blur'] = blur + 'px'
    style['--frame-glow-spread'] = spread + 'px'
  }

  return style
})
</script>

<style scoped>
.avatar-frame {
  padding: 4px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}
.avatar-frame :deep(*) {
  border-radius: inherit;
}
</style>
