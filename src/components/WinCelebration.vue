<template>
  <transition name="fade">
    <div v-if="visible" class="celebration">
      <div class="confetti">
        <span
          v-for="i in count"
          :key="i"
          class="piece"
          :style="pieceStyle(i)"
        >🎉</span>
      </div>
      <div class="headline">
        🎉 {{ winner }} 获胜！🎉
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'

const props = defineProps<{
  show: boolean
  duration?: number      // milliseconds, default 2500
  count?: number         // number of confetti pieces, default 80
  winner?: string
}>()

const visible = ref(false)
const count = computed(() => props.count ?? 80)
const duration = computed(() => props.duration ?? 2500)

watch(() => props.show, (val) => {
  if (val) {
    visible.value = true
    setTimeout(() => (visible.value = false), duration.value)
  }
})

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

// Each piece gets randomized position, delay, speed, and rotation
function pieceStyle(i: number) {
  const left = rand(0, 100)          // start X%
  const delay = rand(0, 0.6)         // seconds
  const fall = rand(1.8, 3.2)        // seconds
  const rotate = rand(0, 360)        // deg
  const size = rand(18, 30)          // px

  return {
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${fall}s`,
    transform: `translateY(-120%) rotate(${rotate}deg)`,
    fontSize: `${size}px`,
  }
}
</script>

<style scoped>
.celebration {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none; /* don’t block clicks */
  background: rgba(0,0,0,0.05);     /* subtle overlay */
}

.confetti {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.piece {
  position: absolute;
  top: 0;
  animation-name: fall, sway;
  animation-fill-mode: forwards;
  animation-timing-function: ease-in, ease-in-out;
}

@keyframes fall {
  0%   { transform: translateY(-120%) rotate(0deg); opacity: 0 }
  10%  { opacity: 1 }
  100% { transform: translateY(110vh) rotate(720deg); opacity: 0 }
}

@keyframes sway {
  0%   { margin-left: 0 }
  50%  { margin-left: 30px }
  100% { margin-left: -20px }
}

.headline {
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translateX(-50%);
  color: #fff;
  text-shadow: 0 2px 12px rgba(0,0,0,0.4);
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 1px;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s }
.fade-enter-from, .fade-leave-to { opacity: 0 }
</style>
