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
      </aside>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import GomokuBoard from './components/GomokuBoard.vue'

type Player = 0 | 1 | 2 // 0=空, 1=玩家, 2=AI
const boardSize = 15
const board = ref<Player[][]>(
  Array.from({ length: boardSize }, () => Array(boardSize).fill(0))
)
const turn = ref<Player>(1)
const logs = ref<string[]>([])
const winner = ref<string | null>(null)

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

  turn.value = 2
  setTimeout(aiTurn, 300)
}

function aiTurn() {
  if (winner.value) return

  const move = findAiMove()
  if (!move) return
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
</script>

<style scoped>
.app { padding: 16px; font-family: sans-serif; }
.game { display: flex; gap: 16px; }
.sidebar { width: 240px; }
.log { height: 200px; overflow-y: auto; font-size: 12px; background: #111; color: #eee; padding: 4px; }
.winner { margin-top: 12px; font-weight: bold; color: gold; }
</style>
