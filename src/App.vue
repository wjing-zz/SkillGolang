<template>
  <div class="app">
    <h1>五子棋 + 卡牌原型</h1>
    <div class="game">
      <GomokuBoard
        :size="boardSize"
        :board="board"
        @place="handlePlace"
      />
      <aside class="sidebar">
        <h3>日志</h3>
        <div class="log">
          <div v-for="(line, i) in logs" :key="i">{{ line }}</div>
        </div>
        <div v-if="winner" class="winner">🎉 {{ winner }} 获胜！</div>

        <h3 style="margin-top:20px;">手牌</h3>
        <div v-if="hand.length === 0">暂无卡牌</div>
        <div v-for="(card, i) in hand" :key="i" class="card">
          <span>{{ card }}</span>
          <button @click="useCard(card)" :disabled="!canUseCard(card)">
            使用
          </button>
        </div>

        <button style="margin-top: 20px;" @click="restartGame" class="restart-btn">
          重新开始
        </button>
      </aside>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import GomokuBoard from './components/GomokuBoard.vue'

type Player = 0 | 1 | 2 // 0=空, 1=玩家, 2=AI
const boardSize = 15
const board = ref<Player[][]>([])
const turn = ref<Player>(1)
const logs = ref<string[]>([])
const winner = ref<string | null>(null)

// ===== 卡牌系统 =====
const hand = ref<string[]>([]) // 手牌
const usageCounts = ref({ FEI: 0, JING: 0, LI: 0 })

function drawCard() {
  const cards = ['飞沙走石', '静如止水', '力拔山兮']
  if (hand.value.length >= 3) return
  const card = cards[Math.floor(Math.random() * cards.length)]
  hand.value.push(card)
  log(`获得卡牌：${card}`)
}

function canUseCard(card: string) {
  if (turn.value !== 1 || winner.value) return false
  if (card === '飞沙走石' && usageCounts.value.FEI >= 1) return false
  if (card === '静如止水' && usageCounts.value.JING >= 2) return false
  if (card === '力拔山兮' && usageCounts.value.LI >= 1) return false
  return true
}

function useCard(card: string) {
  if (!canUseCard(card)) return

  if (card === '飞沙走石') {
    usageCounts.value.FEI++
    // 随机移除一枚 AI 棋子
    const aiStones: {x:number,y:number}[] = []
    for (let y=0;y<boardSize;y++){
      for (let x=0;x<boardSize;x++){
        if (board.value[y][x]===2) aiStones.push({x,y})
      }
    }
    if (aiStones.length>0){
      const target = aiStones[Math.floor(Math.random()*aiStones.length)]
      board.value[target.y][target.x]=0
      log('使用【飞沙走石】：移除了 AI 的一枚棋子')
    } else {
      log('使用【飞沙走石】：场上没有 AI 棋子可移除')
    }
  }

  if (card === '静如止水') {
    usageCounts.value.JING++
    log('使用【静如止水】：冻结 AI 一回合，你可再次行动')
    // 保持玩家回合，不切换到 AI
    turn.value = 1
  }

  if (card === '力拔山兮') {
    usageCounts.value.LI++
    // 随机移除最多 3 个 AI 棋子
    const aiStones: {x:number,y:number}[] = []
    for (let y=0;y<boardSize;y++){
      for (let x=0;x<boardSize;x++){
        if (board.value[y][x]===2) aiStones.push({x,y})
      }
    }
    let removed = 0
    for (let i=0;i<3 && aiStones.length>0;i++){
      const idx = Math.floor(Math.random()*aiStones.length)
      const target = aiStones.splice(idx,1)[0]
      board.value[target.y][target.x]=0
      removed++
    }
    log(`使用【力拔山兮】：震碎棋盘，移除了 AI 的 ${removed} 枚棋子`)
  }

  // 移除已使用的手牌
  const idx = hand.value.indexOf(card)
  if (idx>=0) hand.value.splice(idx,1)
}

