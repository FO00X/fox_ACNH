<template>
  <div class="space-y-4">
    <CatalogueDetailContent
      :category="category"
      :item-id="itemId"
      @close="router.back()"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CatalogueDetailContent from '../components/catalogue/CatalogueDetailContent.vue'

const route = useRoute()
const router = useRouter()

const category = computed(() => route.params.category || '')
const itemId = computed(() => route.params.itemId || '')
</script>
