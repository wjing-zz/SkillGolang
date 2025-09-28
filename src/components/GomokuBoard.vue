<template>
  <div class="board" :style="gridStyle">
    <div
      v-for="(cell, index) in flatBoard"
      :key="index"
      class="cell"
      :class="{
        'last-col': (index % size) === size - 1,
        'last-row': Math.floor(index / size) === size - 1
      }"
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

// 使用 CSS Grid，格子大小用百分比自适应
const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${props.size}, 1fr)`,
  gridTemplateRows: `repeat(${props.size}, 1fr)`,
}))
</script>

<style scoped>
.board {
  background: #d2a675;
  border: 2px solid #8b5a2b;
  display: grid;
  width: 90vmin;   /* 宽度随屏幕缩放 */
  height: 90vmin;  /* 高度保持一致，保证正方形 */
  max-width: 600px;
  max-height: 600px;
  margin: auto;
}

.cell {
  position: relative;
  box-sizing: border-box;
  cursor: pointer;
  border-right: 1px solid rgba(0,0,0,0.2);
  border-bottom: 1px solid rgba(0,0,0,0.2);
}

/* 去掉最后一列的右边框 */
.cell.last-col {
  border-right: none;
}

/* 去掉最后一行的下边框 */
.cell.last-row {
  border-bottom: none;
}

.stone {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 70%;   /* 相对格子大小缩放 */
  height: 70%;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.black { background: black; }
.white { background: white; }
</style>
