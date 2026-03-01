<template>
  <Teleport to="body" :disabled="!fullscreen && !fullscreenExiting">
    <div
      class="rich-text-editor"
      :class="{
        'rich-text-editor--fullscreen': fullscreen || fullscreenExiting,
        'rich-text-editor--fullscreen-entering': fullscreen && !fullscreenExiting,
        'rich-text-editor--fullscreen-exiting': fullscreenExiting,
      }"
    >
    <div class="editor-toolbar" role="toolbar">
      <template v-if="editor">
      <!-- Text formatting -->
      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('bold') }" @click="editor.chain().focus().toggleBold().run()" title="Bold" aria-label="Bold">
        <svg class="toolbar-svg-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M2 1H8.625C11.0412 1 13 2.95875 13 5.375C13 6.08661 12.8301 6.75853 12.5287 7.35243C13.4313 8.15386 14 9.32301 14 10.625C14 13.0412 12.0412 15 9.625 15H2V1ZM5.5 9.75V11.5H9.625C10.1082 11.5 10.5 11.1082 10.5 10.625C10.5 10.1418 10.1082 9.75 9.625 9.75H5.5ZM5.5 6.25H8.625C9.10825 6.25 9.5 5.85825 9.5 5.375C9.5 4.89175 9.10825 4.5 8.625 4.5H5.5V6.25Z"/></svg>
      </button>
      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('italic') }" @click="editor.chain().focus().toggleItalic().run()" title="Italic" aria-label="Italic">
        <svg class="toolbar-svg-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M14 1H5V4H7.75219L5.08553 12H2V15H11V12H8.24781L10.9145 4H14V1Z"/></svg>
      </button>
      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('underline') }" @click="editor.chain().focus().toggleUnderline().run()" title="Underline" aria-label="Underline">
        <svg class="toolbar-svg-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M3 1V7C3 9.76142 5.23858 12 8 12C10.7614 12 13 9.76142 13 7V1H10V7C10 8.10457 9.10457 9 8 9C6.89543 9 6 8.10457 6 7V1H3Z"/><path fill="currentColor" d="M14 16V14H2V16H14Z"/></svg>
      </button>
      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('strike') }" @click="editor.chain().focus().toggleStrike().run()" title="Strikethrough" aria-label="Strikethrough">
        <svg class="toolbar-svg-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M5 4.75C5 4.45531 5.16258 4.05336 5.69626 3.66792C6.22795 3.28392 7.03762 3 8 3C9.75028 3 10.7599 3.87319 10.9539 4.4663L13.8053 3.5337C13.0616 1.26011 10.5055 0 8 0C6.4771 0 5.03677 0.443615 3.93978 1.23588C2.84478 2.02672 2 3.24977 2 4.75C2 5.59786 2.26982 6.35719 2.70214 7H0V9H16V7H10.7035C9.87766 6.67447 8.95507 6.5 8 6.5C7.03762 6.5 6.22795 6.21608 5.69626 5.83208C5.16258 5.44664 5 5.04469 5 4.75Z"/><path fill="currentColor" d="M11 11.25C11 11.1732 10.989 11.0892 10.9632 11H13.9921C13.9973 11.0824 14 11.1658 14 11.25C14 12.7502 13.1552 13.9733 12.0602 14.7641C10.9632 15.5564 9.5229 16 8 16C5.49455 16 2.93836 14.7399 2.19473 12.4663L5.0461 11.5337C5.24008 12.1268 6.24972 13 8 13C8.96238 13 9.77205 12.7161 10.3037 12.3321C10.8374 11.9466 11 11.5447 11 11.25Z"/></svg>
      </button>
      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('highlight') }" @click="editor.chain().focus().toggleHighlight().run()" title="Highlight" aria-label="Highlight">
        <svg class="toolbar-svg-icon" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18" aria-hidden="true"><path fill="currentColor" transform="translate(64, 44.957)" d="M405.333333,381.709781 L362.666667,424.376448 L85.3333333,424.376448 L128,381.709781 L405.333333,381.709781 Z M282.327442,7.10542736e-15 L403.006999,120.679557 L384.970948,143.928809 L352.415716,185.42913 L333.317316,209.393653 L316.302987,230.396289 L304.909911,244.204529 L291.542704,260.023864 L282.884971,269.944627 L275.399527,278.199329 L269.086373,284.787971 L254.094195,299.615469 L223.246131,330.913053 L206.971557,347.655494 L201.097332,347.365048 L194.94444,347.269241 C184.457401,347.271762 172.809254,348.085275 160,349.709781 L151.970104,350.837434 L144.123951,352.129117 L136.61735,353.518237 L126.334944,355.638938 L106.666667,360.376448 L42.6666667,392.376448 L1.42108547e-14,403.043115 L10.6666667,360.376448 L42.6666667,296.376448 L43.6781629,293.970042 L45.4668727,289.038094 L46.9677202,284.280153 L48.6019332,278.358143 C50.270448,271.857501 51.9932963,263.626067 53.3333333,253.709781 C55.8645145,234.979019 56.7941068,216.011107 56.1221103,196.806047 L59.4284876,193.08414 L62.8024546,189.492637 L78.5389897,173.389008 L116.39305,135.764502 L128.060065,124.568671 L141.033549,112.687653 L152.352994,102.689504 L164.50858,92.2528346 L177.500305,81.3776459 L191.328171,70.0639374 L205.992177,58.3117091 L229.55595,39.8611422 L246.310307,27.0126145 L263.900804,13.7255671 L282.327442,7.10542736e-15 Z M98.2491614,232.79585 C97.9559598,237.447641 97.5768923,242.08805 97.1119193,246.716812 L95.6156779,259.423605 C94.6195581,266.7949 93.4216694,273.638856 92.0665399,279.972262 L87.7883357,298.089846 L106.435281,315.212199 L124.845508,312.355266 C135.006153,310.301434 145.001214,308.603546 154.631889,307.382156 C160.282804,306.665491 165.770852,306.085382 171.099187,305.644179 L98.2491614,232.79585 Z M278.293333,56.312448 L272.274533,60.8697171 L247.868843,79.6578618 L232.674928,91.6054817 L218.346317,103.086115 L204.887227,114.094629 L192.302682,124.624617 L180.598706,134.668 L169.782552,144.214456 L156.548615,156.344005 L146.471044,166.026008 L119.059,193.266 L209.655,283.862 L215.23475,278.178375 L234.212668,259.239604 L238.2793,255.269016 L243.792887,249.538123 L250.73823,241.890545 L258.952887,232.48574 L271.99948,217.050376 L283.149955,203.53887 L299.950576,182.802205 L318.845645,159.094841 L346.197333,124.216448 L278.293333,56.312448 Z"/></svg>
      </button>
      <span class="toolbar-divider"></span>
      <!-- Font family -->
      <div class="toolbar-dropdown-wrap" ref="fontDropdownRef">
        <button type="button" class="toolbar-dropdown-trigger toolbar-dropdown-trigger--font" title="Font" :aria-expanded="fontDropdownOpen" @click="fontDropdownOpen = !fontDropdownOpen">
          <span class="toolbar-dropdown-label">{{ currentFontFamily || 'Font' }}</span>
          <i class="pi pi-chevron-down toolbar-dropdown-chevron" aria-hidden="true"></i>
        </button>
        <Transition name="toolbar-dropdown">
          <div v-if="fontDropdownOpen" class="toolbar-dropdown-panel toolbar-dropdown-panel--font" role="menu">
            <button type="button" class="toolbar-dropdown-option" role="menuitem" :class="{ active: !currentFontFamily }" @click="selectFontFamily(''); fontDropdownOpen = false">Font</button>
            <button v-for="f in CONTENT_FONT_FAMILY_OPTIONS" :key="f" type="button" class="toolbar-dropdown-option" role="menuitem" :class="{ active: currentFontFamily === f }" :style="fontOptionStyle(f)" @click="selectFontFamily(f); fontDropdownOpen = false">{{ f }}</button>
          </div>
        </Transition>
      </div>
      <!-- Font size -->
      <div class="toolbar-dropdown-wrap" ref="sizeDropdownRef">
        <button type="button" class="toolbar-dropdown-trigger" title="Font size" :aria-expanded="sizeDropdownOpen" @click="sizeDropdownOpen = !sizeDropdownOpen">
          <span class="toolbar-dropdown-label">{{ currentFontSize || 'Size' }}</span>
          <i class="pi pi-chevron-down toolbar-dropdown-chevron" aria-hidden="true"></i>
        </button>
        <Transition name="toolbar-dropdown">
          <div v-if="sizeDropdownOpen" class="toolbar-dropdown-panel" role="menu">
            <button type="button" class="toolbar-dropdown-option" role="menuitem" :class="{ active: !currentFontSize }" @click="selectFontSize(''); sizeDropdownOpen = false">Size</button>
            <button v-for="s in fontSizes" :key="s" type="button" class="toolbar-dropdown-option" role="menuitem" :class="{ active: currentFontSize === s }" @click="selectFontSize(s); sizeDropdownOpen = false">{{ s }}</button>
          </div>
        </Transition>
      </div>
      <!-- Paragraph style -->
      <div class="toolbar-dropdown-wrap" ref="headingDropdownRef">
        <button type="button" class="toolbar-dropdown-trigger" title="Paragraph style" :aria-expanded="headingDropdownOpen" @click="headingDropdownOpen = !headingDropdownOpen">
          <span class="toolbar-dropdown-label">{{ headingLabel }}</span>
          <i class="pi pi-chevron-down toolbar-dropdown-chevron" aria-hidden="true"></i>
        </button>
        <Transition name="toolbar-dropdown">
          <div v-if="headingDropdownOpen" class="toolbar-dropdown-panel" role="menu">
            <button v-for="opt in headingOptions" :key="opt.value" type="button" class="toolbar-dropdown-option" role="menuitem" :class="{ active: currentHeading === opt.value }" @click="selectHeading(opt.value); headingDropdownOpen = false">{{ opt.label }}</button>
          </div>
        </Transition>
      </div>
      <span class="toolbar-divider"></span>
      <!-- Alignment -->
      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive({ textAlign: 'left' }) }" @click="editor.chain().focus().setTextAlign('left').run()" title="Align left" aria-label="Align left">
        <svg class="toolbar-svg-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18" aria-hidden="true"><path d="M3 10H16M3 14H21M3 18H16M3 6H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive({ textAlign: 'center' }) }" @click="editor.chain().focus().setTextAlign('center').run()" title="Align center" aria-label="Align center">
        <svg class="toolbar-svg-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18" aria-hidden="true"><path d="M3 8H21M3 12H21M3 16H21M17 20H7M3 4H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive({ textAlign: 'right' }) }" @click="editor.chain().focus().setTextAlign('right').run()" title="Align right" aria-label="Align right">
        <svg class="toolbar-svg-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18" aria-hidden="true"><path d="M8 10H21M3 14H21M8 18H21M3 6H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive({ textAlign: 'justify' }) }" @click="editor.chain().focus().setTextAlign('justify').run()" title="Justify" aria-label="Justify">
        <svg class="toolbar-svg-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18" aria-hidden="true"><path d="M3 6H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 14H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10L18 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 18L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <span class="toolbar-divider"></span>
      <!-- Lists -->
      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('bulletList') }" @click="editor.chain().focus().toggleBulletList().run()" title="Bullet list" aria-label="Bullet list">
        <svg class="toolbar-svg-icon" viewBox="0 -4 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M597,226 L579,226 C578.447,226 578,226.448 578,227 C578,227.553 578.447,228 579,228 L597,228 C597.553,228 598,227.553 598,227 C598,226.448 597.553,226 597,226 L597,226 Z M572,209 C570.896,209 570,209.896 570,211 C570,212.104 570.896,213 572,213 C573.104,213 574,212.104 574,211 C574,209.896 573.104,209 572,209 L572,209 Z M579,212 L597,212 C597.553,212 598,211.553 598,211 C598,210.447 597.553,210 597,210 L579,210 C578.447,210 578,210.447 578,211 C578,211.553 578.447,212 579,212 L579,212 Z M597,218 L579,218 C578.447,218 578,218.448 578,219 C578,219.553 578.447,220 579,220 L597,220 C597.553,220 598,219.553 598,219 C598,218.448 597.553,218 597,218 L597,218 Z M572,217 C570.896,217 570,217.896 570,219 C570,220.104 570.896,221 572,221 C573.104,221 574,220.104 574,219 C574,217.896 573.104,217 572,217 L572,217 Z M572,225 C570.896,225 570,225.896 570,227 C570,228.104 570.896,229 572,229 C573.104,229 574,228.104 574,227 C574,225.896 573.104,225 572,225 L572,225 Z" transform="translate(-570, -209)"/></svg>
      </button>
      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('orderedList') }" @click="editor.chain().focus().toggleOrderedList().run()" title="Numbered list" aria-label="Numbered list">
        <svg class="toolbar-svg-icon" viewBox="0 0 1920 1920" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M169.412 1355.294c93.402 0 169.412 76.01 169.412 169.412 0 43.595-16.942 82.899-44.048 112.941 27.106 30.042 44.048 69.346 44.048 112.941 0 93.403-76.01 169.412-169.412 169.412H0v-112.941h169.412c31.059 0 56.47-25.412 56.47-56.47 0-31.06-25.411-56.471-56.47-56.471H0v-112.942h169.412c31.059 0 56.47-25.411 56.47-56.47 0-31.059-25.411-56.47-56.47-56.47H0v-112.942Zm1750.588 0v225.882H564.706v-225.882H1920ZM188.058 677.67c61.78 0 118.814 38.4 145.356 97.694 28.8 64.037 15.36 136.546-35.916 194.033-16.286 18.262-34.108 37.88-52.187 57.582l-3.101 3.377c-2.07 2.252-4.14 4.505-6.213 6.755l-3.108 3.374-3.107 3.37c-28.478 30.87-56.688 61.043-79.672 85.58h188.725v112.94H56.482c-31.285 0-56.47-25.298-56.47-56.47v-39.53c0-14.456 5.533-28.46 15.585-38.964.113-.113 117.459-123.558 197.647-213.233 21.346-23.944 27.445-49.807 17.167-72.621-8.131-18.297-25.637-30.946-42.353-30.946-40.546 0-82.898 48.452-94.418 65.506L.01 792.983C7.804 781.237 80.425 677.67 188.058 677.67ZM1920 790.588v225.883H564.706V790.588H1920ZM169.412 0c31.172 0 56.47 25.299 56.47 56.47v508.236h-112.94V112.94H0V0ZM1920 225.882v225.883H564.706V225.882H1920Z"/></svg>
      </button>
      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('blockquote') }" @click="editor.chain().focus().toggleBlockquote().run()" title="Quote" aria-label="Quote">
        <svg class="toolbar-svg-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M5.29289 1.29291L6.70711 2.70712L3 6.41423V7.00001H7V14H1V5.5858L5.29289 1.29291Z"/><path fill="currentColor" d="M15 7.00001H11V6.41423L14.7071 2.70712L13.2929 1.29291L9 5.5858V14H15V7.00001Z"/></svg>
      </button>
      <span class="toolbar-divider"></span>
      <!-- Link -->
      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('link') }" @click="toggleLink" title="Link" aria-label="Link">
        <i class="pi pi-link" aria-hidden="true"></i>
      </button>
      <!-- Image -->
      <button
        type="button"
        class="toolbar-btn"
        :disabled="!canAddImage"
        :title="canAddImage ? 'Insert Media' : 'Maximum 5 images per post'"
        :aria-label="canAddImage ? 'Insert Media' : 'Maximum 5 images per post'"
        @click="triggerImageUpload"
      >
        <i class="pi pi-images" aria-hidden="true"></i>
      </button>
      <template v-if="imageSelectedByDoubleClick && editor.isActive('image')">
        <span class="toolbar-divider"></span>
        <div class="toolbar-dropdown-wrap" ref="imageSizeDropdownRef">
          <button type="button" class="toolbar-dropdown-trigger" title="Image size" :aria-expanded="imageSizeDropdownOpen" @click="imageSizeDropdownOpen = !imageSizeDropdownOpen">
            <span class="toolbar-dropdown-label">{{ imageSizeLabel }}</span>
            <i class="pi pi-chevron-down toolbar-dropdown-chevron" aria-hidden="true"></i>
          </button>
          <Transition name="toolbar-dropdown">
            <div v-if="imageSizeDropdownOpen" class="toolbar-dropdown-panel" role="menu">
              <button v-for="opt in imageSizeOptions" :key="opt.value" type="button" class="toolbar-dropdown-option" role="menuitem" :class="{ active: currentImageWidth === opt.value }" @click="selectImageSize(opt.value); imageSizeDropdownOpen = false">{{ opt.label }}</button>
            </div>
          </Transition>
        </div>
        <button type="button" class="toolbar-btn toolbar-btn--crop" title="Crop image" aria-label="Crop image" @click="openCropModal">
          <svg class="crop-icon" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none" width="18" height="18" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M5.5 2a1 1 0 00-2 0v2H2a1 1 0 000 2h12v7h2V5a1 1 0 00-1-1H5.5V2zm-2 5v8a1 1 0 001 1H14v2a1 1 0 102 0v-2h2a1 1 0 100-2H5.5V7h-2z"/></svg>
        </button>
      </template>
      <input ref="imageInputRef" type="file" accept="image/*" class="hidden" @change="onImageSelect" />
      </template>
      <span v-else class="toolbar-loading">Loading editor…</span>
    </div>
    <ImageCropModal
      :open="cropModalOpen"
      :image-src="cropImageSrc"
      @close="cropModalOpen = false"
      @crop-apply="onCropApply"
    />
    <div class="editor-content">
      <editor-content :editor="editor" />
    </div>
    <Teleport to="body">
      <div
        v-show="floatingToolbarShow"
        class="floating-toolbar"
        :style="{ ...floatingToolbarStyle, transform: 'translate(-50%, 0)' }"
        role="toolbar"
        aria-label="Format selection"
      >
        <button type="button" class="floating-toolbar-btn" :class="{ active: editor?.isActive('bold') }" title="Bold" aria-label="Bold" @click="editor?.chain().focus().toggleBold().run()">
          <svg class="floating-toolbar-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M2 1H8.625C11.0412 1 13 2.95875 13 5.375C13 6.08661 12.8301 6.75853 12.5287 7.35243C13.4313 8.15386 14 9.32301 14 10.625C14 13.0412 12.0412 15 9.625 15H2V1ZM5.5 9.75V11.5H9.625C10.1082 11.5 10.5 11.1082 10.5 10.625C10.5 10.1418 10.1082 9.75 9.625 9.75H5.5ZM5.5 6.25H8.625C9.10825 6.25 9.5 5.85825 9.5 5.375C9.5 4.89175 9.10825 4.5 8.625 4.5H5.5V6.25Z"/></svg>
        </button>
        <button type="button" class="floating-toolbar-btn" :class="{ active: editor?.isActive('italic') }" title="Italic" aria-label="Italic" @click="editor?.chain().focus().toggleItalic().run()">
          <svg class="floating-toolbar-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M14 1H5V4H7.75219L5.08553 12H2V15H11V12H8.24781L10.9145 4H14V1Z"/></svg>
        </button>
        <button type="button" class="floating-toolbar-btn" :class="{ active: editor?.isActive('link') }" title="Link" aria-label="Link" @click="toggleLink">
          <i class="pi pi-link" aria-hidden="true"></i>
        </button>
        <span class="floating-toolbar-divider" aria-hidden="true"></span>
        <button type="button" class="floating-toolbar-btn" :class="{ active: editor?.isActive('heading', { level: 1 }) }" title="Title" aria-label="Title" @click="editor?.chain().focus().setHeading({ level: 1 }).run()">
          H1
        </button>
        <button type="button" class="floating-toolbar-btn" :class="{ active: editor?.isActive('heading', { level: 2 }) }" title="Subtitle" aria-label="Subtitle" @click="editor?.chain().focus().setHeading({ level: 2 }).run()">
          H2
        </button>
        <button type="button" class="floating-toolbar-btn" :class="{ active: editor?.isActive('blockquote') }" title="Quote" aria-label="Quote" @click="editor?.chain().focus().toggleBlockquote().run()">
          <svg class="floating-toolbar-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M5.29289 1.29291L6.70711 2.70712L3 6.41423V7.00001H7V14H1V5.5858L5.29289 1.29291Z"/><path fill="currentColor" d="M15 7.00001H11V6.41423L14.7071 2.70712L13.2929 1.29291L9 5.5858V14H15V7.00001Z"/></svg>
        </button>
      </div>
    </Teleport>
    <button
      type="button"
      class="editor-fullscreen-btn"
      :title="fullscreen ? 'Exit full screen' : 'Full screen'"
      :aria-label="fullscreen ? 'Exit full screen' : 'Full screen'"
      @click="toggleFullscreen"
    >
      <i :class="fullscreen ? 'pi pi-window-minimize' : 'pi pi-window-maximize'" aria-hidden="true"></i>
      <span class="editor-fullscreen-btn-label">{{ fullscreen ? 'Exit full screen' : 'Full screen' }}</span>
    </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, provide } from 'vue'
