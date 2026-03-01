<template>
  <div class="write-page">
    <h1>New post</h1>
    <form @submit.prevent="publish" class="form">
      <div class="form-group">
        <input
          :value="title"
          type="text"
          placeholder="Title"
          required
          class="title-input"
          @input="onTitleInput"
        />
        <p v-if="titleWarningReason" class="title-warning">{{ titleWarningMessage }}</p>
      </div>
      <div class="form-group post-type-row">
        <button type="button" class="post-type-btn" :class="{ active: postType === 'post' }" @click="postType = 'post'">
          <i class="pi pi-file-edit" aria-hidden="true"></i> Post
        </button>
        <button type="button" class="post-type-btn" :class="{ active: postType === 'poll' }" @click="postType = 'poll'">
          <i class="pi pi-list" aria-hidden="true"></i> Poll
        </button>
      </div>
      <div v-if="postType === 'post'" class="form-group editor-toolbar">
        <div class="dropdown-wrap" ref="formatDropdownRef">
          <button type="button" class="dropdown-trigger" :aria-expanded="formatDropdownOpen" @click="formatDropdownOpen = !formatDropdownOpen">
            <i :class="contentTypeIcon" aria-hidden="true"></i>
            <span>{{ contentTypeLabel }}</span>
            <i class="pi pi-chevron-down dropdown-chevron" aria-hidden="true"></i>
          </button>
          <Transition name="dropdown">
            <div v-if="formatDropdownOpen" class="dropdown-panel" role="menu">
              <button type="button" class="dropdown-option" role="menuitem" :class="{ active: contentType === 'MARKDOWN' }" @click="contentType = 'MARKDOWN'; formatDropdownOpen = false">
                <i class="pi pi-file-edit" aria-hidden="true"></i> Markdown
              </button>
              <button type="button" class="dropdown-option" role="menuitem" :class="{ active: contentType === 'HTML' }" @click="contentType = 'HTML'; formatDropdownOpen = false">
                <i class="pi pi-code" aria-hidden="true"></i> HTML
              </button>
              <button type="button" class="dropdown-option" role="menuitem" :class="{ active: contentType === 'WYSIWYG' }" @click="contentType = 'WYSIWYG'; formatDropdownOpen = false">
                <i class="pi pi-align-left" aria-hidden="true"></i> Rich text
              </button>
            </div>
          </Transition>
        </div>
        <input ref="wordInputRef" type="file" accept=".docx" class="hidden" @change="onWordUpload" />
        <input ref="imageInputRef" type="file" accept="image/*" class="hidden" @change="onImageUpload" />
        <button type="button" class="btn btn-sm btn-outline" @click="wordInputRef?.click()">Import Word</button>
        <button
          v-if="contentType !== 'WYSIWYG'"
          type="button"
          class="btn btn-sm btn-outline"
          :disabled="imageCountInContent >= MAX_IMAGES_PER_POST"
          :title="imageCountInContent >= MAX_IMAGES_PER_POST ? 'Maximum 5 images per post' : undefined"
          @click="imageInputRef?.click()"
        >
          Insert media
        </button>
        <button v-if="draftId" type="button" class="btn btn-sm btn-outline" @click="loadVersions">Version history</button>
        <span v-if="lastSavedAt" class="saved-hint">Saved {{ lastSavedAt }}</span>
      </div>
      <p class="upload-hint">Max 5 MB per image. Up to 5 images per post.</p>
      <div v-if="versionsOpen" class="versions-panel">
        <p v-if="versionsLoading">Loading…</p>
        <template v-else-if="versions.length">
          <p class="versions-title">Past versions (restore to load that content)</p>
          <ul class="versions-list">
            <li v-for="v in versions" :key="v.id" class="versions-item">
              <span>v{{ v.version }} – {{ formatDate(v.lastSavedAt) }}</span>
              <button type="button" class="btn btn-sm btn-outline" @click="restoreVersion(v.id)">Restore</button>
            </li>
          </ul>
        </template>
        <p v-else>No past versions.</p>
        <button type="button" class="btn btn-sm btn-ghost" @click="versionsOpen = false">Close</button>
      </div>
      <div v-if="postType === 'post'" class="form-group editor-row" :class="{ 'editor-row--wysiwyg': contentType === 'WYSIWYG' }">
        <div class="editor-pane">
          <RichTextEditor
            v-if="contentType === 'WYSIWYG'"
            ref="richTextEditorRef"
            v-model="content"
            :can-add-image="imageCountInContent < MAX_IMAGES_PER_POST"
            @image-upload="onRichEditorImageUpload"
            @image-crop-apply="onRichEditorCropApply"
          />
          <div v-else class="editor-mention-wrap">
            <textarea
              ref="editorRef"
              v-model="content"
              placeholder="Write your story…"
              class="editor"
              rows="20"
              @input="onEditorInput"
              @keydown="onEditorKeydown"
            ></textarea>
            <Transition name="dropdown">
              <div v-if="mention.mentionOpen && (mention.mentionQuery?.length ?? 0) > 0 && (mention.mentionCandidates.length > 0 || mention.mentionLoading)" class="mention-dropdown" role="listbox">
                <div v-if="mention.mentionLoading" class="mention-item mention-item--loading">Searching…</div>
                <button
                  v-for="(u, i) in mention.mentionCandidates"
                  :key="u.id || i"
                  type="button"
                  class="mention-item"
                  :class="{ 'mention-item--selected': i === mention.mentionSelectedIndex }"
                  role="option"
                  :aria-selected="i === mention.mentionSelectedIndex"
                  @click="u.username && mention.selectMention(u.username)"
                >
                  <span class="mention-avatar-wrap" :class="avatarShapeClass(u.avatarShape)">
                    <img v-if="u.avatarUrl" :src="avatarSrc(u.avatarUrl, u.id)" alt="" class="mention-avatar" />
                    <span v-else class="mention-avatar-placeholder">{{ (u.displayName || u.username || '?')[0] }}</span>
                  </span>
                  <span class="mention-item-text">
                    <span class="mention-username">@{{ u.username || '' }}</span>
                    <span v-if="u.displayName" class="mention-display-name">{{ u.displayName }}</span>
                  </span>
                </button>
              </div>
            </Transition>
          </div>
        </div>
        <div v-if="contentType !== 'WYSIWYG'" class="preview-pane">
          <div class="preview-label">Preview</div>
          <div class="preview-content" v-html="previewHtml"></div>
        </div>
      </div>
      <div v-if="postType === 'poll'" class="form-group poll-description">
        <label class="poll-desc-label">Description</label>
        <textarea v-model="content" placeholder="Add context or details about the poll" class="poll-desc-input" rows="3"></textarea>
      </div>
      <template v-if="postType === 'post'">
      <div class="form-group">
        <input :value="tagsStr" type="text" placeholder="Tags (comma-separated)" class="tags-input" @input="onTagsInput" @blur="normalizeTagsStr" />
      </div>
      </template>
      <template v-if="postType === 'poll'">
      <div class="form-group poll-options-group">
        <label class="poll-options-label">Options (add at least two)</label>
        <div v-for="(_opt, idx) in pollOptions" :key="idx" class="poll-option-row">
          <input v-model="pollOptions[idx]" type="text" :placeholder="'Option ' + (idx + 1)" class="poll-option-input" maxlength="500" />
          <button type="button" class="btn btn-sm btn-ghost poll-option-remove" aria-label="Remove option" :disabled="pollOptions.length <= 2" @click="removePollOption(idx)">
            <i class="pi pi-times" aria-hidden="true"></i>
          </button>
        </div>
        <button type="button" class="btn btn-sm btn-outline poll-option-add" @click="addPollOption">
          <i class="pi pi-plus" aria-hidden="true"></i> Add option
        </button>
      </div>
      <div class="form-group poll-settings">
        <label class="poll-check-wrap">
          <input v-model="pollIsOpen" type="checkbox" class="poll-check" />
          <span>Open poll: voters can add options</span>
        </label>
        <label class="poll-check-wrap">
          <input v-model="pollResultsVisible" type="checkbox" class="poll-check" />
          <span>Results always visible (uncheck to show results only after voting)</span>
        </label>
        <label class="poll-check-wrap">
          <input v-model="pollAllowMultiple" type="checkbox" class="poll-check" />
          <span>Allow voters to select multiple options</span>
        </label>
        <label class="poll-check-wrap">
          <input v-model="pollAllowChangeVote" type="checkbox" class="poll-check" />
          <span>Allow voters to change their vote (click choice again to unvote)</span>
        </label>
      </div>
      </template>
      <div class="form-group visibility-row">
        <div class="dropdown-wrap" ref="visibilityDropdownRef">
          <button type="button" class="dropdown-trigger" :aria-expanded="visibilityDropdownOpen" @click="visibilityDropdownOpen = !visibilityDropdownOpen">
            <i :class="visibilityIcon" aria-hidden="true"></i>
            <span>{{ visibilityLabel }}</span>
            <i class="pi pi-chevron-down dropdown-chevron" aria-hidden="true"></i>
          </button>
          <Transition name="dropdown">
            <div v-if="visibilityDropdownOpen" class="dropdown-panel" role="menu">
              <button type="button" class="dropdown-option" role="menuitem" :class="{ active: visibility === 'PUBLIC' }" @click="visibility = 'PUBLIC'; visibilityDropdownOpen = false">
                <i class="pi pi-globe" aria-hidden="true"></i> Public
              </button>
              <button type="button" class="dropdown-option" role="menuitem" :class="{ active: visibility === 'FOLLOWERS_ONLY' }" @click="visibility = 'FOLLOWERS_ONLY'; visibilityDropdownOpen = false">
                <i class="pi pi-users" aria-hidden="true"></i> Followers
              </button>
            </div>
          </Transition>
        </div>
      </div>
      <div class="form-group card-style-section">
        <button
          type="button"
          class="card-style-toggle"
          :aria-expanded="modifyPostCardOpen"
          @click="toggleModifyPostCard"
        >
          <i class="pi pi-palette" aria-hidden="true"></i>
          <span>Modify your post card</span>
          <i :class="modifyPostCardOpen ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" class="card-style-chevron" aria-hidden="true"></i>
        </button>
        <Transition name="card-panel">
          <div v-if="modifyPostCardOpen" class="card-style-panel">
            <div v-if="cardStyleForm" class="card-style-options">
              <div class="card-style-group">
                <label class="card-style-label">Background color</label>
                <div class="color-input-wrap">
                  <input
                    type="color"
                    :value="cardStyleForm.backgroundColor || '#f5f0eb'"
                    class="color-picker color-picker-desktop"
                    aria-label="Background color"
                    @input="onCardColorInput('backgroundColor', $event)"
                  />
                  <button type="button" class="color-adjust-btn" :style="{ backgroundColor: cardStyleForm.backgroundColor || '#f5f0eb' }" @click="openCardColorEditor('backgroundColor')">
                    <span class="color-adjust-btn-label">Adjust</span>
                  </button>
                  <input
                    type="text"
                    :value="cardStyleForm.backgroundColor"
                    class="color-hex"
                    placeholder="#f5f0eb"
                    @input="onCardHexInput('backgroundColor', $event)"
                  />
                  <button
                    type="button"
                    class="btn-icon-small"
                    aria-label="Randomize background color"
                    title="Randomize"
                    @click="randomizeCardColor('backgroundColor')"
                  >
                    <i class="pi pi-play" aria-hidden="true"></i>
                  </button>
                  <button
                    type="button"
                    class="btn-icon-small"
                    aria-label="Reset background color"
                    title="Reset to default"
                    @click="resetCardColor('backgroundColor')"
                  >
                    <i class="pi pi-undo" aria-hidden="true"></i>
                  </button>
                </div>
              </div>
              <!-- opacity and background transparency removed per feedback -->
              <div class="card-style-group">
                <label class="card-style-label">Border</label>
                <div class="color-input-wrap card-style-border-color">
                  <input
                    type="color"
                    :value="cardStyleForm.borderColor || '#e5dcc8'"
                    class="color-picker color-picker-desktop"
                    aria-label="Border color"
                    @input="onCardColorInput('borderColor', $event)"
                  />
                  <button type="button" class="color-adjust-btn" :style="{ backgroundColor: cardStyleForm.borderColor || '#e5dcc8' }" @click="openCardColorEditor('borderColor')">
                    <span class="color-adjust-btn-label">Adjust</span>
                  </button>
                  <input type="text" :value="cardStyleForm.borderColor" class="color-hex" placeholder="#e5dcc8" @input="onCardHexInput('borderColor', $event)" />
                  <button
                    type="button"
                    class="btn-icon-small"
                    aria-label="Randomize border color"
                    title="Randomize"
                    @click="randomizeCardColor('borderColor')"
                  >
                    <i class="pi pi-play" aria-hidden="true"></i>
                  </button>
                  <button
                    type="button"
                    class="btn-icon-small"
                    aria-label="Reset border color"
                    title="Reset to default"
                    @click="resetCardColor('borderColor')"
                  >
                    <i class="pi pi-undo" aria-hidden="true"></i>
                  </button>
                </div>
                <div class="card-style-slider-row">
                  <label class="card-style-label-inline">Width</label>
                  <input v-model.number="cardStyleForm.borderWidth" type="range" min="0" max="20" class="card-style-slider" />
                  <span class="card-style-slider-value">{{ cardStyleForm.borderWidth ?? 0 }}px</span>
                </div>
                <select v-model="cardStyleForm.borderStyle" class="card-style-select card-style-select-sm">
                  <option v-for="(label, key) in BORDER_STYLE_LABELS" :key="key" :value="key">{{ label }}</option>
                </select>
                <div class="card-style-upload-row">
                  <input ref="borderImageFileInputRef" type="file" accept="image/*" class="file-input-hidden" aria-label="Upload image for border" @change="onCardBorderImageUpload" />
                  <button type="button" class="btn btn-sm btn-outline" @click="triggerBorderImageFileInput">Image border</button>
                  <span class="card-style-or">or</span>
                  <input
                    v-model="manualBorderUrl"
                    type="text"
                    placeholder="Paste image URL"
                    class="card-style-input card-style-input-url"
                    @keydown.enter.prevent="applyBorderUrl"
                  />
                  <button type="button" class="btn btn-sm btn-outline" :disabled="!manualBorderUrl.trim()" @click="applyBorderUrl">Use URL</button>
                  <button v-if="cardStyleForm.borderImage" type="button" class="btn btn-sm btn-ghost card-style-remove-btn" @click="clearBorderImage">
                    <i class="pi pi-times" aria-hidden="true"></i> Remove image
                  </button>
                </div>
                <!-- Optional hint for using border images effectively? -->
                <p v-if="cardStyleForm.borderImage" class="card-style-hint">Border width behaves as the slice width</p>
              </div>
              <div class="card-style-group">
                <label class="card-style-label">Gradient</label>
                <div v-for="(c, i) in (cardStyleForm.gradient?.colors || [])" :key="i" class="card-style-gradient-row">
                  <span class="card-style-gradient-label">Color {{ i + 1 }}</span>
                  <div class="color-input-wrap">
                    <input type="color" :value="c" class="color-picker color-picker-desktop" :aria-label="`Gradient color ${i + 1}`" @input="onCardGradientColorInput(i, $event)" />
                    <button type="button" class="color-adjust-btn" :style="{ backgroundColor: c }" @click="openCardColorEditor('gradient-' + i)">
                      <span class="color-adjust-btn-label">Adjust</span>
                    </button>
                    <input type="text" :value="c" class="color-hex" @input="onCardGradientHexInput(i, $event)" />
                    <button type="button" class="btn-icon-small" title="Randomize" @click="randomizeCardColor({ type: 'gradient', index: i })">
                      <i class="pi pi-play" aria-hidden="true"></i>
                    </button>
                    <button type="button" class="btn-icon-small" title="Reset" @click="resetCardColor({ type: 'gradient', index: i })">
                      <i class="pi pi-undo" aria-hidden="true"></i>
                    </button>
                  </div>
                  <button type="button" class="btn btn-sm btn-ghost" aria-label="Remove color" @click="removeGradientColor(i)">
                    <i class="pi pi-times" aria-hidden="true"></i>
                  </button>
                </div>
                <button type="button" class="btn btn-sm btn-outline" @click="addGradientColor">
                  <i class="pi pi-plus" aria-hidden="true"></i> Add color
                </button>
                <div v-if="cardStyleForm.gradient" class="card-style-slider-row">
                  <label class="card-style-label-inline">Angle</label>
                  <input :value="cardStyleForm.gradient.angle ?? 180" type="range" min="0" max="360" class="card-style-slider" @input="onCardGradientAngleInput" />
                  <span class="card-style-slider-value">{{ cardStyleForm.gradient.angle ?? 180 }}°</span>
                </div>
              </div>
              <div class="card-style-group">
                <label class="card-style-label">Overlay</label>
                <p class="card-style-hint">Image or GIF (transparent recommended)</p>
                <div class="card-style-upload-row">
                  <input ref="overlayFileInputRef" type="file" accept="image/*" class="file-input-hidden" aria-label="Upload overlay image" @change="onCardOverlayUpload" />
                  <button type="button" class="btn btn-sm btn-outline" @click="triggerOverlayFileInput">Upload overlay</button>
                  <span class="card-style-or">or</span>
                  <input
                    v-model="manualOverlayUrl"
                    type="text"
                    placeholder="Paste image or GIF URL"
                    class="card-style-input card-style-input-url"
                    @keydown.enter.prevent="applyOverlayUrl"
                  />
                  <button type="button" class="btn btn-sm btn-outline" :disabled="!manualOverlayUrl.trim()" @click="applyOverlayUrl">Use URL</button>
                  <button v-if="cardStyleForm.overlayUrl" type="button" class="btn btn-sm btn-ghost card-style-remove-btn" @click="clearOverlay">
                    <i class="pi pi-times" aria-hidden="true"></i> Remove overlay
                  </button>
                </div>
                <div v-if="cardStyleForm.overlayUrl" class="ui-theme-options" role="group" aria-label="Overlay mode">
                  <label class="ui-theme-option">
                    <input type="radio" v-model="cardStyleForm.overlayMode" value="cover" />
                    <span>Cover card</span>
                  </label>
                  <label class="ui-theme-option">
                    <input type="radio" v-model="cardStyleForm.overlayMode" value="background" />
                    <span>Background only</span>
                  </label>
                </div>
              </div>
              <div v-if="cardStyleForm.overlayUrl" class="card-style-group">
                <label class="card-style-label">Overlay transparency</label>
                <div class="card-style-slider-row">
                  <input v-model.number="overlayTransparency" type="range" min="0" max="1" step="0.05" class="card-style-slider" />
                  <span class="card-style-slider-value">{{ Math.round((overlayTransparency ?? 0.5) * 100) }}%</span>
                </div>
              </div>

            </div>
            <div class="card-style-preview-wrap">
              <p class="card-style-preview-label">Live preview</p>
              <div class="card-style-preview-inner">
                <PostCard
                  :post="previewPost"
                  :show-actions="false"
                  :show-repost="false"
                  :show-like="true"
                  preview-only
                />
              </div>
            </div>
            
          </div>
        </Transition>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <div v-if="conflictDraft" class="conflict-banner">
        <p>This draft was updated elsewhere. Choose:</p>
        <button type="button" class="btn btn-sm btn-outline" @click="useMine">Keep my version</button>
        <button type="button" class="btn btn-sm btn-outline" @click="useServer">Use server version</button>
      </div>
      <div class="actions">
        <button type="button" class="btn btn-outline" @click="() => saveDraft()" :disabled="savingDraft">Save draft</button>
        <button type="submit" class="btn btn-primary btn-publish" :disabled="publishLoading || publishAnonymousLoading">
          <i v-if="publishLoading" class="pi pi-spin pi-spinner publish-spinner" aria-hidden="true"></i>
          <span>{{ publishLoading ? 'Publishing' : 'Publish' }}</span>
        </button>
        <button type="button" class="btn btn-outline btn-publish-anonymous" :disabled="publishLoading || publishAnonymousLoading" @click="publishAnonymously">
          <i v-if="publishAnonymousLoading" class="pi pi-spin pi-spinner publish-spinner" aria-hidden="true"></i>
          <span>{{ publishAnonymousLoading ? 'Publishing' : 'Publish anonymously' }}</span>
        </button>
      </div>
    </form>
    <Teleport to="body">
      <div
        v-if="editingCardColorKey !== null"
        class="modal-backdrop color-editor-backdrop card-color-editor-backdrop"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="`card-color-editor-title-${editingCardColorKey}`"
        @click.self="closeCardColorEditor"
      >
        <div class="modal color-editor-modal card-color-editor-modal">
          <h2 :id="`card-color-editor-title-${editingCardColorKey}`" class="modal-heading">
            {{ editingCardColorKey === 'backgroundColor' ? 'Background color' : editingCardColorKey === 'borderColor' ? 'Border color' : 'Gradient color' }}
          </h2>
          <p class="modal-hint">Use sliders or enter a hex code.</p>
          <div class="color-editor-preview" :style="{ backgroundColor: editingCardHex }"></div>
          <div class="color-editor-hex-wrap">
            <label :for="`card-color-editor-hex-${editingCardColorKey}`" class="sr-only">Hex code</label>
            <input
              :id="`card-color-editor-hex-${editingCardColorKey}`"
              v-model="editingCardHex"
              type="text"
              class="color-editor-hex"
              spellcheck="false"
              autocapitalize="off"
              inputmode="text"
              maxlength="7"
              placeholder="#000000"
              @input="onCardEditorHexInput"
            />
          </div>
          <div class="color-editor-sliders">
            <div class="color-editor-slider-row">
              <label :for="`card-color-editor-h-${editingCardColorKey}`" class="color-editor-slider-label">Hue</label>
              <input
                :id="`card-color-editor-h-${editingCardColorKey}`"
                v-model.number="editingCardHsl.h"
                type="range"
                min="0"
                max="360"
                class="color-editor-range color-editor-range-hue"
                @input="syncCardHexFromHsl"
              />
              <span class="color-editor-value">{{ Math.round(editingCardHsl.h) }}°</span>
            </div>
            <div class="color-editor-slider-row">
              <label :for="`card-color-editor-s-${editingCardColorKey}`" class="color-editor-slider-label">Saturation</label>
              <input
                :id="`card-color-editor-s-${editingCardColorKey}`"
                v-model.number="editingCardHsl.s"
                type="range"
                min="0"
                max="100"
                class="color-editor-range"
                @input="syncCardHexFromHsl"
              />
              <span class="color-editor-value">{{ Math.round(editingCardHsl.s) }}%</span>
            </div>
            <div class="color-editor-slider-row">
              <label :for="`card-color-editor-l-${editingCardColorKey}`" class="color-editor-slider-label">Lightness</label>
              <input
                :id="`card-color-editor-l-${editingCardColorKey}`"
                v-model.number="editingCardHsl.l"
                type="range"
                min="0"
                max="100"
                class="color-editor-range"
                @input="syncCardHexFromHsl"
              />
              <span class="color-editor-value">{{ Math.round(editingCardHsl.l) }}%</span>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-primary" @click="closeCardColorEditor">Done</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { api, avatarSrc } from '@/api/client'
