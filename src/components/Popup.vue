<template>
  <transition name="fade">
    <div v-if="visible" class="popup">
      <div class="popup-content">
        <slot>{{ message }}</slot>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const props = defineProps<{
  message: string
  duration?: number   // 自动关闭时间，默认 2 秒
  trigger: number     // 每次变化时触发弹窗
}>()

const visible = ref(false)

watch(() => props.trigger, () => {
  visible.value = true
  setTimeout(() => {
    visible.value = false
  }, props.duration ?? 2000)
})
</script>

<style scoped>
.popup {
  position: fixed;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3000;
}
.popup-content {
  background: rgba(0,0,0,0.8);
  color: #fff;
  padding: 12px 20px;
  border-radius: 6px;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
