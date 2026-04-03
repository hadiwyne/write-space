<template>
  <div class="settings" v-if="series" :style="{ '--s-accent': series.accentColor || 'var(--accent-primary)' }">
    <!-- Header -->
    <div class="settings-header">
      <router-link :to="'/series/' + series.slug" class="back-link">
        <i class="pi pi-arrow-left"></i> View Series
      </router-link>
      <div class="settings-header-row">
        <h1 class="settings-title">{{ series.name }} — Settings</h1>
        <span class="role-badge" :class="memberRole?.toLowerCase()">{{ memberRole }}</span>
      </div>
    </div>

    <!-- Tabs -->
    <nav class="tabs">
      <button
        v-for="tab in availableTabs"
        :key="tab.id"
        type="button"
        class="tab-btn"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <i :class="tab.icon"></i> {{ tab.label }}
      </button>
    </nav>

    <!-- ── Basics ─────────────────────────────────────────────── -->
    <section v-if="activeTab === 'basics'" class="tab-content">
      <h2 class="section-title">Basics</h2>
      <div class="fields">
        <div class="field">
          <label class="field-label">Series Name</label>
          <input v-model="basics.name" type="text" class="field-input" maxlength="80" />
        </div>
        <div class="field">
          <label class="field-label">Slug</label>
          <div class="slug-wrap">
            <span class="slug-prefix">/series/</span>
            <input v-model="basics.slug" type="text" class="field-input slug-input" maxlength="60" />
          </div>
        </div>
        <div class="field">
          <label class="field-label">Tagline</label>
          <input v-model="basics.tagline" type="text" class="field-input" maxlength="160" />
        </div>
        <div class="field">
          <label class="field-label">Description</label>
          <textarea v-model="basics.description" class="field-textarea" rows="5"></textarea>
        </div>
        <div class="field">
          <label class="field-label">Visibility</label>
          <div class="vis-group">
            <label v-for="opt in visibilityOptions" :key="opt.value" class="vis-opt" :class="{ selected: basics.visibility === opt.value }">
              <input type="radio" :value="opt.value" v-model="basics.visibility" class="vis-radio" />
              <i :class="opt.icon"></i>
              <div>
                <span class="vis-label">{{ opt.label }}</span>
                <span class="vis-desc">{{ opt.desc }}</span>
              </div>
            </label>
          </div>
        </div>
      </div>
      <SaveBar :saving="saving" :saved="saved" :error="saveError" @save="saveBasics" />
    </section>

    <!-- ── Branding ───────────────────────────────────────────── -->
    <section v-if="activeTab === 'branding'" class="tab-content">
      <h2 class="section-title">Branding</h2>

      <div class="branding-grid">
        <!-- Logo -->
        <div class="branding-item">
          <div class="branding-item-header">
            <span class="branding-label">Logo</span>
            <span class="branding-hint">256×256px recommended. Transparent background.</span>
          </div>
          <div class="image-upload-area" @click="triggerUpload('logo')">
            <img v-if="series.logoMimeType && !imageChanged.logo" :src="imgUrl('logo')" alt="Logo" class="preview-img preview-img--square" />
            <img v-else-if="imagePreviews.logo" :src="imagePreviews.logo" alt="Logo" class="preview-img preview-img--square" />
            <div v-else class="upload-placeholder">
              <i class="pi pi-image"></i>
              <span>Upload Logo</span>
            </div>
            <div class="upload-overlay"><i class="pi pi-upload"></i></div>
          </div>
          <div v-if="uploadProgress.logo" class="progress-bar"><div class="progress-fill" :style="{ width: uploadProgress.logo + '%' }"></div></div>
          <button v-if="series.logoMimeType" type="button" class="btn-remove" @click.stop="removeImage('logo')">Remove logo</button>
          <input ref="logoInput" type="file" accept="image/*" class="hidden-input" @change="onFileChange($event, 'logo')" />
        </div>

        <!-- Wordmark -->
        <div class="branding-item">
          <div class="branding-item-header">
            <span class="branding-label">Wordmark</span>
            <span class="branding-hint">Text logo, max 21:4 ratio. Transparent background.</span>
          </div>
          <div class="image-upload-area image-upload-area--wide" @click="triggerUpload('wordmark')">
            <img v-if="series.wordmarkMimeType && !imageChanged.wordmark" :src="imgUrl('wordmark')" alt="Wordmark" class="preview-img preview-img--wide" />
            <img v-else-if="imagePreviews.wordmark" :src="imagePreviews.wordmark" alt="Wordmark" class="preview-img preview-img--wide" />
            <div v-else class="upload-placeholder">
              <i class="pi pi-image"></i>
              <span>Upload Wordmark</span>
            </div>
            <div class="upload-overlay"><i class="pi pi-upload"></i></div>
          </div>
          <div v-if="uploadProgress.wordmark" class="progress-bar"><div class="progress-fill" :style="{ width: uploadProgress.wordmark + '%' }"></div></div>
          <button v-if="series.wordmarkMimeType" type="button" class="btn-remove" @click.stop="removeImage('wordmark')">Remove wordmark</button>
          <input ref="wordmarkInput" type="file" accept="image/*" class="hidden-input" @change="onFileChange($event, 'wordmark')" />
        </div>

        <!-- Cover Photo -->
        <div class="branding-item branding-item--full">
          <div class="branding-item-header">
            <span class="branding-label">Cover Photo</span>
            <span class="branding-hint">Minimum 600×600px. Displayed as hero background.</span>
          </div>

          <!-- Upload placeholder – shown when no cover is set -->
          <div
            v-if="!series.coverMimeType && !imagePreviews.cover"
            class="image-upload-area image-upload-area--cover"
            @click="triggerUpload('cover')"
          >
            <div class="upload-placeholder">
              <i class="pi pi-image"></i>
              <span>Upload Cover Photo</span>
            </div>
            <div class="upload-overlay"><i class="pi pi-upload"></i></div>
          </div>

          <!-- Draggable preview – shown when cover is set -->
          <div
            v-else
            class="cover-drag-preview"
            :class="{ dragging: isDraggingCover }"
            @mousedown="startCoverDrag"
            @touchstart.passive="startCoverDrag"
          >
            <img
              :src="imagePreviews.cover || imgUrl('cover')"
              alt="Cover preview"
              class="cover-drag-img"
              :style="{ objectPosition: `center ${theme.coverFocalY}%` }"
              draggable="false"
            />
            <div class="cover-drag-hint">
              <i class="pi pi-arrows-v"></i> Drag to reposition
            </div>
            <button type="button" class="cover-drag-remove" @click.stop="removeImage('cover')" title="Remove cover">
              <i class="pi pi-times"></i>
            </button>
          </div>

          <div v-if="uploadProgress.cover" class="progress-bar"><div class="progress-fill" :style="{ width: uploadProgress.cover + '%' }"></div></div>
          <input ref="coverInput" type="file" accept="image/*" class="hidden-input" @change="onFileChange($event, 'cover')" />
        </div>

        <!-- Social Preview -->
        <div class="branding-item branding-item--full">
          <div class="branding-item-header">
            <span class="branding-label">Social Preview</span>
            <span class="branding-hint">14:10 ratio. Default image when shared on social media.</span>
          </div>
          <div class="image-upload-area image-upload-area--social" @click="triggerUpload('social-preview')">
            <img v-if="series.socialPreviewMimeType && !imageChanged['social-preview']" :src="imgUrl('social-preview')" alt="Social Preview" class="preview-img preview-img--social" />
            <img v-else-if="imagePreviews['social-preview']" :src="imagePreviews['social-preview']" alt="Social Preview" class="preview-img preview-img--social" />
            <div v-else class="upload-placeholder">
              <i class="pi pi-image"></i>
              <span>Upload Social Preview (14:10)</span>
            </div>
            <div class="upload-overlay"><i class="pi pi-upload"></i></div>
          </div>
          <div v-if="uploadProgress['social-preview']" class="progress-bar"><div class="progress-fill" :style="{ width: uploadProgress['social-preview'] + '%' }"></div></div>
          <button v-if="series.socialPreviewMimeType" type="button" class="btn-remove" @click.stop="removeImage('social-preview')">Remove social preview</button>
          <input ref="socialInput" type="file" accept="image/*" class="hidden-input" @change="onFileChange($event, 'social-preview')" />
        </div>
      </div>

      <p v-if="uploadError" class="field-error">{{ uploadError }}</p>
      <SaveBar :saving="saving" :saved="saved" :error="saveError" @save="saveBranding" />
    </section>

    <!-- ── Theme ─────────────────────────────────────────────── -->
    <section v-if="activeTab === 'theme'" class="tab-content">
      <h2 class="section-title">Theme</h2>
      <div class="fields">
        <!-- Colors -->
        <div class="field">
          <label class="field-label">Accent Color</label>
          <div class="color-row">
            <input type="color" v-model="theme.accentColor" class="color-picker" />
            <span class="color-val">{{ theme.accentColor }}</span>
          </div>
          <span class="field-hint">Used for buttons, links, highlights.</span>
        </div>
        <div class="field">
          <label class="field-label">Cover Background Color</label>
          <div class="color-row">
            <input type="color" v-model="theme.coverBgColor" class="color-picker" />
            <span class="color-val">{{ theme.coverBgColor }}</span>
            <button type="button" class="btn-clear-color" @click="theme.coverBgColor = ''">Clear</button>
          </div>
          <span class="field-hint">Only shown when no cover photo is set.</span>
        </div>
        <div class="field">
          <label class="field-label">Page Background Color</label>
          <div class="color-row">
            <input type="color" v-model="theme.bgColor" class="color-picker" />
            <span class="color-val">{{ theme.bgColor }}</span>
            <button type="button" class="btn-clear-color" @click="theme.bgColor = ''">Clear</button>
          </div>
        </div>

        <!-- Background Image -->
        <div class="field">
          <label class="field-label">Page Background Image</label>
          <span class="field-hint">Shown behind all page content. Supports JPEG, PNG, WebP, GIF (including animated).</span>
          <div class="image-upload-area image-upload-area--bg-image" @click="triggerUpload('bg-image')">
            <img v-if="series.bgImageMimeType && !imageChanged['bg-image']" :src="imgUrl('bg-image')" alt="Background" class="preview-img preview-img--bg-image" />
            <img v-else-if="imagePreviews['bg-image']" :src="imagePreviews['bg-image']" alt="Background" class="preview-img preview-img--bg-image" />
            <div v-else class="upload-placeholder">
              <i class="pi pi-image"></i>
              <span>Upload Background Image (GIF supported)</span>
            </div>
            <div class="upload-overlay"><i class="pi pi-upload"></i></div>
          </div>
          <div v-if="uploadProgress['bg-image']" class="progress-bar"><div class="progress-fill" :style="{ width: uploadProgress['bg-image'] + '%' }"></div></div>
          <button v-if="series.bgImageMimeType || imagePreviews['bg-image']" type="button" class="btn-remove" @click.stop="removeImage('bg-image')">Remove background image</button>
          <input ref="bgImageInput" type="file" accept="image/*" class="hidden-input" @change="onFileChange($event, 'bg-image')" />
        </div>

        <!-- Font -->
        <div class="field">
          <label class="field-label">Font Family</label>
          <div class="font-options">
            <label
              v-for="f in fontOptions"
              :key="f.value"
              class="font-opt"
              :class="{ selected: theme.fontFamily === f.value }"
              :style="{ fontFamily: f.value || 'inherit' }"
            >
              <input type="radio" :value="f.value" v-model="theme.fontFamily" class="vis-radio" />
              <span>{{ f.label }}</span>
              <span class="font-sample">Aa Bb Cc</span>
            </label>
          </div>
        </div>

        <!-- Layout Mode -->
        <div class="field">
          <label class="field-label">Homepage Layout</label>
          <div class="layout-options">
            <label
              v-for="l in layoutOptions"
              :key="l.value"
              class="layout-opt"
              :class="{ selected: theme.layoutMode === l.value }"
            >
              <input type="radio" :value="l.value" v-model="theme.layoutMode" class="vis-radio" />
              <i :class="l.icon" class="layout-icon"></i>
              <div>
                <span class="layout-label">{{ l.label }}</span>
                <span class="layout-desc">{{ l.desc }}</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Post List Mode -->
        <div class="field">
          <label class="field-label">Post List Style</label>
          <div class="toggle-group">
            <label class="toggle-opt" :class="{ selected: theme.postListMode === 'list' }">
              <input type="radio" value="list" v-model="theme.postListMode" class="vis-radio" />
              <i class="pi pi-list"></i> List
            </label>
            <label class="toggle-opt" :class="{ selected: theme.postListMode === 'grid' }">
              <input type="radio" value="grid" v-model="theme.postListMode" class="vis-radio" />
              <i class="pi pi-th-large"></i> Grid
            </label>
          </div>
        </div>

        <!-- Show Top Posts -->
        <div class="field field-inline">
          <div>
            <span class="field-label">Show Top Posts section</span>
            <span class="field-hint">Displays most-engaged posts on series homepage</span>
          </div>
          <button
            type="button"
            class="toggle-switch"
            :class="{ on: theme.showTopPosts }"
            :style="theme.showTopPosts ? { background: series.accentColor || 'var(--accent-primary)' } : {}"
            @click="theme.showTopPosts = !theme.showTopPosts"
          >
            <span class="toggle-thumb"></span>
          </button>
        </div>

        <!-- Show Tagline -->
        <div class="field field-inline">
          <div>
            <span class="field-label">Show tagline in header</span>
          </div>
          <button
            type="button"
            class="toggle-switch"
            :class="{ on: theme.showTagline }"
            :style="theme.showTagline ? { background: series.accentColor || 'var(--accent-primary)' } : {}"
            @click="theme.showTagline = !theme.showTagline"
          >
            <span class="toggle-thumb"></span>
          </button>
        </div>
      </div>
      <SaveBar :saving="saving" :saved="saved" :error="saveError" @save="saveTheme" />
    </section>

    <!-- ── Members ───────────────────────────────────────────── -->
    <section v-if="activeTab === 'members'" class="tab-content">
      <h2 class="section-title">Members</h2>

      <!-- Invite by username -->
      <div v-if="isOwnerOrEditor" class="invite-section">
        <h3 class="subsection-title">Invite by Username</h3>
        <div class="invite-row">
          <input
            v-model="inviteUsername"
            type="text"
            class="field-input"
            placeholder="@username"
            @keyup.enter="inviteUser"
          />
          <button type="button" class="btn-primary" :disabled="inviting || !inviteUsername.trim()" @click="inviteUser">
            <i v-if="inviting" class="pi pi-spin pi-spinner"></i>
            <span>{{ inviting ? 'Inviting…' : 'Send Invite' }}</span>
          </button>
        </div>
        <p v-if="inviteMsg" class="invite-msg" :class="{ error: inviteIsError }">{{ inviteMsg }}</p>

        <!-- Invite Link -->
        <div class="invite-link-section">
          <h3 class="subsection-title">Invite Link</h3>
          <p class="field-hint">Anyone with this link can join as a contributor.</p>
          <div v-if="inviteLink" class="invite-link-row">
            <input type="text" :value="inviteLink" class="field-input" readonly @click="selectInviteLink($event)" />
            <button type="button" class="btn-secondary" @click="copyInviteLink">
              <i :class="copiedLink ? 'pi pi-check' : 'pi pi-copy'"></i>
              {{ copiedLink ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <button v-else type="button" class="btn-secondary" :disabled="generatingLink" @click="generateInviteLink">
            <i v-if="generatingLink" class="pi pi-spin pi-spinner"></i>
            Generate Invite Link
          </button>
        </div>
      </div>

      <!-- Members List -->
      <div class="members-list">
        <div
          v-for="m in members"
          :key="m.user.id"
          class="member-item"
        >
          <div class="member-avatar">
            <img v-if="m.user.avatarUrl" :src="avatarSrc(m.user.avatarUrl)" alt="" class="member-img" />
            <span v-else class="member-initial">{{ (m.user.displayName || m.user.username || '?')[0] }}</span>
          </div>
          <div class="member-info">
            <span class="member-name">{{ m.user.displayName || m.user.username }}</span>
            <span class="member-username">@{{ m.user.username }}</span>
          </div>
          <span class="member-role" :class="m.role.toLowerCase()">{{ m.role }}</span>
          <div v-if="canManageMember(m)" class="member-actions">
            <select
              v-if="m.role !== 'OWNER'"
              class="role-select"
              :value="m.role"
              @change="changeRoleFromEvent(m, $event)"
            >
              <option value="EDITOR">Editor</option>
              <option value="CONTRIBUTOR">Contributor</option>
            </select>
            <button
              v-if="m.role !== 'OWNER'"
              type="button"
              class="btn-remove-member"
              title="Remove member"
              @click="removeMember(m)"
            >
              <i class="pi pi-times"></i>
            </button>
          </div>
        </div>
        <div v-if="!members.length" class="empty-members">No members yet.</div>
      </div>
    </section>

    <!-- ── Posts ─────────────────────────────────────────────── -->
    <section v-if="activeTab === 'posts'" class="tab-content">
      <h2 class="section-title">Posts</h2>

      <!-- Pending Approvals -->
      <div v-if="pendingPosts.length && isOwnerOrEditor" class="pending-section">
        <h3 class="subsection-title pending-title">
          <i class="pi pi-clock"></i> Pending Approval ({{ pendingPosts.length }})
        </h3>
        <div class="pending-list">
          <div v-for="p in pendingPosts" :key="p.id" class="pending-item">
            <div class="pending-info">
              <span class="pending-post-title">{{ p.title }}</span>
              <span class="pending-author">by {{ p.author?.displayName || p.author?.username }}</span>
            </div>
            <div class="pending-actions">
              <button type="button" class="btn-approve" @click="approvePost(p)">
                <i class="pi pi-check"></i> Approve
              </button>
              <button type="button" class="btn-reject" @click="rejectPost(p)">
                <i class="pi pi-times"></i> Reject
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Post Order Hint -->
      <p class="field-hint" style="margin-bottom:1rem">
        Drag posts to reorder them on the series homepage. Click the minus button to remove.
      </p>

      <!-- Posts list with reorder -->
      <div class="posts-list" ref="postsListRef">
        <div
          v-for="(p, idx) in approvedPosts"
          :key="p.id"
          class="post-manage-item"
          draggable="true"
          @dragstart="onDragStart(idx)"
          @dragover.prevent="onDragOver(idx)"
          @drop="onDrop"
        >
          <i class="pi pi-bars drag-handle"></i>
          <span class="post-manage-title">{{ p.title }}</span>
          <span class="post-manage-author">{{ p.author?.displayName || p.author?.username }}</span>
          <button type="button" class="btn-remove-post" @click="removePost(p)">
            <i class="pi pi-minus-circle"></i>
          </button>
        </div>
        <div v-if="!approvedPosts.length" class="empty-posts">No approved posts yet.</div>
      </div>

      <div v-if="reorderDirty" class="reorder-save">
        <button type="button" class="btn-primary" :disabled="saving" @click="saveOrder">
          <i v-if="saving" class="pi pi-spin pi-spinner"></i>
          Save Order
        </button>
      </div>
    </section>

    <!-- ── Danger Zone ───────────────────────────────────────── -->
    <section v-if="activeTab === 'danger' && memberRole === 'OWNER'" class="tab-content">
      <h2 class="section-title danger-title">Danger Zone</h2>
      <div class="danger-card">
        <div>
          <strong>Delete this Series</strong>
          <p class="field-hint">This will permanently delete the series and all its membership data. Posts will not be deleted.</p>
        </div>
        <button type="button" class="btn-danger" @click="confirmDelete">
          Delete Series
        </button>
      </div>

      <!-- Confirm modal -->
      <Teleport to="body">
        <div v-if="showDeleteConfirm" class="modal-backdrop" @click.self="showDeleteConfirm = false">
          <div class="modal">
            <h3 class="modal-title">Delete "{{ series.name }}"?</h3>
            <p>This action cannot be undone. All series data (members, post associations) will be permanently deleted.</p>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="showDeleteConfirm = false">Cancel</button>
              <button type="button" class="btn-danger" :disabled="deleting" @click="doDelete">
                <i v-if="deleting" class="pi pi-spin pi-spinner"></i>
                {{ deleting ? 'Deleting…' : 'Yes, Delete' }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </section>
  </div>

  <!-- Loading -->
  <div v-else-if="loadingPage" class="page-loading">
    <i class="pi pi-spin pi-spinner"></i>
  </div>

  <!-- Error / Forbidden -->
  <div v-else-if="loadError" class="page-error">
    <p>{{ loadError }}</p>
    <router-link to="/series" class="btn-back">Back to Series</router-link>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch, defineComponent, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, avatarSrc, apiBaseUrl } from '@/api/client'
import { useSeriesStore } from '@/stores/series'
import type { SeriesInfo } from '@/stores/series'

const route = useRoute()
const router = useRouter()
const seriesStore = useSeriesStore()

// ─── SaveBar helper component ─────────────────────────────────────────────────
const SaveBar = defineComponent({
  props: { saving: Boolean, saved: Boolean, error: String },
  emits: ['save'],
  setup(props, { emit }) {
    return () => h('div', { class: 'save-bar' }, [
      props.error
        ? h('span', { class: 'save-error' }, props.error)
        : props.saved
        ? h('span', { class: 'save-ok' }, [h('i', { class: 'pi pi-check' }), ' Saved!'])
        : null,
      h('button', {
        type: 'button',
        class: 'btn-primary',
        disabled: props.saving,
        onClick: () => emit('save'),
      }, props.saving ? [h('i', { class: 'pi pi-spin pi-spinner' }), ' Saving…'] : 'Save Changes'),
    ])
  },
})

// ─── State ────────────────────────────────────────────────────────────────────
const series = ref<SeriesInfo | null>(null)
const members = ref<any[]>([])
const allPosts = ref<any[]>([])
const loadingPage = ref(true)
const loadError = ref('')
const memberRole = ref<'OWNER' | 'EDITOR' | 'CONTRIBUTOR' | null>(null)
const activeTab = ref('basics')
const saving = ref(false)
const saved = ref(false)
const saveError = ref('')

// Basics form
const basics = reactive({ name: '', slug: '', tagline: '', description: '', visibility: 'PUBLIC' as string })

// Theme form
const theme = reactive({
  accentColor: '#6366f1',
  coverBgColor: '',
  bgColor: '',
  coverFocalY: 50,
  fontFamily: '',
  layoutMode: 'feature',
  postListMode: 'list',
  showTopPosts: true,
  showTagline: true,
})

// Cover focal-point drag
const isDraggingCover = ref(false)
let _coverDragStartY = 0
let _coverDragStartFocal = 50
function startCoverDrag(e: MouseEvent | TouchEvent) {
  isDraggingCover.value = true
  _coverDragStartY = 'touches' in e ? e.touches[0].clientY : e.clientY
  _coverDragStartFocal = theme.coverFocalY
}
function onCoverDragMove(e: MouseEvent | TouchEvent) {
  if (!isDraggingCover.value) return
  const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY
  // Drag up → reveal more of bottom (increase %), drag down → reveal more of top (decrease %)
  const delta = (_coverDragStartY - clientY) * 0.35
  theme.coverFocalY = Math.max(0, Math.min(100, Math.round(_coverDragStartFocal + delta)))
}
function stopCoverDrag() { isDraggingCover.value = false }

// Image upload state
type ImgType = 'logo' | 'wordmark' | 'cover' | 'social-preview' | 'bg-image'
const imagePreviews = reactive<Record<ImgType, string | null>>({ logo: null, wordmark: null, cover: null, 'social-preview': null, 'bg-image': null })
const imageChanged = reactive<Record<ImgType, boolean>>({ logo: false, wordmark: false, cover: false, 'social-preview': false, 'bg-image': false })
const uploadProgress = reactive<Record<ImgType, number>>({ logo: 0, wordmark: 0, cover: 0, 'social-preview': 0, 'bg-image': 0 })
const uploadError = ref('')
const logoInput = ref<HTMLInputElement | null>(null)
const wordmarkInput = ref<HTMLInputElement | null>(null)
const coverInput = ref<HTMLInputElement | null>(null)
const socialInput = ref<HTMLInputElement | null>(null)
const bgImageInput = ref<HTMLInputElement | null>(null)

// Members tab
const inviteUsername = ref('')
const inviting = ref(false)
const inviteMsg = ref('')
const inviteIsError = ref(false)
const inviteLink = ref('')
const generatingLink = ref(false)
const copiedLink = ref(false)

// Posts tab
const pendingPosts = computed(() => allPosts.value.filter((p: any) => p.seriesStatus === 'PENDING'))
const approvedPosts = ref<any[]>([])
let dragFromIdx = -1
const reorderDirty = ref(false)

// Danger
const showDeleteConfirm = ref(false)
const deleting = ref(false)

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const availableTabs = computed(() => {
  const tabs = [
    { id: 'basics', label: 'Basics', icon: 'pi pi-info-circle' },
    { id: 'branding', label: 'Branding', icon: 'pi pi-palette' },
    { id: 'theme', label: 'Theme', icon: 'pi pi-sliders-h' },
    { id: 'members', label: 'Members', icon: 'pi pi-users' },
    { id: 'posts', label: 'Posts', icon: 'pi pi-book' },
  ]
  if (memberRole.value === 'OWNER') {
    tabs.push({ id: 'danger', label: 'Danger Zone', icon: 'pi pi-exclamation-triangle' })
  }
  return tabs
})

const isOwnerOrEditor = computed(() => memberRole.value === 'OWNER' || memberRole.value === 'EDITOR')

// ─── Options ─────────────────────────────────────────────────────────────────
const visibilityOptions = [
  { value: 'PUBLIC', label: 'Public', desc: 'Anyone can view', icon: 'pi pi-globe' },
  { value: 'FOLLOWERS_ONLY', label: 'Followers only', desc: 'Only your followers', icon: 'pi pi-users' },
  { value: 'PRIVATE', label: 'Private', desc: 'Members only', icon: 'pi pi-lock' },
]

const fontOptions = [
  { value: '', label: 'Default' },
  { value: 'Georgia, serif', label: 'Georgia (Serif)' },
  { value: 'Inter, sans-serif', label: 'Inter (Sans-serif)' },
  { value: 'Lora, serif', label: 'Lora (Elegant Serif)' },
  { value: 'Merriweather, serif', label: 'Merriweather (Reading)' },
  { value: 'Playfair Display, serif', label: 'Playfair Display (Editorial)' },
]

const layoutOptions = [
  { value: 'feature', label: 'Feature', desc: '1 hero post + list', icon: 'pi pi-star' },
  { value: 'magazine', label: 'Magazine', desc: '5 visual grid hero', icon: 'pi pi-th-large' },
  { value: 'newspaper', label: 'Newspaper', desc: '8+ dense grid', icon: 'pi pi-align-justify' },
]

// ─── Load data ────────────────────────────────────────────────────────────────
async function loadAll() {
  const slug = route.params.slug as string
  loadingPage.value = true
  loadError.value = ''
  try {
    const [seriesRes, membersRes, postsRes] = await Promise.all([
      api.get(`/series/${slug}`, { cache: false }),
      api.get(`/series/${slug}/members`, { cache: false }),
      api.get(`/series/${slug}/posts`, { params: { limit: '200' }, cache: false }),
    ])

    series.value = seriesRes.data
    memberRole.value = seriesRes.data.memberRole
    members.value = membersRes.data
    allPosts.value = postsRes.data

    approvedPosts.value = postsRes.data.filter((p: any) => p.seriesStatus !== 'PENDING')

    // Populate form state
    const s = seriesRes.data as SeriesInfo
    basics.name = s.name
    basics.slug = s.slug
    basics.tagline = s.tagline ?? ''
    basics.description = s.description ?? ''
    basics.visibility = s.visibility

    theme.accentColor = s.accentColor ?? '#6366f1'
    theme.coverBgColor = s.coverBgColor ?? ''
    theme.bgColor = s.bgColor ?? ''
    theme.coverFocalY = s.coverFocalY ?? 50
    theme.fontFamily = s.fontFamily ?? ''
    theme.layoutMode = s.layoutMode ?? 'feature'
    theme.postListMode = s.postListMode ?? 'list'
    theme.showTopPosts = s.showTopPosts ?? true
    theme.showTagline = s.showTagline ?? true
  } catch (e: any) {
    loadError.value = e?.response?.data?.message || 'Unable to load series settings'
  } finally {
    loadingPage.value = false
  }
}

onMounted(() => {
  loadAll()
  window.addEventListener('mousemove', onCoverDragMove)
  window.addEventListener('mouseup', stopCoverDrag)
  window.addEventListener('touchmove', onCoverDragMove as any, { passive: false })
  window.addEventListener('touchend', stopCoverDrag)
})
onUnmounted(() => {
  window.removeEventListener('mousemove', onCoverDragMove)
  window.removeEventListener('mouseup', stopCoverDrag)
  window.removeEventListener('touchmove', onCoverDragMove as any)
  window.removeEventListener('touchend', stopCoverDrag)
})
watch(() => route.params.slug, loadAll)

// ─── Save helpers ─────────────────────────────────────────────────────────────
function showSaved() {
  saved.value = true
  setTimeout(() => { saved.value = false }, 2500)
}

async function saveBasics() {
  saving.value = true; saveError.value = ''
  try {
    const slug = route.params.slug as string
    const updated = await seriesStore.updateSeries(slug, {
      name: basics.name,
      slug: basics.slug,
      tagline: basics.tagline || undefined,
      description: basics.description || undefined,
      visibility: basics.visibility as any,
    })
    series.value = { ...series.value!, ...updated }
    if (updated.slug && updated.slug !== slug) {
      await router.replace(`/series/${updated.slug}/settings`)
    }
    showSaved()
  } catch (e: any) {
    saveError.value = e?.response?.data?.message || 'Failed to save'
  } finally {
    saving.value = false
  }
}

async function saveBranding() {
  saving.value = true; saveError.value = ''
  try {
    const slug = route.params.slug as string
    const updated = await seriesStore.updateSeries(slug, { coverFocalY: theme.coverFocalY })
    series.value = { ...series.value!, ...updated }
    showSaved()
  } catch (e: any) {
    saveError.value = e?.response?.data?.message || 'Failed to save'
  } finally {
    saving.value = false
  }
}

async function saveTheme() {
  saving.value = true; saveError.value = ''
  try {
    const slug = route.params.slug as string
    const updated = await seriesStore.updateSeries(slug, {
      accentColor: theme.accentColor || null,
      coverBgColor: theme.coverBgColor || null,
      bgColor: theme.bgColor || null,
      coverFocalY: theme.coverFocalY,
      fontFamily: theme.fontFamily || null,
      layoutMode: theme.layoutMode,
      postListMode: theme.postListMode,
      showTopPosts: theme.showTopPosts,
      showTagline: theme.showTagline,
    })
    series.value = { ...series.value!, ...updated }
    showSaved()
  } catch (e: any) {
    saveError.value = e?.response?.data?.message || 'Failed to save'
  } finally {
    saving.value = false
  }
}

// ─── Images ───────────────────────────────────────────────────────────────────
function imgUrl(type: ImgType) {
  const slug = route.params.slug as string
  return `${apiBaseUrl.replace(/\/$/, '')}/series/${encodeURIComponent(slug)}/images/${type}`
}

function triggerUpload(type: ImgType) {
  const map: Record<ImgType, typeof logoInput> = {
    logo: logoInput, wordmark: wordmarkInput, cover: coverInput, 'social-preview': socialInput, 'bg-image': bgImageInput,
  }
  map[type].value?.click()
}

async function onFileChange(e: Event, type: ImgType) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploadError.value = ''

  const reader = new FileReader()
  reader.onload = (ev) => { imagePreviews[type] = ev.target?.result as string }
  reader.readAsDataURL(file)
  imageChanged[type] = true

  try {
    await seriesStore.uploadImage(
      route.params.slug as string,
      type,
      file,
      (pct) => { uploadProgress[type] = pct },
    )
    uploadProgress[type] = 0
    if (series.value) {
      const keyMap: Record<ImgType, string> = {
        logo: 'logoMimeType',
        wordmark: 'wordmarkMimeType',
        cover: 'coverMimeType',
        'social-preview': 'socialPreviewMimeType',
        'bg-image': 'bgImageMimeType',
      }
      ;(series.value as any)[keyMap[type]] = file.type
    }
  } catch (err: any) {
    uploadError.value = err?.response?.data?.message || 'Upload failed'
    uploadProgress[type] = 0
  }
}

async function removeImage(type: ImgType) {
  try {
    await seriesStore.deleteImage(route.params.slug as string, type)
    imagePreviews[type] = null
    imageChanged[type] = false
    if (series.value) {
      const keyMap: Record<ImgType, string> = {
        logo: 'logoMimeType',
        wordmark: 'wordmarkMimeType',
        cover: 'coverMimeType',
        'social-preview': 'socialPreviewMimeType',
        'bg-image': 'bgImageMimeType',
      }
      ;(series.value as any)[keyMap[type]] = null
    }
  } catch (err: any) {
    uploadError.value = err?.response?.data?.message || 'Failed to remove image'
  }
}

// ─── Members ──────────────────────────────────────────────────────────────────
async function inviteUser() {
  if (!inviteUsername.value.trim()) return
  inviting.value = true; inviteMsg.value = ''; inviteIsError.value = false
  try {
    const slug = route.params.slug as string
    const username = inviteUsername.value.trim().replace(/^@/, '')
    await api.post(`/series/${slug}/members/invite`, { username }, { cache: false })
    inviteMsg.value = `Invite sent to @${username}`
    inviteUsername.value = ''
  } catch (e: any) {
    inviteMsg.value = e?.response?.data?.message || 'Failed to send invite'
    inviteIsError.value = true
  } finally {
    inviting.value = false
  }
}

async function generateInviteLink() {
  generatingLink.value = true
  try {
    const slug = route.params.slug as string
    const { data } = await api.get(`/series/${slug}/invite-link`, { cache: false })
    const base = window.location.origin
    inviteLink.value = `${base}/series/join/${data.token}`
  } catch (e: any) {
    inviteMsg.value = e?.response?.data?.message || 'Failed to generate link'
    inviteIsError.value = true
  } finally {
    generatingLink.value = false
  }
}

async function copyInviteLink() {
  await navigator.clipboard.writeText(inviteLink.value).catch(() => {})
  copiedLink.value = true
  setTimeout(() => { copiedLink.value = false }, 2000)
}

function canManageMember(m: any): boolean {
  if (memberRole.value === 'OWNER') return true
  if (memberRole.value === 'EDITOR' && m.role === 'CONTRIBUTOR') return true
  return false
}

function selectInviteLink(e: Event) {
  (e.target as HTMLInputElement).select()
}

function changeRoleFromEvent(m: any, e: Event) {
  changeRole(m, (e.target as HTMLSelectElement).value)
}

async function changeRole(m: any, newRole: string) {
  try {
    const slug = route.params.slug as string
    await api.patch(`/series/${slug}/members/${m.user.id}/role`, { role: newRole }, { cache: false })
    m.role = newRole
  } catch (e: any) {
    alert(e?.response?.data?.message || 'Failed to update role')
  }
}

async function removeMember(m: any) {
  if (!confirm(`Remove ${m.user.displayName || m.user.username} from this series?`)) return
  try {
    const slug = route.params.slug as string
    await api.delete(`/series/${slug}/members/${m.user.id}`, { cache: false })
    members.value = members.value.filter((x) => x.user.id !== m.user.id)
  } catch (e: any) {
    alert(e?.response?.data?.message || 'Failed to remove member')
  }
}

// ─── Posts ────────────────────────────────────────────────────────────────────
async function approvePost(p: any) {
  try {
    const slug = route.params.slug as string
    await api.patch(`/series/${slug}/posts/${p.id}/approve`, {}, { cache: false })
    p.seriesStatus = 'APPROVED'
    approvedPosts.value.push(p)
  } catch (e: any) {
    alert(e?.response?.data?.message || 'Failed to approve post')
  }
}

async function rejectPost(p: any) {
  try {
    const slug = route.params.slug as string
    await api.delete(`/series/${slug}/posts/${p.id}/reject`, { cache: false })
    allPosts.value = allPosts.value.filter((x) => x.id !== p.id)
  } catch (e: any) {
    alert(e?.response?.data?.message || 'Failed to reject post')
  }
}

async function removePost(p: any) {
  if (!confirm(`Remove "${p.title}" from this series?`)) return
  try {
    const slug = route.params.slug as string
    await api.delete(`/series/${slug}/posts/${p.id}`, { cache: false })
    approvedPosts.value = approvedPosts.value.filter((x) => x.id !== p.id)
    allPosts.value = allPosts.value.filter((x) => x.id !== p.id)
  } catch (e: any) {
    alert(e?.response?.data?.message || 'Failed to remove post')
  }
}

function onDragStart(idx: number) { dragFromIdx = idx }
function onDragOver(idx: number) {
  if (dragFromIdx === idx || dragFromIdx === -1) return
  const arr = [...approvedPosts.value]
  const [item] = arr.splice(dragFromIdx, 1)
  arr.splice(idx, 0, item)
  approvedPosts.value = arr
  dragFromIdx = idx
  reorderDirty.value = true
}
function onDrop() { dragFromIdx = -1 }

async function saveOrder() {
  saving.value = true
  try {
    const slug = route.params.slug as string
    await api.patch(`/series/${slug}/posts/reorder`, { postIds: approvedPosts.value.map((p) => p.id) }, { cache: false })
    reorderDirty.value = false
    showSaved()
  } catch (e: any) {
    saveError.value = e?.response?.data?.message || 'Failed to save order'
  } finally {
    saving.value = false
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────
function confirmDelete() { showDeleteConfirm.value = true }

async function doDelete() {
  deleting.value = true
  try {
    await seriesStore.deleteSeries(route.params.slug as string)
    await router.push('/series')
  } catch (e: any) {
    alert(e?.response?.data?.message || 'Failed to delete series')
  } finally {
    deleting.value = false
    showDeleteConfirm.value = false
  }
}
</script>

<style scoped>
.settings {
  --s-accent: var(--accent-primary);
  max-width: 860px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.settings-header { margin-bottom: 1.5rem; }

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  margin-bottom: 0.875rem;
  transition: color 0.15s;
}

.back-link:hover { color: var(--s-accent); }

.settings-header-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.settings-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.role-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.role-badge.owner { background: color-mix(in srgb, var(--s-accent) 15%, var(--bg-secondary)); color: var(--s-accent); }
.role-badge.editor { background: #d1fae5; color: #065f46; }
.role-badge.contributor { background: #eff6ff; color: #1e40af; }

/* ─── Tabs ─── */
.tabs {
  display: flex;
  gap: 0.25rem;
  border-bottom: 2px solid var(--border-light);
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  cursor: pointer;
  font-family: inherit;
  transition: color 0.15s, border-color 0.15s;
}

.tab-btn.active {
  color: var(--s-accent);
  border-bottom-color: var(--s-accent);
}

.tab-btn:hover:not(.active) {
  color: var(--text-primary);
}

/* ─── Tab Content ─── */
.tab-content { animation: fadeIn 0.15s ease; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

.section-title {
  font-size: 1.125rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 1.5rem;
}

.subsection-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.fields { display: flex; flex-direction: column; gap: 1.25rem; margin-bottom: 1.5rem; }

.field { display: flex; flex-direction: column; gap: 0.375rem; }

.field-label {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary);
}

.field-inline {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md, 8px);
}

.field-input, .field-textarea {
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md, 8px);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 0.9375rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}

.field-input:focus, .field-textarea:focus { border-color: var(--s-accent); }
.field-textarea { resize: vertical; min-height: 100px; }
.field-hint { font-size: 0.8125rem; color: var(--text-tertiary); }
.field-error { font-size: 0.8125rem; color: #ef4444; }

/* ─── Slug ─── */
.slug-wrap {
  display: flex;
  align-items: center;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
  transition: border-color 0.15s;
}
.slug-wrap:focus-within { border-color: var(--s-accent); }
.slug-prefix { padding: 0.75rem; font-size: 0.875rem; color: var(--text-tertiary); background: var(--bg-secondary); border-right: 1px solid var(--border-light); white-space: nowrap; }
.slug-input { border: none; border-radius: 0; flex: 1; background: transparent; }

/* ─── Visibility ─── */
.vis-group { display: flex; flex-direction: column; gap: 0.5rem; }
.vis-opt {
  display: flex; align-items: flex-start; gap: 0.75rem;
  padding: 0.75rem 1rem; border: 2px solid var(--border-light);
  border-radius: var(--radius-md, 8px); cursor: pointer; transition: border-color 0.15s;
}
.vis-opt.selected { border-color: var(--s-accent); background: color-mix(in srgb, var(--s-accent) 6%, var(--bg-card)); }
.vis-radio { display: none; }
.vis-label { display: block; font-size: 0.9375rem; font-weight: 600; color: var(--text-primary); }
.vis-desc { display: block; font-size: 0.8125rem; color: var(--text-secondary); }

/* ─── Colors ─── */
.color-row { display: flex; align-items: center; gap: 0.75rem; }
.color-picker { width: 44px; height: 34px; padding: 2px; border: 1px solid var(--border-light); border-radius: 6px; cursor: pointer; }
.color-val { font-size: 0.875rem; font-family: monospace; color: var(--text-secondary); }
.btn-clear-color { font-size: 0.8125rem; color: var(--text-tertiary); background: none; border: none; cursor: pointer; text-decoration: underline; font-family: inherit; }

/* ─── Fonts ─── */
.font-options { display: flex; flex-direction: column; gap: 0.5rem; }
.font-opt {
  display: flex; align-items: center; gap: 0.875rem; padding: 0.75rem 1rem;
  border: 2px solid var(--border-light); border-radius: var(--radius-md, 8px);
  cursor: pointer; transition: border-color 0.15s;
}
.font-opt.selected { border-color: var(--s-accent); }
.font-sample { font-size: 0.8125rem; color: var(--text-tertiary); margin-left: auto; }

/* ─── Layout ─── */
.layout-options { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
.layout-opt {
  display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
  padding: 1rem; border: 2px solid var(--border-light); border-radius: var(--radius-md, 8px);
  cursor: pointer; text-align: center; transition: border-color 0.15s;
}
.layout-opt.selected { border-color: var(--s-accent); background: color-mix(in srgb, var(--s-accent) 6%, var(--bg-card)); }
.layout-icon { font-size: 1.5rem; color: var(--text-secondary); }
.layout-opt.selected .layout-icon { color: var(--s-accent); }
.layout-label { font-size: 0.9375rem; font-weight: 700; color: var(--text-primary); }
.layout-desc { font-size: 0.75rem; color: var(--text-secondary); }

/* ─── Toggle group ─── */
.toggle-group { display: flex; gap: 0.5rem; }
.toggle-opt {
  display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 1rem;
  border: 2px solid var(--border-light); border-radius: var(--radius-md, 8px);
  cursor: pointer; font-size: 0.875rem; font-weight: 600; color: var(--text-secondary);
  transition: border-color 0.15s, color 0.15s;
}
.toggle-opt.selected { border-color: var(--s-accent); color: var(--s-accent); }

/* ─── Toggle switch ─── */
.toggle-switch {
  width: 44px; height: 24px; border-radius: 12px; position: relative;
  background: var(--bg-secondary); border: none; cursor: pointer;
  transition: background 0.2s; flex-shrink: 0;
}
.toggle-switch.on { background: var(--s-accent); }
.toggle-thumb {
  position: absolute; top: 2px; left: 2px; width: 20px; height: 20px;
  border-radius: 50%; background: #fff; transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.toggle-switch.on .toggle-thumb { transform: translateX(20px); }

/* ─── Save Bar ─── */
:deep(.save-bar) {
  display: flex; align-items: center; gap: 1rem; margin-top: 1.5rem;
  padding-top: 1.5rem; border-top: 1px solid var(--border-light);
  flex-wrap: wrap;
}
:deep(.save-ok) { display: flex; align-items: center; gap: 0.375rem; font-size: 0.9375rem; color: #16a34a; font-weight: 600; }
:deep(.save-error) { font-size: 0.875rem; color: #ef4444; }

/* ─── Buttons ─── */
.btn-primary {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.625rem 1.5rem; background: var(--s-accent); color: #fff;
  border: none; border-radius: var(--radius-md, 8px); font-size: 0.9375rem;
  font-weight: 600; font-family: inherit; cursor: pointer; transition: opacity 0.15s;
}
.btn-primary:hover:not(:disabled) { opacity: 0.9; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-secondary {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.625rem 1.25rem; background: var(--bg-card);
  border: 1px solid var(--border-light); border-radius: var(--radius-md, 8px);
  color: var(--text-secondary); font-size: 0.9375rem; font-weight: 600;
  font-family: inherit; cursor: pointer; transition: border-color 0.15s;
}
.btn-secondary:hover:not(:disabled) { border-color: var(--s-accent); color: var(--s-accent); }
.btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }

/* ─── Branding ─── */
.branding-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.branding-item { display: flex; flex-direction: column; gap: 0.5rem; }
.branding-item--full { grid-column: 1 / -1; }

.cover-drag-preview {
  position: relative;
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
  height: 200px;
  cursor: grab;
  user-select: none;
  line-height: 0;
}
.cover-drag-preview.dragging { cursor: grabbing; }
.cover-drag-img { width: 100%; height: 100%; object-fit: cover; display: block; pointer-events: none; }
.cover-drag-hint {
  position: absolute;
  bottom: 0.5rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.55);
  color: #fff;
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  pointer-events: none;
  opacity: 1;
  transition: opacity 0.2s;
  white-space: nowrap;
}
.cover-drag-preview.dragging .cover-drag-hint { opacity: 0; }
.cover-drag-remove {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0,0,0,0.6);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  transition: background 0.15s;
  z-index: 1;
}
.cover-drag-remove:hover { background: rgba(0,0,0,0.85); }

.branding-item-header { display: flex; flex-direction: column; gap: 0.125rem; }
.branding-label { font-size: 0.9375rem; font-weight: 600; color: var(--text-primary); }

.image-upload-area {
  position: relative; overflow: hidden; cursor: pointer;
  border: 2px dashed var(--border-light); border-radius: var(--radius-md, 8px);
  background: var(--bg-secondary); transition: border-color 0.15s;
  height: 140px; display: flex; align-items: center; justify-content: center;
}

.image-upload-area:hover { border-color: var(--s-accent); }
.image-upload-area--wide { height: 80px; }
.image-upload-area--cover { height: 180px; }
.image-upload-area--social { height: 160px; }
.image-upload-area--bg-image { height: 160px; }

.preview-img { width: 100%; height: 100%; object-fit: contain; }
.preview-img--wide { object-fit: contain; }
.preview-img--cover, .preview-img--social, .preview-img--bg-image { object-fit: cover; }

.upload-placeholder {
  display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
  color: var(--text-tertiary);
}
.upload-placeholder .pi { font-size: 1.75rem; }
.upload-placeholder span { font-size: 0.875rem; font-weight: 600; }

.upload-overlay {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.5); color: #fff; font-size: 1.5rem;
  opacity: 0; transition: opacity 0.15s;
}
.image-upload-area:hover .upload-overlay { opacity: 1; }

.progress-bar {
  height: 4px; background: var(--bg-secondary); border-radius: 2px; overflow: hidden;
}
.progress-fill { height: 100%; background: var(--s-accent); transition: width 0.1s; }

.btn-remove {
  font-size: 0.8125rem; color: #ef4444; background: none; border: none;
  cursor: pointer; text-align: left; font-family: inherit; text-decoration: underline;
}

.hidden-input { display: none; }

/* ─── Members ─── */
.invite-section {
  background: var(--bg-card); border: 1px solid var(--border-light);
  border-radius: var(--radius-md, 8px); padding: 1.25rem; margin-bottom: 1.5rem;
}

.invite-row { display: flex; gap: 0.75rem; }
.invite-row .field-input { flex: 1; }

.invite-msg { font-size: 0.875rem; margin: 0.5rem 0 0; color: #16a34a; }
.invite-msg.error { color: #ef4444; }

.invite-link-section { margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px solid var(--border-light); }
.invite-link-row { display: flex; gap: 0.75rem; }
.invite-link-row .field-input { flex: 1; }

.members-list { display: flex; flex-direction: column; gap: 0.625rem; }

.member-item {
  display: flex; align-items: center; gap: 0.875rem;
  padding: 0.875rem 1rem; background: var(--bg-card);
  border: 1px solid var(--border-light); border-radius: var(--radius-md, 8px);
}

.member-avatar {
  width: 36px; height: 36px; border-radius: 50%; overflow: hidden;
  background: var(--bg-secondary); flex-shrink: 0; display: flex; align-items: center; justify-content: center;
}
.member-img { width: 100%; height: 100%; object-fit: cover; }
.member-initial { font-size: 0.875rem; font-weight: 700; color: var(--text-secondary); }

.member-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.member-name { font-size: 0.9375rem; font-weight: 600; color: var(--text-primary); }
.member-username { font-size: 0.8125rem; color: var(--text-tertiary); }

.member-role {
  padding: 0.2rem 0.625rem; border-radius: 999px;
  font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
  background: var(--bg-secondary); color: var(--text-secondary);
}
.member-role.owner { background: color-mix(in srgb, var(--s-accent) 15%, transparent); color: var(--s-accent); }
.member-role.editor { background: #d1fae5; color: #065f46; }
.member-role.contributor { background: #eff6ff; color: #1e40af; }

.member-actions { display: flex; align-items: center; gap: 0.5rem; }

.role-select {
  padding: 0.25rem 0.5rem; border: 1px solid var(--border-light);
  border-radius: 6px; font-size: 0.8125rem; color: var(--text-primary);
  background: var(--bg-card); font-family: inherit; outline: none;
}

.btn-remove-member {
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  border-radius: 50%; background: none; border: none; cursor: pointer;
  color: var(--text-tertiary); transition: color 0.15s, background 0.15s;
}
.btn-remove-member:hover { color: #ef4444; background: #fef2f2; }

.empty-members { padding: 1.5rem; text-align: center; color: var(--text-tertiary); font-size: 0.9375rem; }

/* ─── Posts ─── */
.pending-section {
  background: #fffbeb; border: 1px solid #fde68a;
  border-radius: var(--radius-md, 8px); padding: 1.25rem; margin-bottom: 1.5rem;
}

.pending-title { color: #92400e; }

.pending-list { display: flex; flex-direction: column; gap: 0.5rem; }

.pending-item {
  display: flex; align-items: center; gap: 1rem;
  padding: 0.75rem 1rem; background: #fff;
  border: 1px solid #fde68a; border-radius: var(--radius-sm, 6px);
}

.pending-info { flex: 1; min-width: 0; }
.pending-post-title { display: block; font-size: 0.9375rem; font-weight: 600; color: var(--text-primary); }
.pending-author { font-size: 0.8125rem; color: var(--text-tertiary); }

.pending-actions { display: flex; gap: 0.5rem; }

.btn-approve {
  display: inline-flex; align-items: center; gap: 0.25rem;
  padding: 0.375rem 0.75rem; background: #16a34a; color: #fff;
  border: none; border-radius: 6px; font-size: 0.8125rem; font-weight: 600;
  cursor: pointer; font-family: inherit;
}

.btn-reject {
  display: inline-flex; align-items: center; gap: 0.25rem;
  padding: 0.375rem 0.75rem; background: #ef4444; color: #fff;
  border: none; border-radius: 6px; font-size: 0.8125rem; font-weight: 600;
  cursor: pointer; font-family: inherit;
}

.posts-list { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }

.post-manage-item {
  display: flex; align-items: center; gap: 0.875rem;
  padding: 0.875rem 1rem; background: var(--bg-card);
  border: 1px solid var(--border-light); border-radius: var(--radius-md, 8px);
  cursor: grab; transition: box-shadow 0.15s;
}

.post-manage-item:active { cursor: grabbing; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }

.drag-handle { color: var(--text-tertiary); font-size: 1rem; }

.post-manage-title { flex: 1; font-size: 0.9375rem; font-weight: 600; color: var(--text-primary); }

.post-manage-author { font-size: 0.8125rem; color: var(--text-tertiary); }

.btn-remove-post {
  color: var(--text-tertiary); background: none; border: none;
  cursor: pointer; font-size: 1.125rem; transition: color 0.15s;
}
.btn-remove-post:hover { color: #ef4444; }

.empty-posts { padding: 2rem; text-align: center; color: var(--text-tertiary); }

.reorder-save { margin-top: 1rem; }

/* ─── Danger Zone ─── */
.danger-title { color: #dc2626; }

.danger-card {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 1.5rem;
  padding: 1.25rem; background: #fef2f2; border: 1px solid #fecaca;
  border-radius: var(--radius-md, 8px);
}

.btn-danger {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.625rem 1.25rem; background: #dc2626; color: #fff;
  border: none; border-radius: var(--radius-md, 8px); font-size: 0.9375rem;
  font-weight: 600; font-family: inherit; cursor: pointer; white-space: nowrap;
}
.btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }

/* ─── Modal ─── */
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal {
  background: var(--bg-card); border-radius: var(--radius-lg, 12px);
  padding: 2rem; max-width: 440px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.modal-title { font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin: 0 0 0.75rem; }
.modal p { color: var(--text-secondary); font-size: 0.9375rem; margin: 0 0 1.5rem; }
.modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }

/* ─── Loading / Error ─── */
.page-loading { text-align: center; padding: 4rem; font-size: 2rem; color: var(--text-tertiary); }
.page-error { text-align: center; padding: 4rem; }
.page-error p { color: var(--text-secondary); margin-bottom: 1rem; }
.btn-back { padding: 0.625rem 1.5rem; background: var(--accent-primary); color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600; }

@media (max-width: 640px) {
  .settings { padding: 1rem; }
  .branding-grid { grid-template-columns: 1fr; }
  .layout-options { grid-template-columns: 1fr; }
  .danger-card { flex-direction: column; }
  .invite-row, .invite-link-row { flex-direction: column; }
}
</style>
