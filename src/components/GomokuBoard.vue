<template>
  <div class="board-wrapper">
    <div class="board">
      <!-- 棋盘网格 -->
      <svg class="grid" :viewBox="`0 0 ${size - 1} ${size - 1}`" preserveAspectRatio="none">
        <!-- 纵线 -->
        <line v-for="i in size" :key="'v-' + i" :x1="i - 1" y1="0" :x2="i - 1" :y2="size - 1" stroke="rgba(0,0,0,0.6)"
          stroke-width="0.03" />
        <!-- 横线 -->
        <line v-for="i in size" :key="'h-' + i" x1="0" :y1="i - 1" :x2="size - 1" :y2="i - 1" stroke="rgba(0,0,0,0.6)"
          stroke-width="0.03" />
        <!-- 星位/天元 -->
        <circle v-for="(pt, idx) in starPoints" :key="'star-' + idx" :cx="pt.x" :cy="pt.y" r="0.12"
          fill="rgba(0,0,0,0.85)" />
      </svg>

      <!-- 棋子 -->
      <template v-for="(cell, index) in flatBoard" :key="'stone-'+index">
        <div v-if="cell === 1 || cell === 2" class="stone" :class="cell === 1 ? 'black' : 'white'"
          :style="stoneStyle(index)"></div>
      </template>

      <!-- 点击热点 -->
      <button v-for="(cell, index) in flatBoard" :key="'hot-' + index" class="hotspot" :style="stoneStyle(index)"
        @click="$emit('place', index % size, Math.floor(index / size))" aria-label="place stone"></button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps<{
  size: number
  board: number[][]
}>()

// 一维化棋盘
const flatBoard = computed(() => props.board.flat())

// 百分比步进
const step = computed(() => 100 / (props.size - 1))

// 棋子/热点定位
function stoneStyle(index: number) {
  const x = index % props.size
  const y = Math.floor(index / props.size)
  return {
    left: `${x * step.value}%`,
    top: `${y * step.value}%`,
  }
}

// 星位/天元（15x15：4,8,12）
const starPoints = computed(() => {
  if (props.size !== 15) return []
  const coords = [4, 8, 12]
  const stars: { x: number; y: number }[] = []
  coords.forEach((gy) => {
    coords.forEach((gx) => {
      stars.push({ x: gx - 1, y: gy - 1 })
    })
  })
  return stars
})
</script>

<style scoped>
.board-wrapper {
  display: inline-block;
  padding: 16px;                 /* 外框厚度，留出空间 */
  background: #d2a675;           /* 木框颜色 */
  border: 6px solid #3b2412;     /* 更深的外边框 */
  border-radius: 8px;
}

.board {
  position: relative;
  background: #d2a675;
  border: 2px solid #8b5a2b;     /* 内框 */
  width: 80vmin;
  height: 80vmin;
  max-width: 600px;
  max-height: 600px;
  margin: auto;
  border-radius: 4px;
  overflow: visible;             /* 允许棋子超出一点 */
}
.grid {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* 不拦截点击 */
}

.stone {
  position: absolute;
  width: 4.6%;
  height: 4.6%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  z-index: 5;
}
.black { background: #111; }
.white {
  background: #f7f7f7;
  border: 1px solid rgba(0,0,0,0.2);
}

.hotspot {
  position: absolute;
  width: 6.5%;
  height: 6.5%;
  transform: translate(-50%, -50%);
  background: transparent;
  border: none;
  padding: 0;
  z-index: 10;
  cursor: pointer;
}
</style>
