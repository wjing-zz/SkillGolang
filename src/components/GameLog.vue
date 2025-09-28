<template>
  <div>
    <h3>日志</h3>
    <div class="log">
      <div v-for="(line, i) in logs" :key="i">{{ line }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{ logs: string[] }>()
</script>

<style scoped>
.log { height: 200px; overflow-y: auto; font-size: 12px; background: #111; color: #eee; padding: 4px; }
</style>