import { avatarShapeClass } from '@/utils/avatar'
import { renderPreview, type ContentType } from '@/utils/preview'
import RichTextEditor from '@/components/RichTextEditor.vue'
import PostCard from '@/components/PostCard.vue'
import type { PostCardStyle, PostCardBorderStyle } from '@/types/postCardStyle'
import { BORDER_STYLE_LABELS } from '@/types/postCardStyle'
import { useMentionAutocomplete } from '@/composables/useMentionAutocomplete'

const MAX_IMAGES_PER_POST = 5
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const MAX_TITLE_WORDS = 20
const MAX_TITLE_CHARS = 120

/** Normalize image src in post HTML to relative /posts/images/ID so they resolve correctly when viewing. */
function normalizePostContentImageUrls(html: string): string {
  return html.replace(
    /src=(["'])(?:(?:https?:)?\/\/[^"']*|\/api)?(\/posts\/images\/[a-zA-Z0-9_-]+)(?:\?[^"']*)?\1/g,
    (_m, q, path) => `src=${q}${path}${q}`
  )
}

function countWords(s: string): number {
  return s.trim() ? s.trim().split(/\s+/).filter(Boolean).length : 0
}

function truncateToWords(s: string, maxWords: number): string {
  const words = s.trim().split(/\s+/).filter(Boolean)
  return words.slice(0, maxWords).join(' ')
}