import { useEditor, EditorContent, VueNodeViewRenderer } from '@tiptap/vue-3'
import { Extension } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import ResizableImageNodeView from './ResizableImageNodeView.vue'
import ImageCropModal from './ImageCropModal.vue'

const ImageWithSize = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-width') || (el as HTMLElement).style?.maxWidth || null,
        renderHTML: (attrs: Record<string, unknown>) => {
          if (!attrs.width) return {}
          const v = typeof attrs.width === 'number' ? `${attrs.width}px` : String(attrs.width)
          return { 'data-width': attrs.width, style: `max-width: ${v}; width: ${v}; height: auto; display: block;` }
        },
      },
    }
  },
  addNodeView() {
    return VueNodeViewRenderer(ResizableImageNodeView as any)
  },
})
import TextStyle from '@tiptap/extension-text-style'

import { CONTENT_FONT_FAMILY_OPTIONS } from '../utils/allowed-content-fonts'
import { ensureFontLoaded } from '../utils/load-fonts'

const props = withDefaults(
  defineProps<{
    modelValue: string
    canAddImage?: boolean
  }>(),
  { canAddImage: true }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'image-upload': [file: File]
  'image-crop-apply': [file: File]
}>()

const imageInputRef = ref<HTMLInputElement | null>(null)

