<template>
  <div>
    <div class="music-btn" @click="toggleMusic">
      <!-- 开启状态 -->
      <svg v-if="musicOn" width="28" height="28" viewBox="0 0 28 28">
        <path d="M18.5149 1.12128C19.7772 0.805704 21 1.76042 21 3.06156V5.93846C21 6.85619 20.3754 7.65616 19.4851 7.87874L13 9.50001V18C13 20.7614 10.7614 23 8 23C5.23858 23 3 20.7614 3 18C3 15.2386 5.23858 13 8 13C9.12561 13 10.1643 13.372 11 13.9996V4.56156C11 3.64383 11.6246 2.84386 12.5149 2.62128L18.5149 1.12128ZM17.7575 3.31064C18.3886 3.15286 19 3.63022 19 4.28079V5.21923C19 5.6781 18.6877 6.07808 18.2425 6.18938L14.2425 7.18938C13.6114 7.34716 13 6.8698 13 6.21923V5.28079C13 4.82192 13.3123 4.42194 13.7575 4.31064L17.7575 3.31064ZM5.00786 18C5.00786 19.6525 6.34749 20.9921 8 20.9921C9.65251 20.9921 10.9921 19.6525 10.9921 18C10.9921 16.3475 9.65251 15.0079 8 15.0079C6.34749 15.0079 5.00786 16.3475 5.00786 18Z" fill="#a259e6"/>
        <!-- <circle cx="9" cy="23" r="3" fill="#a259e6"/> -->
      </svg>
      <!-- 关闭状态 -->
      <svg v-else width="28" height="28" viewBox="0 0 28 28">
        <path d="M18.5149 1.12128C19.7772 0.805704 21 1.76042 21 3.06156V5.93846C21 6.85619 20.3754 7.65616 19.4851 7.87874L13 9.50001V18C13 20.7614 10.7614 23 8 23C5.23858 23 3 20.7614 3 18C3 15.2386 5.23858 13 8 13C9.12561 13 10.1643 13.372 11 13.9996V4.56156C11 3.64383 11.6246 2.84386 12.5149 2.62128L18.5149 1.12128ZM17.7575 3.31064C18.3886 3.15286 19 3.63022 19 4.28079V5.21923C19 5.6781 18.6877 6.07808 18.2425 6.18938L14.2425 7.18938C13.6114 7.34716 13 6.8698 13 6.21923V5.28079C13 4.82192 13.3123 4.42194 13.7575 4.31064L17.7575 3.31064ZM5.00786 18C5.00786 19.6525 6.34749 20.9921 8 20.9921C9.65251 20.9921 10.9921 19.6525 10.9921 18C10.9921 16.3475 9.65251 15.0079 8 15.0079C6.34749 15.0079 5.00786 16.3475 5.00786 18Z" fill="#bbb"/>
        <!-- <circle cx="9" cy="23" r="3" fill="#bbb"/> -->
        <line x1="4" y1="4" x2="24" y2="24" stroke="#e74c3c" stroke-width="3"/>
      </svg>
    </div>
    <!-- 静音自动播放 -->
    <audio ref="bgAudio" :src="bgMusic" loop muted autoplay />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import bgMusic from '../assets/music/background.mp3'

const musicOn = ref(false) // 初始为关闭（静音）
const bgAudio = ref<HTMLAudioElement>()

function toggleMusic() {
  if (!bgAudio.value) return
  musicOn.value = !musicOn.value
  if (musicOn.value) {
    bgAudio.value.muted = false
    bgAudio.value.play().catch(err => {
      console.warn("播放失败：", err)
    })
  } else {
    bgAudio.value.pause()
  }
}

onMounted(() => {
  if (bgAudio.value) {
    bgAudio.value.volume = 0.5
    // 默认静音播放，不触发浏览器限制
    bgAudio.value.play().catch(() => {
      console.log("等待用户交互后再播放")
    })
  }
})
</script>

<style scoped>
.music-btn {
  position: fixed;
  top: 18px;
  right: 22px;
  z-index: 2000;
  cursor: pointer;
  background: rgba(255,255,255,0.8);
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 6px;
  transition: background 0.2s;
}
.music-btn:hover {
  background: #f3e8ff;
}
</style>