function truncateToChars(s: string, maxChars: number): string {
  if (s.length <= maxChars) return s
  return s.slice(0, maxChars)
}

const router = useRouter()
const title = ref('')
const titleWarningReason = ref<'words' | 'chars' | null>(null)
const titleWarningMessage = computed(() => {
  if (titleWarningReason.value === 'words') return 'Maximum 20 words for title.'
  if (titleWarningReason.value === 'chars') return 'Maximum 120 characters for title.'
  return ''
})

// manual URL inputs separate from the actual style value. when a file is uploaded
// we update the style directly and leave these blank so the form doesn't complain.
const manualOverlayUrl = ref('')
const manualBorderUrl = ref('')

function onTitleInput(e: Event) {
  const target = e.target as HTMLInputElement
  const raw = target.value
  // Only truncate when a limit is exceeded so we don't strip spaces between words
  let truncated = raw
  if (countWords(raw) > MAX_TITLE_WORDS) truncated = truncateToWords(raw, MAX_TITLE_WORDS)
  if (truncated.length > MAX_TITLE_CHARS) truncated = truncateToChars(truncated, MAX_TITLE_CHARS)
  const overWords = countWords(raw) > MAX_TITLE_WORDS
  const overChars = raw.length > MAX_TITLE_CHARS
  title.value = truncated
  if (raw !== truncated) target.value = truncated
  if (overChars) titleWarningReason.value = 'chars'
  else if (overWords) titleWarningReason.value = 'words'
  else titleWarningReason.value = null
}
const content = ref('')
const contentType = ref<ContentType>('MARKDOWN')
const richTextEditorRef = ref<{ addImage: (url: string) => void; replaceSelectedImage: (url: string) => void } | null>(null)
const tagsStr = ref('')
const visibility = ref<'PUBLIC' | 'FOLLOWERS_ONLY'>('PUBLIC')
const postType = ref<'post' | 'poll'>('post')
const pollOptions = ref<string[]>(['', ''])
const pollIsOpen = ref(false)
const pollResultsVisible = ref(true)
const pollAllowMultiple = ref(false)
const pollAllowChangeVote = ref(false)
const formatDropdownOpen = ref(false)
const visibilityDropdownOpen = ref(false)
const formatDropdownRef = ref<HTMLElement | null>(null)
const visibilityDropdownRef = ref<HTMLElement | null>(null)

