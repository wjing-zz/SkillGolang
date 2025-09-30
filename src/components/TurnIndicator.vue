<template>
  <div class="turn-indicator">
    现在是：
    <span v-if="turn === 1">玩家回合（⚫）</span>
    <span v-else>{{ opponent }} 回合（⚪）</span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  turn: number
  opponent: string
}>()
</script>

<style scoped>
.turn-indicator {
  margin: 8px 0;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
}
</style>
