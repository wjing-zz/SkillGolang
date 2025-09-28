<template>
  <div class="board" :style="gridStyle">
    <div
      v-for="(cell, index) in flatBoard"
      :key="index"
      class="cell"
      @click="$emit('place', index % size, Math.floor(index / size))"
    >
      <div v-if="cell === 1" class="stone black"></div>
      <div v-else-if="cell === 2" class="stone white"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps<{
  size: number
  board: number[][]
}>()

// 将二维数组拍平成一维，方便单层 v-for 渲染
const flatBoard = computed(() => props.board.flat())

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${props.size}, 28px)`,
  gridTemplateRows: `repeat(${props.size}, 28px)`,
}))
</script>

<style scoped>
.board {
  background: #d2a675;
  border: 4px solid #8b5a2b;
  display: grid;
}

.cell {
  position: relative; /* 为棋子提供定位上下文 */
  width: 28px;
  height: 28px;
  border: 1px solid rgba(0,0,0,0.2);
  cursor: pointer;
}

.stone {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  transform: translate(-50%, -50%); /* 精确居中 */
}

.black { background: black; }
.white { background: white; }
</style>
