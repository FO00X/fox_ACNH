<template>
  <div class="side lg:w-48 shrink-0 space-y-3">
    <div class="box rounded-2xl border border-base-300 bg-base-200/50 space-y-3">
      <div class="icons-row flex flex-wrap items-center justify-center gap-3">
        <div class="check-container relative shrink-0">
          <div class="icon w-20 h-20 rounded-xl bg-base-100 flex items-center justify-center overflow-hidden">
            <img :src="bookIconUrl" :alt="alt" loading="lazy" class="w-full h-full object-contain" @error="onImgError" />
          </div>
          <button v-if="isCollected" type="button" class="absolute top-0 right-0 btn btn-circle btn-success btn-xs" aria-label="已收集">
            <Icon icon="mdi:check" class="w-4 h-4" />
          </button>
        </div>
        <div v-if="cageIconUrl" class="icon w-20 h-20 shrink-0 rounded-xl bg-base-100 flex items-center justify-center overflow-hidden">
          <img :src="cageIconUrl" :alt="alt" loading="lazy" class="w-full h-full object-contain" @error="onImgError" />
        </div>
      </div>
      <div v-if="$slots.variants" class="variants flex flex-wrap justify-center gap-2">
        <slot name="variants" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'

defineProps({
  bookIconUrl: { type: String, default: '' },
  cageIconUrl: { type: String, default: '' },
  isCollected: { type: Boolean, default: false },
  alt: { type: String, default: '' }
})

const fallbackSrc = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>'
function onImgError(e) {
  e.target.src = fallbackSrc
}
</script>
