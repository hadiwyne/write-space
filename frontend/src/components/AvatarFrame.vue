<template>
  <div class="avatar-frame-root">
    <div
      v-if="hasFrame"
      class="avatar-frame"
      :class="[frameClasses, shapeClass]"
      :style="frameStyle"
    >
      <slot />
      <span v-if="showBadge" class="avatar-frame-badge" :class="['avatar-frame-badge--' + badgePosition]" aria-hidden="true">
        <img v-if="badgeKey === 'custom' && badgeUrl" :src="badgeSrc" alt="" class="avatar-frame-badge-img" />
        <template v-else>{{ badgeEmoji }}</template>
      </span>
    </div>
    <slot v-else />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AvatarFrame as AvatarFrameType } from '@/types/avatarFrame'
import { BADGE_EMOJI } from '@/types/avatarFrame'
import { avatarSrc } from '@/api/client'

const props = withDefaults(
  defineProps<{
    frame?: AvatarFrameType | null
    /** Shape class so frame border-radius matches avatar (e.g. avatar-shape-circle) */
    shapeClass?: string
    /** URL for custom badge image when frame.badge === 'custom'. Use avatarSrc(badgeUrl) for full URL. */
    badgeUrl?: string | null
    /** Optional cache-bust (e.g. auth.avatarVersion) so badge image refetches after upload. */
    badgeCacheBust?: string | number
  }>(),
  { frame: null, shapeClass: 'avatar-shape-circle', badgeUrl: null, badgeCacheBust: undefined }
)

const hasFrame = computed(() => {
  const f = props.frame
  if (!f || typeof f !== 'object') return false
  const hasBorder =
    (f.borderType === 'gradient' && (f.gradient?.colors?.length ?? 0) >= 2) ||
    (f.borderType === 'glow' && f.glow?.enabled) ||
    (f.borderType === 'preset' && f.preset)
  const hasBadge = f.badge && f.badge !== 'none'
  return hasBorder || !!hasBadge
})

const badgeKey = computed(() => {
  const b = props.frame?.badge
  return b && b !== 'none' ? b : null
})

const showBadge = computed(() => {
  const key = badgeKey.value
  if (!key) return false
  if (key === 'custom') return !!props.badgeUrl
  return !!(BADGE_EMOJI as Record<string, string>)[key]
})

const badgeEmoji = computed(() => {
  const key = badgeKey.value
  return key && key !== 'custom' ? (BADGE_EMOJI as Record<string, string>)[key] ?? null : null
})

const badgeSrc = computed(() => avatarSrc(props.badgeUrl, props.badgeCacheBust))

const badgePosition = computed(() => {
  const pos = props.frame?.badgePosition
  if (pos === 'top-right' || pos === 'top-left' || pos === 'bottom-left') return pos
  return 'bottom-right'
})

const frameClasses = computed(() => {
  const f = props.frame
  if (!f || !hasFrame.value) return []
  const t = f.borderType ?? 'none'
  const g = f.gradient
  const classes: string[] = ['avatar-frame--' + t]
  if (t === 'gradient' && g?.animated) {
    classes.push(g.conic ? 'avatar-frame--conic-animated' : 'avatar-frame--animated')
  }
  if (t === 'glow' && f.glow?.pulse) classes.push('avatar-frame--pulse')
  if (t === 'preset' && f.preset) classes.push('avatar-frame--preset-' + f.preset)
  if (f.animation && f.animation !== 'none') classes.push('avatar-frame--anim-' + f.animation)
  return classes
})

const frameStyle = computed(() => {
  const f = props.frame
  if (!f || !hasFrame.value) return {}
  const t = f.borderType ?? 'none'
  const style: Record<string, string> = {}

  const g = f.gradient
  if (t === 'gradient' && g?.colors && g.colors.length >= 2) {
    const colors = g.colors
    const angle = g.conic ? undefined : `${g.angle ?? 90}deg`
    const speed = g.animated ? `${g.speed ?? 1}s` : undefined
    if (g.conic) {
      style.background = `conic-gradient(from ${(g.angle ?? 0) * 0.1}deg, ${colors.join(', ')})`
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
.avatar-frame-root {
  display: inline-flex;
  position: relative;
}
/* Do not set border-radius here – global .avatar-frame.avatar-shape-* in App.vue controls it */
.avatar-frame-root .avatar-frame {
  padding: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  position: relative;
}
.avatar-frame :deep(> *) {
  border-radius: inherit;
  overflow: hidden;
}
.avatar-frame-badge {
  position: absolute;
  width: clamp(20px, 42%, 30px);
  height: clamp(20px, 42%, 30px);
  font-size: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  filter: drop-shadow(0 1px 3px rgba(0,0,0,0.4));
  pointer-events: none;
  animation: avatar-badge-float 2.5s ease-in-out infinite;
  z-index: 2;
}
.avatar-frame-badge--bottom-right { bottom: -4px; right: -4px; }
.avatar-frame-badge--top-right { top: -4px; right: -4px; }
.avatar-frame-badge--top-left { top: -4px; left: -4px; }
.avatar-frame-badge--bottom-left { bottom: -4px; left: -4px; }
.avatar-frame-badge-img {
  object-fit: contain;
  background: transparent;
}
.avatar-frame-badge-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  display: block;
}
@keyframes avatar-badge-float {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
</style>