const contentTypeLabel = computed(() => {
  if (contentType.value === 'MARKDOWN') return 'Markdown'
  if (contentType.value === 'HTML') return 'HTML'
  return 'Rich text'
})
const contentTypeIcon = computed(() => {
  if (contentType.value === 'MARKDOWN') return 'pi pi-file-edit'
  if (contentType.value === 'HTML') return 'pi pi-code'
  return 'pi pi-align-left'
})
const visibilityLabel = computed(() => (visibility.value === 'PUBLIC' ? 'Public' : 'Followers'))
const visibilityIcon = computed(() => (visibility.value === 'PUBLIC' ? 'pi pi-globe' : 'pi pi-users'))

const modifyPostCardOpen = ref(false)
type CardStyleFormState = Record<string, unknown> & {
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderStyle?: string
  gradient?: { colors: string[]; angle?: number; speed?: number }
  overlayUrl?: string
  overlayOpacity?: number
  overlayMode?: 'cover' | 'background'
  borderImage?: string
}
const cardStyleForm = ref<CardStyleFormState | null>(null)

const DEFAULT_CARD_STYLE_FORM: CardStyleFormState = {
  borderStyle: 'solid',
  overlayOpacity: 0.5,
  overlayMode: 'cover',
  borderWidth: 0,
  gradient: { colors: [], angle: 180, speed: 1 },
}

function getDefaultCardStyleForm(): CardStyleFormState {
  return { ...DEFAULT_CARD_STYLE_FORM, gradient: { colors: [], angle: 180, speed: 1 } }
}

function isCardStyleDefault(form: CardStyleFormState): boolean {
  if (form.backgroundColor && form.backgroundColor.trim()) return false
  if (form.borderColor && form.borderColor.trim()) return false
  if (form.borderWidth != null && form.borderWidth !== 0) return false
  if (form.borderStyle && form.borderStyle !== 'solid') return false
  const g = form.gradient
  if (g?.colors?.length) return false
  if (form.overlayUrl && form.overlayUrl.trim()) return false
  if (form.overlayOpacity != null && form.overlayOpacity !== 0.5) return false
  if (form.overlayMode && form.overlayMode !== 'cover') return false
  if (form.borderImage && form.borderImage.trim()) return false
  return true
}

function buildCardStylePayload(form: CardStyleFormState | null): PostCardStyle | undefined {
  if (form == null || isCardStyleDefault(form)) return undefined
  const out: PostCardStyle = {}
  if (form.backgroundColor?.trim()) out.backgroundColor = form.backgroundColor.trim()
  if (form.borderColor?.trim()) out.borderColor = form.borderColor.trim()
  if (form.borderWidth != null) out.borderWidth = form.borderWidth
  if (form.borderStyle && form.borderStyle !== 'solid')
    out.borderStyle = form.borderStyle as PostCardBorderStyle
  const g = form.gradient
  if (g?.colors?.length) {
    out.gradient = {
      colors: g.colors.filter(Boolean),
      angle: g.angle,
      speed: g.speed,
    }
  }
  if (form.overlayUrl?.trim()) out.overlayUrl = form.overlayUrl.trim()
  // Persist overlayOpacity when set (default for new overlays is 0.5). Only skip when null/undefined.
  if (form.overlayOpacity != null) out.overlayOpacity = form.overlayOpacity
  if (form.overlayMode && form.overlayMode !== 'cover') out.overlayMode = form.overlayMode
  if (form.borderImage?.trim()) out.borderImage = form.borderImage.trim()
  return Object.keys(out).length ? out : undefined
}

function toggleModifyPostCard() {
  modifyPostCardOpen.value = !modifyPostCardOpen.value
  if (modifyPostCardOpen.value && cardStyleForm.value == null) {
    cardStyleForm.value = getDefaultCardStyleForm()
  }
}

// Transparency
const overlayTransparency = computed({
  get: () => 1 - (cardStyleForm.value?.overlayOpacity ?? 0.5),
  set: (v: number) => {
    if (cardStyleForm.value) cardStyleForm.value.overlayOpacity = 1 - v
  },
})

const overlayFileInputRef = ref<HTMLInputElement | null>(null)
const borderImageFileInputRef = ref<HTMLInputElement | null>(null)
const editingCardColorKey = ref<string | null>(null)
const editingCardHex = ref('#000000')
const editingCardHsl = ref({ h: 0, s: 0, l: 0 })

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const n = parseInt(hex.slice(1), 16)
  if (Number.isNaN(n)) return { h: 0, s: 0, l: 0 }
  const r = (n >> 16) / 255
  const g = ((n >> 8) & 0xff) / 255
  const b = (n & 0xff) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return { h: h * 360, s: s * 100, l: l * 100 }
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
  }
  const r = Math.round(f(0) * 255)
  const g = Math.round(f(8) * 255)
  const b = Math.round(f(4) * 255)
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
}

function openCardColorEditor(key: string) {
  editingCardColorKey.value = key
  const form = cardStyleForm.value
  let hex = '#888'
  if (key === 'backgroundColor') hex = form?.backgroundColor?.trim() || '#f5f0eb'
  else if (key === 'borderColor') hex = form?.borderColor?.trim() || '#e5dcc8'
  else if (key.startsWith('gradient-')) {
    const i = parseInt(key.replace('gradient-', ''), 10)
    const colors = form?.gradient?.colors
    if (colors && colors[i] !== undefined) hex = colors[i]
  }
  editingCardHex.value = hex
  editingCardHsl.value = hexToHsl(hex)
}

function closeCardColorEditor() {
  editingCardColorKey.value = null
}

function syncCardHexFromHsl() {
  const { h, s, l } = editingCardHsl.value
  const hex = hslToHex(h, s, l)
  editingCardHex.value = hex
  const key = editingCardColorKey.value
  const form = cardStyleForm.value
  if (!key || !form) return
  if (key === 'backgroundColor') form.backgroundColor = hex
  else if (key === 'borderColor') form.borderColor = hex
  else if (key.startsWith('gradient-')) {
    const i = parseInt(key.replace('gradient-', ''), 10)
    if (!Number.isNaN(i) && form.gradient?.colors?.[i] !== undefined) {
      const next = [...form.gradient.colors]
      next[i] = hex
      form.gradient.colors = next
    }
  }
}

function onCardEditorHexInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value?.trim().replace(/^#/, '') ?? ''
  if (/^[0-9A-Fa-f]{6}$/.test(raw)) {
    const hex = '#' + raw
    editingCardHex.value = hex
    editingCardHsl.value = hexToHsl(hex)
    const key = editingCardColorKey.value
    const form = cardStyleForm.value
    if (key && form) {
      if (key === 'backgroundColor') form.backgroundColor = hex
      else if (key === 'borderColor') form.borderColor = hex
      else if (key.startsWith('gradient-')) {
        const i = parseInt(key.replace('gradient-', ''), 10)
        if (!Number.isNaN(i) && form.gradient?.colors?.[i] !== undefined) {
          const next = [...form.gradient.colors]
          next[i] = hex
          form.gradient.colors = next
        }
      }
    }
  }
}

function onCardColorInput(field: 'backgroundColor' | 'borderColor', e: Event) {
  const value = (e.target as HTMLInputElement).value
  if (cardStyleForm.value && value) {
    if (field === 'backgroundColor') cardStyleForm.value.backgroundColor = value
    else cardStyleForm.value.borderColor = value
  }
}