const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px']
const headingOptions = [
  { value: 'paragraph', label: 'Paragraph' },
  { value: '1', label: 'Heading 1' },
  { value: '2', label: 'Heading 2' },
  { value: '3', label: 'Heading 3' },
] as const
const imageSizeOptions = [
  { value: '100%', label: 'Full width' },
  { value: '75%', label: 'Large' },
  { value: '50%', label: 'Medium' },
  { value: '33%', label: 'Small' },
] as const

const FontSizeExtension = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el) => (el as HTMLElement).style.fontSize?.replace(/['"]+/g, '') || null,
            renderHTML: (attrs: { fontSize?: string | null }) => {
              if (!attrs.fontSize) return {}
              return { style: `font-size: ${attrs.fontSize}` }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ chain }: { chain: () => any }) =>
          chain().setMark('textStyle', { fontSize }).run(),
      unsetFontSize:
        () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ chain }: { chain: () => any }) =>
          chain().setMark('textStyle', { fontSize: null }).run(),
    } as Record<string, unknown>
  },
})

const FontFamilyExtension = Extension.create({
  name: 'fontFamily',
  addOptions() {
    return { types: ['textStyle'] }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: (el) => {
              const v = (el as HTMLElement).style.fontFamily
              if (!v) return null
              return v.replace(/^["']|["']$/g, '')
            },
            renderHTML: (attrs: { fontFamily?: string | null }) => {
              if (!attrs.fontFamily) return {}
              const q = attrs.fontFamily.includes(' ') ? `"${attrs.fontFamily}"` : attrs.fontFamily
              return { style: `font-family: ${q}` }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontFamily:
        (fontFamily: string) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ chain }: { chain: () => any }) =>
          chain().setMark('textStyle', { fontFamily }).run(),
      unsetFontFamily:
        () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ chain }: { chain: () => any }) =>
          chain().setMark('textStyle', { fontFamily: null }).run(),
    } as Record<string, unknown>
  },
})

