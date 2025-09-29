<template>
  <h3>日志</h3>
  <div class="log">
    <div v-for="(line, i) in logs" :key="i" :class="isAiLog(line) ? 'ai-log' : ''">
      {{ line.replace(/AI/g, opponent) }}
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{ logs: string[],opponent: string }>()

function isAiLog(line: string) {
  return line.includes('AI') || line.includes(props.opponent)
}
</script>

<style scoped>
.log {
  max-height: 200px;
  overflow-y: auto;
  background: #f9f9f9;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 10px;
}

.ai-log {
  color: #555;
  font-style: italic;
}
</style>