function onCardHexInput(field: 'backgroundColor' | 'borderColor', e: Event) {
  const value = (e.target as HTMLInputElement).value?.trim().replace(/^#/, '') ?? ''
  if (/^[0-9A-Fa-f]{6}$/.test(value) && cardStyleForm.value) {
    const hex = '#' + value
    if (field === 'backgroundColor') cardStyleForm.value.backgroundColor = hex
    else cardStyleForm.value.borderColor = hex
  }
}

function onCardGradientColorInput(i: number, e: Event) {
  const value = (e.target as HTMLInputElement).value
  const form = cardStyleForm.value
  if (form?.gradient?.colors && form.gradient.colors[i] !== undefined && value) {
    const next = [...form.gradient.colors]
    next[i] = value
    form.gradient.colors = next
  }
}

function onCardGradientHexInput(i: number, e: Event) {
  const value = (e.target as HTMLInputElement).value?.trim().replace(/^#/, '') ?? ''
  if (/^[0-9A-Fa-f]{6}$/.test(value) && cardStyleForm.value?.gradient?.colors?.[i] !== undefined) {
    const next = [...cardStyleForm.value.gradient!.colors]
    next[i] = '#' + value
    cardStyleForm.value.gradient!.colors = next
  }
}

function addGradientColor() {
  if (!cardStyleForm.value) return
  if (!cardStyleForm.value.gradient) cardStyleForm.value.gradient = { colors: [], angle: 180, speed: 1 }
  cardStyleForm.value.gradient.colors = [...cardStyleForm.value.gradient.colors, '#888']
}

function removeGradientColor(i: number) {
  const form = cardStyleForm.value
  if (!form?.gradient?.colors || form.gradient.colors.length <= 1) return
  form.gradient.colors = form.gradient.colors.filter((_, idx) => idx !== i)
}

function onCardGradientAngleInput(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  if (cardStyleForm.value?.gradient) cardStyleForm.value.gradient.angle = val
}

function triggerOverlayFileInput() {
  overlayFileInputRef.value?.click()
}


async function onCardOverlayUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !cardStyleForm.value) return
  try {
    const formData = new FormData()
    formData.append('image', file)
    const { data } = await api.post<{ url: string }>('/posts/upload-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    // Store raw URL (relative path like /posts/images/xxx); PostCard will resolve via avatarSrc when rendering
    cardStyleForm.value.overlayUrl = data.url
    cardStyleForm.value.overlayOpacity = 0.5
    manualOverlayUrl.value = ''
  } catch (err) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Upload failed'
    error.value = msg
    if (cardStyleForm.value) cardStyleForm.value.overlayUrl = undefined
    console.error('overlay upload error', err)
  }
}

async function onCardBorderImageUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !cardStyleForm.value) return
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    error.value = 'Image must be 5 MB or smaller.'
    return
  }
  try {
    const formData = new FormData()
    formData.append('image', file)
    const { data } = await api.post<{ url: string }>('/posts/upload-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    // Store raw URL (relative path like /posts/images/xxx); PostCard will resolve via avatarSrc when rendering
    cardStyleForm.value.borderImage = data.url
    manualBorderUrl.value = ''
  } catch (err) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Upload failed'
    error.value = msg
    if (cardStyleForm.value) cardStyleForm.value.borderImage = undefined
    console.error('border image upload error', err)
  }
}

function triggerBorderImageFileInput() {
  borderImageFileInputRef.value?.click()
}

function clearOverlay() {
  if (!cardStyleForm.value) return
  cardStyleForm.value.overlayUrl = undefined
  manualOverlayUrl.value = ''
}

function clearBorderImage() {
  if (!cardStyleForm.value) return
  cardStyleForm.value.borderImage = undefined
  manualBorderUrl.value = ''
}

function applyOverlayUrl() {
  if (!cardStyleForm.value) return
  let url = manualOverlayUrl.value.trim()
  if (!url) {
    cardStyleForm.value.overlayUrl = undefined
    return
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url
  cardStyleForm.value.overlayUrl = url
  cardStyleForm.value.overlayOpacity = 0.5
}

function applyBorderUrl() {
  if (!cardStyleForm.value) return
  let url = manualBorderUrl.value.trim()
  if (!url) {
    cardStyleForm.value.borderImage = undefined
    return
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url
  cardStyleForm.value.borderImage = url
}

const previewPost = computed(() => {
  const form = cardStyleForm.value
  // stringify the form to create a deep dependency; ensures preview updates for any field change
  if (form) {
    // just evaluate JSON.stringify without storing result
    JSON.stringify(form)
  }
  const style = form ? ({ ...form } as PostCardStyle) : undefined
  return {
    id: 'preview',
    title: title.value || 'Post title',
    content: content.value || 'Preview text…',
    renderedHTML: previewHtml.value || '',
    isAnonymous: false,
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    author: { id: 'me', username: 'you', displayName: 'You', avatarUrl: null, avatarShape: null, avatarFrame: null, badgeUrl: null },
    tags: tagsStr.value ? tagsStr.value.split(',').map((t) => t.trim()).filter(Boolean) : [],
    _count: { likes: 0, comments: 0, reposts: 0 },
    cardStyle: style,
  }
})

function onWritePageDocumentClick(e: MouseEvent) {
  const target = e.target as Node
  if (formatDropdownRef.value && !formatDropdownRef.value.contains(target)) formatDropdownOpen.value = false
  if (visibilityDropdownRef.value && !visibilityDropdownRef.value.contains(target)) visibilityDropdownOpen.value = false
}
const error = ref('')
const publishLoading = ref(false)
const publishAnonymousLoading = ref(false)
const savingDraft = ref(false)
const lastSavedAt = ref('')
const conflictDraft = ref<{ id: string; version: number; content: string; title: string | null; contentType: string } | null>(null)
const draftId = ref<string | null>(null)
const draftVersion = ref(0)
const versionsOpen = ref(false)
const versions = ref<{ id: string; version: number; lastSavedAt: string }[]>([])
const versionsLoading = ref(false)
const wordInputRef = ref<HTMLInputElement | null>(null)
const imageInputRef = ref<HTMLInputElement | null>(null)
const editorRef = ref<HTMLTextAreaElement | null>(null)
const mention = reactive(useMentionAutocomplete(content, editorRef))

function onEditorInput(e: Event) {
  const el = (e.target as HTMLTextAreaElement)
  if (el && typeof el.selectionStart === 'number') mention.updateMentionState(el.selectionStart)
}
function onEditorKeydown(e: KeyboardEvent) {
  mention.onKeydown(e)
}

// referenced only by template
const previewHtml = computed(() => renderPreview(content.value, contentType.value))

function countImagesInContent(text: string, type: ContentType): number {
  if (!text) return 0
  if (type === 'MARKDOWN') return (text.match(/!\[[^\]]*\]\([^)]+\)/g) || []).length
  return (text.match(/<img\s/gi) || []).length
}
const imageCountInContent = computed(() => countImagesInContent(content.value, contentType.value))

// handler invoked by the rich text editor when it wants to upload a file
function onRichEditorImageUpload(file: File) {
  const fakeEvent = { target: { files: [file] } } as unknown as Event
  onImageUpload(fakeEvent)
}

async function onRichEditorCropApply(file: File) {
  error.value = ''
  try {
    const formData = new FormData()
    formData.append('image', file)
    const { data } = await api.post<{ url: string }>('/posts/upload-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    const absoluteUrl = avatarSrc(data.url)
    richTextEditorRef.value?.replaceSelectedImage(absoluteUrl)
  } catch (err) {
    error.value = getUploadErrorMessage(err)
  }
}

/** Normalize a single tag: trim and replace spaces with dashes. */
function normalizeTag(t: string): string {
  return t.trim().replace(/\s+/g, '-')
}

function tags(): string[] {
  return tagsStr.value
    .split(',')
    .map((t) => normalizeTag(t))
    .filter(Boolean)
}

function onTagsInput(e: Event) {
  tagsStr.value = (e.target as HTMLInputElement).value ?? ''
}

function normalizeTagsStr() {
  const normalized = tagsStr.value
    .split(',')
    .map((t) => normalizeTag(t))
    .filter(Boolean)
    .join(', ')
  if (normalized !== tagsStr.value) tagsStr.value = normalized
}

function addPollOption() {
  pollOptions.value = [...pollOptions.value, '']
}

function removePollOption(idx: number) {
  if (pollOptions.value.length <= 2) return
  pollOptions.value = pollOptions.value.filter((_, i) => i !== idx)
}

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null
function scheduleAutoSave() {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => {
    if (content.value || title.value) saveDraft(true)
  }, 3000)
}

watch([content, title], () => scheduleAutoSave())
onMounted(() => document.addEventListener('click', onWritePageDocumentClick))
onUnmounted(() => {
  document.removeEventListener('click', onWritePageDocumentClick)
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
})

async function saveDraft(silent = false) {
  if (!silent) savingDraft.value = true
  error.value = ''
  conflictDraft.value = null
  try {
    const payload: { content: string; contentType: string; title?: string; id?: string; version?: number } = {
      content: content.value,
      contentType: contentType.value,
      title: title.value || undefined,
    }
    if (draftId.value) {
      payload.id = draftId.value
      payload.version = draftVersion.value
    }
    const { data } = await api.post('/drafts', payload)
    draftId.value = data.id
    draftVersion.value = data.version ?? 1
    lastSavedAt.value = new Date().toLocaleTimeString()
    if (!silent) alert('Draft saved')
  } catch (e: unknown) {
    const err = e as { response?: { status: number; data?: { serverDraft?: unknown } } }
    if (err.response?.status === 409 && err.response?.data?.serverDraft) {
      conflictDraft.value = err.response.data.serverDraft as unknown as typeof conflictDraft.value
    } else {
      error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save draft'
    }
  } finally {
    savingDraft.value = false
  }
}