const editor = useEditor({
  content: props.modelValue || '',
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    Underline,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
    }),
    ImageWithSize.configure({
      inline: false,
      allowBase64: true,
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { target: '_blank', rel: 'noopener' },
    }),
    TextStyle,
    FontSizeExtension,
    FontFamilyExtension,
  ],
  editorProps: {
    attributes: {
      class: 'prose-editor',
      'data-placeholder': 'Write your story…',
    },
  },
  onUpdate: ({ editor: e }) => {
    emit('update:modelValue', e.getHTML())
  },
})

const currentFontSize = ref('')
const currentFontFamily = ref('')
const currentHeading = ref('')
const currentImageWidth = ref('')
const cropModalOpen = ref(false)
const cropImageSrc = ref('')
const imageSelectedByDoubleClick = ref(false)
provide('onImageDoubleClick', () => {
  imageSelectedByDoubleClick.value = true
})

const floatingToolbarShow = ref(false)
const floatingToolbarStyle = ref<{ top: string; left: string }>({ top: '0', left: '0' })
const FLOATING_TOOLBAR_GAP = 8
const FLOATING_TOOLBAR_HEIGHT = 40
const FLOATING_TOOLBAR_EST_WIDTH = 260
const VIEWPORT_PADDING = 12

function updateFloatingToolbar() {
  const e = editor.value
  if (!e?.view) {
    floatingToolbarShow.value = false
    return
  }
  const { state, view } = e
  const { selection } = state
  if (selection.empty || (selection as { node?: unknown }).node) {
    floatingToolbarShow.value = false
    return
  }
  const { from, to } = selection
  const start = view.coordsAtPos(from)
  const end = view.coordsAtPos(to)
  const top = Math.min(start.top, end.top)
  const left = Math.min(start.left, end.left)
  const right = Math.max(start.right, end.right)
  let centerX = (left + right) / 2
  const halfW = FLOATING_TOOLBAR_EST_WIDTH / 2
  const minLeft = VIEWPORT_PADDING + halfW
  const maxLeft = typeof window !== 'undefined' ? window.innerWidth - VIEWPORT_PADDING - halfW : 9999
  centerX = Math.max(minLeft, Math.min(maxLeft, centerX))
  const toolbarTop = top - FLOATING_TOOLBAR_HEIGHT - FLOATING_TOOLBAR_GAP
  const clampedTop = typeof window !== 'undefined' ? Math.max(VIEWPORT_PADDING, toolbarTop) : toolbarTop
  floatingToolbarStyle.value = {
    top: `${clampedTop}px`,
    left: `${centerX}px`,
  }
  floatingToolbarShow.value = true
}

