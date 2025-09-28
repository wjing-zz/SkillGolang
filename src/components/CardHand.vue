<template>
  <div>
    <h3>手牌</h3>
    <div v-for="(card, i) in hand" :key="i" class="card">
      <span>{{ card }}</span>
      <button
        :disabled="!canUse(card)"
        @click="$emit('useCard', card)"
      >使用</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  hand: string[]
  usageCounts: { FEI: number; JING: number; LI: number }
  turn: number
  gameOver: boolean
}>()

function canUse(card: string) {
  if (props.turn !== 1 || props.gameOver) return false
  if (card === '飞沙走石' && props.usageCounts.FEI >= 1) return false
  if (card === '静如止水' && props.usageCounts.JING >= 2) return false
  if (card === '力拔山兮' && props.usageCounts.LI >= 1) return false
  return true
}
</script>

<style scoped>
.card { display: flex; justify-content: space-between; margin: 4px 0; }
</style>