function useMine() {
  conflictDraft.value = null
  saveDraft()
}

function useServer() {
  if (!conflictDraft.value) return
  title.value = conflictDraft.value.title || ''
  content.value = conflictDraft.value.content
  contentType.value = conflictDraft.value.contentType as ContentType
  draftVersion.value = conflictDraft.value.version
  conflictDraft.value = null
}

async function doPublish(anonymous: boolean) {
  error.value = ''
  if (postType.value === 'poll') {
    const opts = pollOptions.value.map((t) => t.trim()).filter(Boolean)
    if (opts.length < 2) {
      error.value = 'Poll must have at least two options.'
      return
    }
  }
  if (anonymous) publishAnonymousLoading.value = true
  else publishLoading.value = true
  try {
    const payload: Record<string, unknown> = {
      title: title.value,
      content:
        postType.value === 'post' && contentType.value === 'WYSIWYG'
          ? normalizePostContentImageUrls(content.value)
          : content.value,
      contentType: contentType.value,
      tags: postType.value === 'post' ? tags() : [],
      isPublished: true,
      visibility: visibility.value,
      isAnonymous: anonymous,
    }
    if (postType.value === 'poll') {
      payload.poll = {
        options: pollOptions.value.map((t) => t.trim()).filter(Boolean),
        isOpen: pollIsOpen.value,
        resultsVisible: pollResultsVisible.value,
        allowMultiple: pollAllowMultiple.value,
        allowChangeVote: pollAllowChangeVote.value,
      }
    }
    const cardStyle = buildCardStylePayload(cardStyleForm.value)
    if (cardStyle != null) payload.cardStyle = cardStyle
    const { data } = await api.post('/posts', payload)
    router.push(`/posts/${data.id}`)
  } catch (e: unknown) {
    error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to publish'
  } finally {
    publishLoading.value = false
    publishAnonymousLoading.value = false
  }
}

function publish() {
  doPublish(false)
}

function publishAnonymously() {
  doPublish(true)
}

async function onWordUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  input.value = ''
  try {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await api.post<{ html: string }>('/documents/parse-docx', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    content.value = (content.value ? content.value + '\n\n' : '') + data.html
    contentType.value = 'HTML'
  } catch {
    error.value = 'Failed to parse Word document'
  }
}

function formatDate(s: string) {
  return new Date(s).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
}

async function loadVersions() {
  if (!draftId.value) return
  versionsOpen.value = true
  versionsLoading.value = true
  try {
    const { data } = await api.get<{ versions: { id: string; version: number; lastSavedAt: string }[] }>(`/drafts/${draftId.value}/versions`)
    versions.value = data.versions || []
  } catch {
    versions.value = []
  } finally {
    versionsLoading.value = false
  }
}

async function restoreVersion(versionId: string) {
  if (!draftId.value) return
  try {
    const { data } = await api.post(`/drafts/${draftId.value}/restore/${versionId}`)
    title.value = data.title || ''
    content.value = data.content
    contentType.value = data.contentType as ContentType
    draftVersion.value = data.version ?? draftVersion.value
    versionsOpen.value = false
  } catch {
    error.value = 'Failed to restore version'
  }
}

function getUploadErrorMessage(err: unknown): string {
  const msg = err && typeof err === 'object' && 'response' in err
    ? (err.response as { data?: { message?: string | string[] } })?.data?.message
    : undefined
  if (Array.isArray(msg)) return msg[0] ?? 'Failed to upload image'
  if (typeof msg === 'string') return msg
  return 'Failed to upload image'
}

async function onImageUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  input.value = ''
  if (imageCountInContent.value >= MAX_IMAGES_PER_POST) {
    error.value = 'Maximum 5 images per post.'
    return
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    error.value = 'Image must be 5 MB or smaller.'
    return
  }
  error.value = ''
  try {
    const formData = new FormData()
    formData.append('image', file)
    const { data } = await api.post<{ url: string }>('/posts/upload-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    if (contentType.value === 'WYSIWYG') {
      const absoluteUrl = avatarSrc(data.url)
      richTextEditorRef.value?.addImage(absoluteUrl)
      return
    }
    const insert = `![image](${data.url})`
    const el = editorRef.value
    if (el) {
      const start = el.selectionStart
      const end = el.selectionEnd
      const before = content.value.slice(0, start)
      const after = content.value.slice(end)
      content.value = before + insert + after
      nextTick(() => { el.selectionStart = el.selectionEnd = start + insert.length })
    } else {
      content.value += insert
    }
  } catch (err) {
    error.value = getUploadErrorMessage(err)
  }
}

function randomHex(): string {
  return '#' + Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, '0')
}

// Randomize a specific field
function randomizeCardColor(target: 'backgroundColor' | 'borderColor' | { type: 'gradient', index: number }) {
  if (!cardStyleForm.value) return
  const hex = randomHex()
  if (typeof target === 'string') {
    cardStyleForm.value[target] = hex
  } else if (target.type === 'gradient') {
    if (cardStyleForm.value.gradient && cardStyleForm.value.gradient.colors) {
      const colors = [...cardStyleForm.value.gradient.colors]
      if (colors[target.index] !== undefined) {
        colors[target.index] = hex
        cardStyleForm.value.gradient.colors = colors
      }
    }
  }
}

// Reset a specific field to default
function resetCardColor(target: 'backgroundColor' | 'borderColor' | { type: 'gradient', index: number }) {
  if (!cardStyleForm.value) return
  if (target === 'backgroundColor') {
    cardStyleForm.value.backgroundColor = undefined
  } else if (target === 'borderColor') {
    cardStyleForm.value.borderColor = undefined
  } else if (target.type === 'gradient') {
    if (cardStyleForm.value.gradient && cardStyleForm.value.gradient.colors) {
      const colors = [...cardStyleForm.value.gradient.colors]
      if (colors[target.index] !== undefined) {
        colors[target.index] = '#ffffff' 
        cardStyleForm.value.gradient.colors = colors
      }
    }
  }
}
</script>