const fontDropdownOpen = ref(false)
const sizeDropdownOpen = ref(false)
const headingDropdownOpen = ref(false)
const imageSizeDropdownOpen = ref(false)
const fontDropdownRef = ref<HTMLElement | null>(null)
const sizeDropdownRef = ref<HTMLElement | null>(null)
const headingDropdownRef = ref<HTMLElement | null>(null)
const imageSizeDropdownRef = ref<HTMLElement | null>(null)

const headingLabel = computed(() => {
  const o = headingOptions.find((x) => x.value === currentHeading.value)
  return o ? o.label : 'Style'
})
const imageSizeLabel = computed(() => {
  const o = imageSizeOptions.find((x) => x.value === currentImageWidth.value)
  return o ? o.label : 'Size'
})

watch(
  () => editor.value,
  (e) => {
    if (!e) return
    const updateAttrs = () => {
      const textStyle = e.getAttributes('textStyle') as { fontSize?: string; fontFamily?: string }
      currentFontSize.value = textStyle?.fontSize || ''
      currentFontFamily.value = textStyle?.fontFamily || ''
      const heading = e.getAttributes('heading') as { level?: number }
      currentHeading.value = heading?.level ? String(heading.level) : 'paragraph'
      currentImageWidth.value = e.isActive('image') ? (e.getAttributes('image').width as string) || '' : ''
      if (!e.isActive('image')) imageSelectedByDoubleClick.value = false
      requestAnimationFrame(() => updateFloatingToolbar())
    }
    e.on('selectionUpdate', updateAttrs)
    e.on('transaction', updateAttrs)
    updateAttrs()
  },
  { immediate: true }
)

