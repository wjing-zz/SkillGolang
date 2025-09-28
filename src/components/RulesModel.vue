<template>
  <div v-if="show" class="popup-mask" @click.self="emitClose">
    <div class="popup">
      <h2>玩法说明</h2>
      <ul>
        <li>每回合只能选择落子或使用一张卡牌。</li>
        <li>卡牌最多持有3张，分为紫色（稀有）和金色（史诗）。</li>
        <li>阻止对手“四连”可获得一张卡牌。</li>
        <li>自己形成“三连”有概率获得卡牌。</li>
        <li>连续几回合未抽卡会保底送一张卡牌。</li>
        <li>卡牌效果：
          <ul>
            <li><span class="rare">飞沙走石</span>：移除对方一枚棋子。</li>
            <li><span class="rare">静如止水</span>：跳过对手回合，自己可再次行动。</li>
            <li><span class="epic">力拔山兮</span>：移除对方最多三枚棋子。</li>
          </ul>
        </li>
        <li>前三回合双方不能使用卡牌。</li>
        <li>AI也会自动抽卡和使用卡牌。</li>
      </ul>
      <button class="close-btn" @click="emitClose">关闭</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits } from 'vue'
const props = defineProps<{ show: boolean }>()
const emit = defineEmits(['close'])
function emitClose() {
  emit('close')
}
</script>

<style scoped>
.popup-mask {
  position: fixed;
  left: 0; top: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.25);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.popup {
  background: #fff;
  border-radius: 12px;
  padding: 28px 24px 18px 24px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.18);
  min-width: 320px;
  max-width: 90vw;
}
.popup h2 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 22px;
}
.popup ul {
  padding-left: 18px;
  margin-bottom: 16px;
}
.popup li {
  margin-bottom: 7px;
  font-size: 15px;
}
.popup .rare {
  color: #a259e6;
  font-weight: bold;
}
.popup .epic {
  color: gold;
  font-weight: bold;
}
.close-btn {
  padding: 6px 18px;
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  cursor: pointer;
}
.close-btn:hover {
  background: #0056b3;
}
</style>