<style scoped>
.write-page { padding: 0; max-width: 720px; margin: 0 auto; width: 100%; }
.write-page h1 { font-size: clamp(1.25rem, 4vw, 1.5rem); margin: 0 0 1.25rem; font-weight: 700; }
.form { display: flex; flex-direction: column; gap: 1.25rem; min-width: 0; }
.form-group:first-of-type { margin-bottom: 0.25rem; }
.title-input {
  width: 100%;
  min-width: 0;
  font-size: clamp(1.125rem, 4vw, 1.5rem);
  padding: 0.5rem 0;
  border: none;
  border-bottom: 1px solid var(--border-light);
  background: transparent;
  color: var(--text-primary);
  font-family: inherit;
}
.title-input::placeholder {
  color: var(--text-tertiary);
}
.title-input:focus {
  outline: none;
  border-bottom-color: var(--border-medium);
}
.title-warning { font-size: 0.8125rem; color: var(--accent-burgundy, #6b2c3e); margin: 0.25rem 0 0; }
.post-type-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.card-style-radio-row { display: flex; gap: 1rem; align-items: center; margin-top: 0.5rem; }
.ui-theme-options { display: flex; flex-wrap: wrap; gap: 0.75rem 1.25rem; margin-top: 0.5rem; }
.ui-theme-option { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.9375rem; cursor: pointer; }
.ui-theme-option input { cursor: pointer; }
.ui-theme-option input[type="radio"] {
  appearance: none;
  -webkit-appearance: none;
  width: 1.125rem;
  height: 1.125rem;
  border: 2px solid var(--border-medium);
  border-radius: 2px;
  background: var(--bg-card);
  cursor: pointer;
  flex-shrink: 0;
  transition: border-color 0.2s, background 0.2s;
}
.ui-theme-option input[type="radio"]:checked {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  box-shadow: inset 0 0 0 2px var(--bg-card);
}
.ui-theme-option input[type="radio"]:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--accent-primary);
}
.post-type-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-light, #e5e7eb);
  border-radius: var(--radius-md, 8px);
  background: var(--bg-card, #fff);
  color: var(--text-secondary, #4b5563);
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, color 0.2s;
}
.post-type-btn:hover {
  border-color: var(--border-medium, #d1d5db);
  color: var(--text-primary, #111);
}
.post-type-btn.active {
  border-color: var(--accent-primary, #8b4513);
  background: rgba(139, 69, 19, 0.08);
  color: var(--accent-primary, #8b4513);
}
.poll-desc-label,
.poll-options-label { display: block; font-size: 0.875rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.35rem; }
.poll-desc-input { width: 100%; min-width: 0; padding: 0.5rem 0.75rem; border: 1px solid var(--gray-300); border-radius: var(--radius); font-family: inherit; font-size: 0.9375rem; resize: vertical; box-sizing: border-box; }
.poll-options-group { min-width: 0; }
.poll-option-row { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem; }
.poll-option-input { flex: 1; min-width: 0; padding: 0.5rem 0.75rem; border: 1px solid var(--gray-300); border-radius: var(--radius); font-size: 0.9375rem; }
.poll-option-remove { flex-shrink: 0; padding: 0.35rem; }
.poll-option-add { margin-top: 0.25rem; }
.poll-settings { display: flex; flex-direction: column; gap: 0.5rem; }
.poll-check-wrap { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9375rem; cursor: pointer; }
.poll-check {
  width: 1.125rem;
  height: 1.125rem;
  margin: 0;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  border: 2px solid var(--border-medium);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
}
.poll-check:checked {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  box-shadow: inset 0 0 0 2px var(--bg-card);
}
.poll-check:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--accent-primary);
}
.editor-toolbar { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.dropdown-wrap { position: relative; }
.dropdown-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 0.9375rem;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.dropdown-trigger:hover {
  border-color: var(--border-medium);
}
.dropdown-trigger:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 4px rgba(139, 69, 19, 0.1);
}
.dropdown-chevron { font-size: 0.75rem; color: var(--text-tertiary); margin-left: 0.25rem; }
.dropdown-panel {
  position: absolute;
  top: calc(100% + 0.25rem);
  left: 0;
  min-width: 12rem;
  padding: 0.25rem 0;
  background: var(--bg-card);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 100;
}
.dropdown-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  color: var(--text-primary);
  font-size: 0.9375rem;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s ease;
}
.dropdown-option:hover {
  background: var(--bg-primary);
}
.dropdown-option.active {
  background: rgba(139, 69, 19, 0.08);
  color: var(--accent-primary);
  font-weight: 600;
}
.dropdown-option .pi { color: inherit; }
.dropdown-enter-active,
.dropdown-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.dropdown-enter-from,
.dropdown-leave-to { opacity: 0; transform: translateY(-4px); }
.hidden { display: none; }
.file-input-hidden {
  /* visually hidden but still focusable/clickable so programmatic .click() opens the file picker */
  position: absolute;
  opacity: 0;
  width: 0.01px;
  height: 0.01px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}
.btn-sm { padding: 0.375rem 0.75rem; font-size: 0.875rem; }
.saved-hint { font-size: 0.75rem; color: var(--gray-700); }
.editor-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; min-height: 420px; }
.editor-row--wysiwyg { grid-template-columns: 1fr; }
@media (max-width: 768px) { .editor-row { grid-template-columns: 1fr; min-height: 340px; } }
@media (max-width: 640px) {
  .post-type-btn { padding: 0.5rem 0.75rem; font-size: 0.875rem; }
  .poll-option-row { flex-wrap: wrap; }
  .poll-option-input { width: 100%; }
}
.editor-pane { min-height: 0; min-width: 0; }
.editor-mention-wrap { position: relative; }
.editor { width: 100%; height: 100%; min-height: 380px; padding: 1rem; border: 1px solid var(--gray-300); border-radius: var(--radius); font-family: inherit; resize: vertical; box-sizing: border-box; font-size: 0.9375rem; line-height: 1.6; }
.mention-dropdown { position: absolute; left: 0; right: 0; top: 100%; margin-top: 0.25rem; background: var(--bg-card); border: 1px solid var(--border-medium); border-radius: var(--radius); box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-height: 220px; overflow-y: auto; z-index: 20; }
.mention-item { display: flex; align-items: center; gap: 0.6rem; width: 100%; padding: 0.5rem 0.75rem; text-align: left; border: none; background: none; cursor: pointer; font-size: 0.9375rem; color: var(--text-primary); }
.mention-item:hover, .mention-item--selected { background: var(--gray-100, #f3f4f6); }
.mention-item--loading { color: var(--text-tertiary); cursor: default; }
.mention-avatar-wrap { width: 36px; height: 36px; flex-shrink: 0; overflow: hidden; border-radius: 50%; background: var(--border-light, #e5e7eb); }
.mention-avatar-wrap.avatar-shape-rounded { border-radius: 12%; }
.mention-avatar-wrap.avatar-shape-square { border-radius: 0; }
.mention-avatar-wrap.avatar-shape-squircle { border-radius: 25%; }
.mention-avatar, .mention-avatar-placeholder { width: 100%; height: 100%; object-fit: cover; display: block; }
.mention-avatar-placeholder { display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 1rem; color: var(--text-secondary); }
.mention-item-text { min-width: 0; display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.35rem; }
.mention-username { font-weight: 600; margin-right: 0.25rem; }
.mention-display-name { color: var(--text-secondary); font-size: 0.875rem; }
@media (max-width: 480px) {
  .editor-toolbar { gap: 0.5rem; }
  .editor { min-height: 280px; padding: 0.5rem; }
}
.preview-pane { border: 1px solid var(--gray-200); border-radius: var(--radius); background: var(--gray-50); overflow: auto; min-height: 0; }
.preview-label { font-size: 0.75rem; color: var(--gray-700); padding: 0.25rem 0.5rem; border-bottom: 1px solid var(--gray-200); }
.preview-content { padding: 0.75rem; font-size: 0.9375rem; line-height: 1.6; }
.preview-content :deep(img) { max-width: 100%; }
.tags-input {
  width: 100%;
  min-width: 0;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.9375rem;
}
.tags-input::placeholder {
  color: var(--text-tertiary);
}
.tags-input:focus {
  outline: none;
  border-color: var(--border-medium);
  box-shadow: 0 0 0 2px var(--border-light);
}
.visibility-row { display: flex; align-items: center; gap: 0.75rem; }
.error { color: #dc2626; font-size: 0.875rem; margin: 0; }
.conflict-banner { padding: 0.75rem; background: #fef3c7; border: 1px solid #f59e0b; border-radius: var(--radius); }
.conflict-banner p { margin: 0 0 0.5rem; font-size: 0.875rem; }
.versions-panel { padding: 0.75rem; border: 1px solid var(--gray-200); border-radius: var(--radius); background: var(--gray-50); margin-top: 0.5rem; }
.versions-title { font-size: 0.875rem; margin: 0 0 0.5rem; }
.versions-list { list-style: none; margin: 0; padding: 0; }
.versions-item { display: flex; align-items: center; justify-content: space-between; padding: 0.35rem 0; font-size: 0.875rem; }
.btn-ghost { background: transparent; border: none; color: var(--gray-700); cursor: pointer; }
.upload-hint { font-size: 0.8125rem; color: var(--gray-600); margin: -0.5rem 0 0; }
.actions {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 2px solid var(--border-light);
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
}
.actions-group {
  display: flex;
  gap: 0.75rem;
  flex-wrap: nowrap;
}
.btn { padding: 0.5rem 1rem; border-radius: var(--radius-md); font-size: 0.9375rem; font-weight: 600; cursor: pointer; font-family: inherit; border: 2px solid transparent; }
.btn-primary { background: var(--accent-primary); color: #fff; border-color: var(--accent-primary); }
.btn-primary:hover { filter: brightness(1.08); }
.btn-publish,
.btn-publish-anonymous { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; }
.btn-publish:disabled,
.btn-publish-anonymous:disabled { opacity: 0.8; cursor: not-allowed; }
.publish-spinner { font-size: 1.125rem; flex-shrink: 0; }

@media (max-width: 600px) {
  .actions { gap: 0.5rem; }
  .actions-group { flex-shrink: 0; gap: 0.5rem; }
  .actions-group .btn,
  .actions > .btn-outline { padding: 0.35rem 0.5rem; font-size: 0.75rem; white-space: nowrap; }
}
.btn-outline { background: transparent; border-color: var(--border-medium); color: var(--text-secondary); }
.btn-outline:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
.btn-outline:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-outline:disabled:hover { border-color: var(--border-medium); color: var(--text-secondary); }

/* Modify your post card – matches dropdown/panel/input patterns */
.card-style-section { min-width: 0; }
.card-style-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 0.9375rem;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  text-align: left;
}
.card-style-toggle:hover {
  border-color: var(--border-medium);
}
.card-style-toggle:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 4px rgba(139, 69, 19, 0.1);
}
.card-style-chevron { font-size: 0.75rem; color: var(--text-tertiary); margin-left: auto; }
.card-panel-enter-active,
.card-panel-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.card-panel-enter-from,
.card-panel-leave-to { opacity: 0; transform: translateY(-6px); }
.card-style-panel {
  margin-top: 0.5rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}
.card-style-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.card-style-group { display: flex; flex-direction: column; gap: 0.35rem; min-width: 0; }
.card-style-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
}
.card-style-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 0.9375rem;
  font-family: inherit;
  cursor: pointer;
  min-width: 0;
}
.card-style-select:hover { border-color: var(--border-medium); }
.card-style-select:focus {
  outline: none;
  border-color: var(--accent-primary);
}
.card-style-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 0.9375rem;
  font-family: inherit;
  min-width: 0;
  box-sizing: border-box;
}
.card-style-input::placeholder { color: var(--text-tertiary); }
.card-style-input:focus {
  outline: none;
  border-color: var(--accent-primary);
}
.card-style-input-narrow { width: 5rem; }
.card-style-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.card-style-select-sm { flex: 1; min-width: 6rem; }
.card-style-check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  cursor: pointer;
}
.card-style-check input {
  width: 1.125rem;
  height: 1.125rem;
  margin: 0;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  border: 2px solid var(--border-medium);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
}
.card-style-check input:checked {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  box-shadow: inset 0 0 0 2px var(--bg-card);
}
.card-style-check input:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--accent-primary);
}
.card-style-radio-row label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  cursor: pointer;
}
.card-style-radio-row input[type="radio"] {
  width: 1.125rem;
  height: 1.125rem;
  margin: 0;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  border: 2px solid var(--border-medium);
  border-radius: 50%;
  background: var(--bg-card);
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
}
.card-style-radio-row input[type="radio"]:checked {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  box-shadow: inset 0 0 0 2px var(--bg-card);
}
.card-style-radio-row input[type="radio"]:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--accent-primary);
}
.card-style-preview-wrap {
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-light);
}
.card-style-preview-label {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin-bottom: 0.35rem;
  font-weight: 600;
}
.card-style-preview-inner {
  border: 1px solid var(--gray-200);
  border-radius: var(--radius);
  background: var(--bg-card);
  overflow: hidden;
  min-height: 120px;
}
/* Color picker */
.card-style-section .color-input-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.card-style-section .color-picker {
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: 2px solid var(--border-medium);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  cursor: pointer;
}
.card-style-section .color-picker-desktop { display: none; }
@media (min-width: 769px) {
  .card-style-section .color-picker-desktop { display: block; }
}
.card-style-section .color-picker::-webkit-color-swatch-wrapper { padding: 2px; }
.card-style-section .color-picker::-webkit-color-swatch { border: none; border-radius: 4px; }
.card-style-section .color-adjust-btn {
  min-width: 2.75rem;
  min-height: 2.75rem;
  padding: 0 0.5rem;
  border: 2px solid var(--border-medium);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.4);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}