function fontOptionStyle(fontName: string): { fontFamily: string } {
  const q = fontName.includes(' ') ? `"${fontName}"` : fontName
  return { fontFamily: q }
}

function selectFontFamily(value: string) {
  if (!value.trim()) {
    ;(editor.value?.chain().focus() as unknown as { unsetFontFamily: () => { run: () => void } })?.unsetFontFamily().run()
    return
  }
  ensureFontLoaded(value.trim())
  ;(editor.value?.chain().focus() as unknown as { setFontFamily: (f: string) => { run: () => void } })?.setFontFamily(value.trim()).run()
}

function selectFontSize(value: string) {
  setFontSize(value)
}

function selectHeading(value: string) {
  setHeading(value)
}

function selectImageSize(value: string) {
  if (!value) return
  editor.value?.chain().focus().updateAttributes('image', { width: value }).run()
}

function closeToolbarDropdowns(e: MouseEvent) {
  const target = e.target as Node
  if (fontDropdownRef.value?.contains(target)) return
  if (sizeDropdownRef.value?.contains(target)) return
  if (headingDropdownRef.value?.contains(target)) return
  if (imageSizeDropdownRef.value?.contains(target)) return
  fontDropdownOpen.value = false
  sizeDropdownOpen.value = false
  headingDropdownOpen.value = false
  imageSizeDropdownOpen.value = false
}