// ===== 基础逻辑 =====
function log(msg: string) {
  logs.value.push(`[${new Date().toLocaleTimeString()}] ${msg}`)
}

function handlePlace(x: number, y: number) {
  if (winner.value || turn.value !== 1) return
  if (board.value[y][x] !== 0) return

  board.value[y][x] = 1
  log(`玩家落子 (${x},${y})`)

  if (checkWin(board.value, x, y, 1)) {
    winner.value = '玩家'
    return
  }

  // 每次落子有 30% 概率抽卡
  if (Math.random()<0.3) drawCard()

  turn.value = 2
  setTimeout(aiTurn, 300)
}

function aiTurn() {
  if (winner.value || turn.value !== 2) return

  const move = findAiMove()
  if (!move) {
    // 无处可下，视为平局
    winner.value = null
    log('棋盘已满或无可下位置，平局')
    turn.value = 1
    return
  }

  const { x, y } = move
  board.value[y][x] = 2
  log(`AI 落子 (${x},${y})`)

  if (checkWin(board.value, x, y, 2)) {
    winner.value = 'AI'
    return
  }

  turn.value = 1
}

// ===== 胜负判定 =====
function checkWin(board: number[][], x: number, y: number, who: number): boolean {
  const size = board.length
  const dirs = [
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 1, dy: 1 },
    { dx: 1, dy: -1 },
  ]
  for (const { dx, dy } of dirs) {
    let count = 1
    let nx = x + dx, ny = y + dy
    while (nx >= 0 && ny >= 0 && nx < size && ny < size && board[ny][nx] === who) {
      count++; nx += dx; ny += dy
    }
    nx = x - dx; ny = y - dy
    while (nx >= 0 && ny >= 0 && nx < size && ny < size && board[ny][nx] === who) {
      count++; nx -= dx; ny -= dy
    }
    if (count >= 5) return true
  }
  return false
}

// ===== 简单 AI =====
function findAiMove(): { x: number; y: number } | null {
  const size = board.value.length
  // 1. AI 自己能赢
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (board.value[y][x] !== 0) continue
      board.value[y][x] = 2
      if (checkWin(board.value, x, y, 2)) {
        board.value[y][x] = 0
        return { x, y }
      }
      board.value[y][x] = 0
    }
  }
  // 2. 阻挡玩家
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (board.value[y][x] !== 0) continue
      board.value[y][x] = 1
      if (checkWin(board.value, x, y, 1)) {
        board.value[y][x] = 0
        return { x, y }
      }
      board.value[y][x] = 0
    }
  }
  // 3. 随机落子
  const empties: { x: number; y: number }[] = []
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (board.value[y][x] === 0) empties.push({ x, y })
    }
  }
  if (empties.length === 0) return null
  return empties[Math.floor(Math.random() * empties.length)]
}

// ===== 初始化与重置 =====
function initBoard() {
  board.value = Array.from({ length: boardSize }, () => Array(boardSize).fill(0))
}

function restartGame() {
  initBoard()
  turn.value = 1
  logs.value = []
  winner.value = null
  hand.value = []
  usageCounts.value = { FEI: 0, JING: 0, LI: 0 }
  log('新的一局开始！')
}

// 初始加载
initBoard()
</script>

<style scoped>
.app { padding: 16px; font-family: sans-serif; }
.game { display: flex; gap: 16px; }
.sidebar { width: 260px; }
.log { height: 220px; overflow-y: auto; font-size: 12px; background: #111; color: #eee; padding: 6px; border-radius: 4px; }
.winner { margin-top: 12px; font-weight: bold; color: gold; }
.card { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin: 6px 0; padding: 6px 8px; border: 1px solid #ddd; border-radius: 6px; }
.card button { padding: 4px 8px; }
.restart-btn {
  padding: 6px 12px;
  background: #2f81f7;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.restart-btn:hover { background: #1f6fe0; }
</style>