.card-style-section .color-adjust-btn:focus-visible { outline: 2px solid var(--accent-primary); outline-offset: 2px; }
@media (min-width: 769px) {
  .card-style-section .color-adjust-btn { min-width: 2.5rem; min-height: 2.5rem; padding: 0; }
  .card-style-section .color-adjust-btn-label { display: none; }
}
.card-style-section .color-adjust-btn-label { display: inline; }
.card-style-section .color-hex {
  width: 6.5rem;
  min-height: 2.75rem;
  padding: 0.5rem 0.5rem;
  font-size: 0.875rem;
  font-family: ui-monospace, monospace;
  border: 2px solid var(--border-medium);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  color: var(--text-primary);
  -webkit-tap-highlight-color: transparent;
}
@media (min-width: 769px) {
  .card-style-section .color-hex { min-height: auto; padding: 0.375rem 0.5rem; }
}
.card-style-section .color-hex:focus { outline: none; border-color: var(--accent-primary); }
.card-style-section .btn-icon-small {
  width: 2.75rem;
  height: 2.75rem;
  min-width: 2.75rem;
  min-height: 2.75rem;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}
@media (min-width: 769px) {
  .card-style-section .btn-icon-small { width: 2rem; height: 2rem; min-width: 2rem; min-height: 2rem; }
}
.card-style-section .btn-icon-small:hover { color: var(--accent-primary); background: rgba(139, 69, 19, 0.08); }
.card-style-section .btn-icon-small .pi { font-size: 0.875rem; }
.card-style-slider-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.card-style-slider {
  flex: 1;
  min-width: 80px;
  max-width: 200px;
  height: 0.5rem;
  -webkit-appearance: none;
  appearance: none;
  background: var(--border-light);
  border-radius: 999px;
  cursor: pointer;
}
.card-style-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  background: var(--accent-primary);
  border: 2px solid var(--bg-card);
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}
.card-style-slider::-webkit-slider-thumb:hover {
  filter: brightness(1.1);
}
.card-style-slider::-moz-range-thumb {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  background: var(--accent-primary);
  border: 2px solid var(--bg-card);
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}
.card-style-slider::-moz-range-thumb:hover {
  filter: brightness(1.1);
}
.card-style-slider-value {
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary);
  min-width: 2.5rem;
}
.card-style-label-inline {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-secondary);
  min-width: 3rem;
}
.card-style-gradient-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.card-style-gradient-label {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  min-width: 4.5rem;
}
.card-style-upload-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.card-style-input-url { flex: 1; min-width: 10rem; }
.card-style-remove-btn { color: var(--text-tertiary); }
.card-style-remove-btn:hover { color: var(--accent-burgundy, #c53030); }
.card-style-hint { font-size: 0.75rem; color: var(--text-tertiary); margin-top: 0.25rem; }

/* Modal backdrop shared styles (used by Teleported dialogs)
   - make global so they apply even when the element is moved out of the
     component by <Teleport>. This mirrors CustomizationView exactly. */
:global(.modal-backdrop) {
  position: fixed;
  inset: 0;
  background: rgba(44, 24, 16, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}
:global(.color-editor-backdrop) { align-items: flex-end; padding: 0; }
@media (min-width: 480px) {
  :global(.color-editor-backdrop) { align-items: center; padding: 1rem; }
}

/* base modal styles match CustomizationView's color-editor-modal */
:global(.color-editor-modal) {
  width: 100%;
  max-width: 360px;
  max-height: 90vh;
  overflow-y: auto;
  margin: 0;
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 1.5rem;
}

/* extra card-specific adjustments */
:global(.card-color-editor-backdrop .card-color-editor-modal) {
  /* keep previous width limit smaller than the generic modal so cards
     remain narrow */
  max-width: 20rem;
  padding: 1.25rem;
}
.card-color-editor-modal .color-editor-preview {
  height: 3rem;
  border-radius: var(--radius);
  margin-bottom: 0.75rem;
  border: 1px solid var(--border-light);
}
.card-color-editor-modal .color-editor-hex-wrap { margin-bottom: 1rem; }
.card-color-editor-modal .color-editor-hex {
  width: 100%;
  min-height: 2.75rem;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  font-family: ui-monospace, monospace;
  border: 2px solid var(--border-medium);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  color: var(--text-primary);
  -webkit-tap-highlight-color: transparent;
}
.card-color-editor-modal .color-editor-hex:focus { outline: none; border-color: var(--accent-primary); }
.card-color-editor-modal .color-editor-sliders { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem; }
.card-color-editor-modal .color-editor-slider-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.card-color-editor-modal .color-editor-slider-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  min-width: 4rem;
}
.card-color-editor-modal .color-editor-range {
  flex: 1;
  min-width: 0;
  height: 0.5rem;
  -webkit-appearance: none;
  appearance: none;
  background: var(--border-light);
  border-radius: 999px;
  cursor: pointer;
}
.card-color-editor-modal .color-editor-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  background: var(--bg-card);
  border: 2px solid var(--border-medium);
  cursor: pointer;
}
.card-color-editor-modal .color-editor-range::-moz-range-thumb {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  background: var(--bg-card);
  border: 2px solid var(--border-medium);
  cursor: pointer;
}
.card-color-editor-modal .color-editor-range-hue {
  background: linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);
  border-radius: 999px;
}
.card-color-editor-modal .color-editor-range-hue::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  background: var(--bg-card);
  border: 2px solid var(--border-medium);
  cursor: pointer;
}
.card-color-editor-modal .color-editor-range-hue::-moz-range-thumb {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  background: var(--bg-card);
  border: 2px solid var(--border-medium);
  cursor: pointer;
}
.card-color-editor-modal .color-editor-value {
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  color: var(--text-tertiary);
  min-width: 2.5rem;
}
.card-color-editor-modal .modal-actions { margin-top: 1rem; display: flex; justify-content: flex-end; gap: 0.5rem; }
.card-color-editor-modal .modal-heading { margin: 0 0 0.5rem; font-size: 1.125rem; }
.card-color-editor-modal .modal-hint { font-size: 0.8125rem; color: var(--text-tertiary); margin: 0 0 0.75rem; }
.card-color-editor-modal .sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 640px) {
  .card-style-panel { padding: 0.75rem; }
  .card-style-options { gap: 0.5rem; }
  .card-style-row { flex-direction: column; align-items: stretch; }
  .card-style-select-sm { min-width: 100%; }
  .card-style-gradient-row { flex-direction: column; align-items: flex-start; }
  .card-style-upload-row { flex-direction: column; align-items: stretch; }
  .card-style-input-url { min-width: 0; }
}
</style>