function setFontSize(value: string) {
  const c = editor.value?.chain().focus() as unknown as { unsetFontSize: () => { run: () => void }; setFontSize: (v: string) => { run: () => void }; run: () => void }
  if (!value) c?.unsetFontSize().run()
  else c?.setFontSize(value).run()
}

function setHeading(value: string) {
  if (value === 'paragraph') editor.value?.chain().focus().setParagraph().run()
  else if (value === '1' || value === '2' || value === '3') editor.value?.chain().focus().setHeading({ level: Number(value) as 1 | 2 | 3 }).run()
}

function toggleLink() {
  if (editor.value?.isActive('link')) {
    editor.value.chain().focus().unsetLink().run()
    return
  }
  const url = window.prompt('Enter URL:')
  if (url) editor.value?.chain().focus().setLink({ href: url }).run()
}

function triggerImageUpload() {
  if (!props.canAddImage) return
  imageInputRef.value?.click()
}

async function onImageSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  emit('image-upload', file)
}


function openCropModal() {
  if (!editor.value?.isActive('image')) return
  const attrs = editor.value.getAttributes('image')
  if (attrs.src) {
    cropImageSrc.value = attrs.src
    cropModalOpen.value = true
  }
}

function onCropApply(blob: Blob) {
  cropModalOpen.value = false
  const file = new File([blob], 'cropped.png', { type: blob.type || 'image/png' })
  emit('image-crop-apply', file)
}

defineExpose({
  addImage: (url: string) => {
    editor.value?.chain().focus().setImage({ src: url }).run()
  },
  replaceSelectedImage: (url: string) => {
    editor.value?.chain().focus().updateAttributes('image', { src: url }).run()
  },
})

watch(
  () => props.modelValue,
  (val) => {
    if (editor.value && val !== undefined && val !== editor.value.getHTML()) {
      editor.value.commands.setContent(val, false)
    }
  }
)

const fullscreen = ref(false)
const fullscreenExiting = ref(false)
const FULLSCREEN_EXIT_MS = 280

function lockBodyScroll(lock: boolean) {
  const val = lock ? 'hidden' : ''
  document.documentElement.style.overflow = val
  document.body.style.overflow = val
}
function toggleFullscreen() {
  if (fullscreen.value) {
    fullscreenExiting.value = true
    lockBodyScroll(false)
    setTimeout(() => {
      fullscreen.value = false
      fullscreenExiting.value = false
    }, FULLSCREEN_EXIT_MS)
  } else {
    fullscreen.value = true
    lockBodyScroll(true)
  }
}
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && fullscreen.value && !fullscreenExiting.value) {
    fullscreenExiting.value = true
    lockBodyScroll(false)
    setTimeout(() => {
      fullscreen.value = false
      fullscreenExiting.value = false
    }, FULLSCREEN_EXIT_MS)
  }
}
onMounted(() => {
  if (props.modelValue && editor.value) {
    editor.value.commands.setContent(props.modelValue, false)
  }
  document.addEventListener('click', closeToolbarDropdowns)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', closeToolbarDropdowns)
  document.removeEventListener('keydown', onKeydown)
  if (fullscreen.value || fullscreenExiting.value) lockBodyScroll(false)
  fullscreen.value = false
  fullscreenExiting.value = false
  editor.value?.destroy()
})
</script>

