<template>
  <div class="names tab flex-1 overflow-auto">
    <div class="rounded-2xl border border-base-300 bg-base-200/30 p-4">
      <table class="table table-sm table-pin-rows">
        <tbody>
          <tr v-for="(val, key) in rows" :key="key" class="border-base-200">
            <td class="text-base-content/70">{{ key }}：</td>
            <td class="font-medium">{{ val }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
defineProps({
  rows: { type: Object, default: () => ({}) }
})
</script>
