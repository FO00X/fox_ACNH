<template>
  <div class="art tab flex-1 overflow-auto flex items-center justify-center min-h-[280px] p-4">
    <div class="art-img max-w-2xl w-full rounded-2xl overflow-hidden border border-base-300 bg-base-200/30">
      <img
        :src="imageUrl"
        :alt="alt"
        class="w-full h-auto object-contain"
        loading="lazy"
        @error="onImgError"
      />
    </div>
  </div>
</template>

<script setup>
defineProps({
  imageUrl: { type: String, default: '' },
  alt: { type: String, default: '' }
})

const fallbackSrc = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>'
function onImgError(e) {
  e.target.src = fallbackSrc
}
</script>