<style scoped>
.rich-text-editor {
  position: relative;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  min-height: 360px;
  box-shadow: var(--shadow-sm);
  padding-bottom: 2.5rem;
}
@keyframes editorFullscreenIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes editorFullscreenOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
.rich-text-editor--fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  max-width: 100vw;
  max-height: 100vh;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  overflow: hidden;
  overscroll-behavior: contain;
  border-radius: 0;
  border: none;
  min-height: 0;
  padding: 0;
  box-sizing: border-box;
}
.rich-text-editor--fullscreen-entering {
  animation: editorFullscreenIn 0.3s ease-out;
}
.rich-text-editor--fullscreen-exiting {
  animation: editorFullscreenOut 0.28s ease-in forwards;
}
.rich-text-editor--fullscreen .editor-toolbar {
  flex-shrink: 0;
  width: 100%;
  margin: 0;
  align-self: stretch;
  border-radius: 0;
}
.rich-text-editor--fullscreen .editor-content {
  flex: 1;
  overflow: auto;
  min-height: 0;
  width: 100%;
  margin: 0;
  align-self: stretch;
  display: flex;
  flex-direction: column;
}
.rich-text-editor--fullscreen .editor-content :deep(.ProseMirror) {
  flex: 1;
  min-height: 200px;
}
.rich-text-editor--fullscreen .editor-fullscreen-btn {
  right: 2.5rem;
  bottom: 1rem;
}
@media (max-width: 768px) {
  .rich-text-editor--fullscreen .editor-fullscreen-btn {
    right: 1rem;
  }
}
.editor-fullscreen-btn {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.65rem;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 0.8125rem;
  font-family: inherit;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: background 0.15s ease, border-color 0.15s ease;
}
.editor-fullscreen-btn:hover {
  background: var(--border-light);
  border-color: var(--text-tertiary);
}
.editor-fullscreen-btn .pi {
  font-size: 1rem;
}
.editor-fullscreen-btn-label {
  white-space: nowrap;
}
@media (max-width: 480px) {
  .editor-fullscreen-btn-label { display: none; }
}
.floating-toolbar {
  position: fixed;
  z-index: 10000;
  display: inline-flex;
  align-items: center;
  gap: 0;
  padding: 0.25rem 0.35rem;
  background: var(--bg-card);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  pointer-events: auto;
}
.floating-toolbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 0.35rem;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-primary);
  font-size: 0.875rem;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.floating-toolbar-btn:hover {
  background: var(--border-light);
}
.floating-toolbar-btn.active {
  background: rgba(139, 69, 19, 0.12);
  color: var(--accent-primary);
}
.floating-toolbar-btn .pi {
  font-size: 1rem;
}
.floating-toolbar-icon {
  display: block;
  flex-shrink: 0;
}
.floating-toolbar-divider {
  width: 1px;
  height: 20px;
  margin: 0 0.2rem;
  background: var(--border-light);
}
.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-secondary);
  min-height: 48px;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}
.toolbar-loading {
  font-size: 0.875rem;
  color: var(--text-tertiary);
}
.toolbar-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--text-primary);
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.toolbar-btn:hover {
  background: var(--border-light);
}
.toolbar-btn.active {
  background: var(--border-medium);
  color: var(--accent-primary);
}
.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.toolbar-btn--crop .crop-icon {
  display: block;
  flex-shrink: 0;
}
.toolbar-svg-icon {
  display: block;
  flex-shrink: 0;
}
.toolbar-highlight-icon {
  background: linear-gradient(transparent 60%, var(--accent-tertiary) 60%);
  opacity: 0.9;
}
.toolbar-divider {
  width: 1px;
  height: 24px;
  background: var(--border-medium);
  margin: 0 2px;
  border-radius: 1px;
}
/* Custom dropdowns – match WriteView format dropdown */
.toolbar-dropdown-wrap {
  position: relative;
}
.toolbar-dropdown-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.6rem;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 0.8125rem;
  font-family: inherit;
  cursor: pointer;
  min-width: 4rem;
  width: 100%;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.toolbar-dropdown-trigger:hover {
  border-color: var(--border-medium);
}
.toolbar-dropdown-trigger:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px var(--border-medium);
}
.toolbar-dropdown-label {
  flex: 1;
  min-width: 0;
  max-width: 8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}
.toolbar-dropdown-trigger--font { min-width: 10rem; }
.toolbar-dropdown-trigger--font .toolbar-dropdown-label { max-width: none; }
.toolbar-dropdown-chevron {
  font-size: 0.7rem;
  color: var(--text-tertiary);
  flex-shrink: 0;
  margin-left: auto;
}
.toolbar-dropdown-panel {
  position: absolute;
  top: calc(100% + 0.25rem);
  left: 0;
  min-width: 100%;
  max-height: 280px;
  overflow-y: auto;
  padding: 0.25rem 0;
  background: var(--bg-card);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 100;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.toolbar-dropdown-panel::-webkit-scrollbar {
  display: none;
}
.toolbar-dropdown-panel--font { min-width: 12rem; }
.toolbar-dropdown-option {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.45rem 0.75rem;
  border: none;
  background: none;
  color: var(--text-primary);
  font-size: 0.8125rem;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s ease;
}
.toolbar-dropdown-option:hover {
  background: var(--bg-primary);
}
.toolbar-dropdown-option.active {
  background: var(--bg-primary);
  color: var(--accent-primary);
  font-weight: 600;
}
.toolbar-dropdown-enter-active,
.toolbar-dropdown-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.toolbar-dropdown-enter-from,
.toolbar-dropdown-leave-to { opacity: 0; transform: translateY(-4px); }
.hidden {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}
.editor-content {
  min-height: 320px;
  background: var(--bg-card);
}
.editor-content :deep(.ProseMirror) {
  min-height: 320px;
  padding: 0.75rem 1rem;
  outline: none;
  color: var(--text-primary);
  background: var(--bg-card);
}
.editor-content :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  color: var(--text-tertiary);
  float: left;
  height: 0;
  pointer-events: none;
}
.editor-content :deep(.ProseMirror img) {
  max-width: 100%;
  height: auto;
}
.editor-content :deep(.ProseMirror blockquote) {
  border-left: 4px solid var(--border-medium);
  padding-left: 1rem;
  margin-left: 0;
  color: var(--text-secondary);
}
</style>
