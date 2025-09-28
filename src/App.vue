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

        <h3 style="margin-top:20px;">玩家手牌</h3>
        <div v-if="hand.length === 0">暂无卡牌</div>
        <div v-for="(card, i) in hand" :key="i" class="card">
          <span>{{ card }}</span>
          <button @click="useCard(card)" :disabled="!canUseCard(card)">
            使用
          </button>
        </div>

        <h3 style="margin-top:20px;">AI手牌</h3>
        <div v-if="aiHand.length === 0">暂无卡牌</div>
        <div v-for="(card, i) in aiHand" :key="i" class="card">
          <span>{{ card }}</span>
          <button disabled>
            AI自动使用
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
const round = ref(1) // 新增：记录当前回合数
const actionUsed = ref(false) // 标记是否已行动
const playerRound = ref(0) // 玩家落子次数
const aiRound = ref(0)     // AI落子次数

// ===== 玩家卡牌系统 =====
const hand = ref<string[]>([]) // 玩家手牌
const usageCounts = ref({ FEI: 0, JING: 0, LI: 0 })

// 卡牌池及权重
const cardPool = [
  { name: '飞沙走石', rarity: '紫', weight: 3 },
  { name: '静如止水', rarity: '紫', weight: 3 },
  { name: '力拔山兮', rarity: '金', weight: 1 }
]

// 连续未抽卡计数
const playerNoCardRounds = ref(0)
const aiNoCardRounds = ref(0)

// 权重抽卡
function weightedDrawCard(hand: string[]) {
  const totalWeight = cardPool.reduce((sum, c) => sum + c.weight, 0)
  let r = Math.random() * totalWeight
  for (const card of cardPool) {
    if (r < card.weight) {
      hand.push(card.name)
      log(`获得${card.rarity}卡牌：${card.name}`)
      return
    }
    r -= card.weight
  }
}

function drawCard() {
  const cards = ['飞沙走石', '静如止水', '力拔山兮']
  if (hand.value.length >= 3) return
  const card = cards[Math.floor(Math.random() * cards.length)]
  hand.value.push(card)
  log(`获得卡牌：${card}`)
}

function canUseCard(card: string) {
  if (turn.value !== 1 || winner.value) return false
  if (playerRound.value < 3) return false // 玩家前三次不能用卡牌
  if (round.value < 4) return false // 前三回合禁止使用卡牌
  if (card === '飞沙走石' && usageCounts.value.FEI >= 1) return false
  if (card === '静如止水' && usageCounts.value.JING >= 2) return false
  if (card === '力拔山兮' && usageCounts.value.LI >= 1) return false
  return true
}

function useCard(card: string) {
  if (!canUseCard(card)) return
  if (actionUsed.value) return // 已行动则不能再用卡牌

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

  actionUsed.value = true // 标记本回合已行动

  // 静如止水：不切换回合，玩家可再次行动
  if (card === '静如止水') {
    turn.value = 1
    actionUsed.value = false // 新一回合可行动
    return
  }

  nextTurn()
}

// ===== AI卡牌系统 =====
const aiHand = ref<string[]>([])
const aiUsageCounts = ref({ FEI: 0, JING: 0, LI: 0 })

function aiDrawCard() {
  const cards = ['飞沙走石', '静如止水', '力拔山兮']
  if (aiHand.value.length >= 3) return
  const card = cards[Math.floor(Math.random() * cards.length)]
  aiHand.value.push(card)
  log(`AI获得卡牌：${card}`)
}

function aiCanUseCard(card: string) {
  if (turn.value !== 2 || winner.value) return false
  if (aiRound.value < 3) return false // AI前三次不能用卡牌
  if (round.value < 4) return false // 前三回合禁止使用卡牌
  if (card === '飞沙走石' && aiUsageCounts.value.FEI >= 1) return false
  if (card === '静如止水' && aiUsageCounts.value.JING >= 2) return false
  if (card === '力拔山兮' && aiUsageCounts.value.LI >= 1) return false
  return true
}

function aiUseCard(card: string) {
  if (!aiCanUseCard(card)) return false

  if (card === '飞沙走石') {
    aiUsageCounts.value.FEI++
    // 随机移除一枚玩家棋子
    const playerStones: {x:number,y:number}[] = []
    for (let y=0;y<boardSize;y++){
      for (let x=0;x<boardSize;x++){
        if (board.value[y][x]===1) playerStones.push({x,y})
      }
    }
    if (playerStones.length>0){
      const target = playerStones[Math.floor(Math.random()*playerStones.length)]
      board.value[target.y][target.x]=0
      log('AI使用【飞沙走石】：移除了玩家的一枚棋子')
    } else {
      log('AI使用【飞沙走石】：场上没有玩家棋子可移除')
    }
  }

  if (card === '静如止水') {
    aiUsageCounts.value.JING++
    log('AI使用【静如止水】：冻结玩家一回合，AI可再次行动')
    turn.value = 2
  }

  if (card === '力拔山兮') {
    aiUsageCounts.value.LI++
    // 随机移除最多 3 个玩家棋子
    const playerStones: {x:number,y:number}[] = []
    for (let y=0;y<boardSize;y++){
      for (let x=0;x<boardSize;x++){
        if (board.value[y][x]===1) playerStones.push({x,y})
      }
    }
    let removed = 0
    for (let i=0;i<3 && playerStones.length>0;i++){
      const idx = Math.floor(Math.random()*playerStones.length)
      const target = playerStones.splice(idx,1)[0]
      board.value[target.y][target.x]=0
      removed++
    }
    log(`AI使用【力拔山兮】：震碎棋盘，移除了玩家的 ${removed} 枚棋子`)
  }

  // 移除已使用的手牌
  const idx = aiHand.value.indexOf(card)
  if (idx>=0) aiHand.value.splice(idx,1)
  return true
}

// ===== 基础逻辑 =====
function log(msg: string) {
  logs.value.push(`[${new Date().toLocaleTimeString()}] ${msg}`)
}

const cardDrawnThisTurn = ref(false) // 每回合是否已抽卡

function handlePlace(x: number, y: number) {
  if (winner.value || turn.value !== 1) return
  if (board.value[y][x] !== 0) return
  if (actionUsed.value) return // 已行动则不能再落子

  board.value[y][x] = 1
  playerRound.value++
  log(`玩家落子 (${x},${y})`)
  round.value++

  actionUsed.value = true // 标记本回合已行动
  cardDrawnThisTurn.value = false // 新回合开始，未抽卡

  let blocked = false
  // 判断是否阻止了AI四连
  board.value[y][x] = 1
  if (!cardDrawnThisTurn.value && blocksOpponentFour(board.value, x, y, 2)) {
    weightedDrawCard(hand.value)
    blocked = true
    playerNoCardRounds.value = 0
    cardDrawnThisTurn.value = true
  }
  // 判断是否形成三连
  if (!cardDrawnThisTurn.value && !blocked && isNInRow(board.value, x, y, 1, 3) && Math.random() < 0.5) {
    weightedDrawCard(hand.value)
    playerNoCardRounds.value = 0
    cardDrawnThisTurn.value = true
  } else if (!cardDrawnThisTurn.value && !blocked) {
    playerNoCardRounds.value++
    if (playerNoCardRounds.value >= 3) {
      weightedDrawCard(hand.value)
      playerNoCardRounds.value = 0
      cardDrawnThisTurn.value = true
    }
  }

  if (!cardDrawnThisTurn.value && Math.random()<0.3) {
    drawCard()
    cardDrawnThisTurn.value = true
  }

  if (checkWin(board.value, x, y, 1)) {
    winner.value = '玩家'
    return
  }

  nextTurn()
}

function aiTurn() {
  if (winner.value || turn.value !== 2) return
  if (actionUsed.value) return

  cardDrawnThisTurn.value = false // 新回合开始，未抽卡

  // AI优先用卡牌
  for (const card of aiHand.value.slice()) {
    if (aiCanUseCard(card)) {
      aiUseCard(card)
      actionUsed.value = true
      // 静如止水：AI可再次行动
      if (card === '静如止水') {
        turn.value = 2
        actionUsed.value = false
        setTimeout(aiTurn, 300)
        return
      }
      nextTurn()
      return
    }
  }

  // 否则落子
  const move = findAiMove()
  if (!move) {
    winner.value = null
    log('棋盘已满或无可下位置，平局')
    nextTurn()
    return
  }

  const { x, y } = move
  board.value[y][x] = 2
  aiRound.value++
  log(`AI 落子 (${x},${y})`)
  round.value++

  actionUsed.value = true

  let blocked = false
  board.value[y][x] = 2
  if (!cardDrawnThisTurn.value && blocksOpponentFour(board.value, x, y, 1)) {
    weightedDrawCard(aiHand.value)
    blocked = true
    aiNoCardRounds.value = 0
    cardDrawnThisTurn.value = true
  }
  if (!cardDrawnThisTurn.value && !blocked && isNInRow(board.value, x, y, 2, 3) && Math.random() < 0.5) {
    weightedDrawCard(aiHand.value)
    aiNoCardRounds.value = 0
    cardDrawnThisTurn.value = true
  } else if (!cardDrawnThisTurn.value && !blocked) {
    aiNoCardRounds.value++
    if (aiNoCardRounds.value >= 3) {
      weightedDrawCard(aiHand.value)
      aiNoCardRounds.value = 0
      cardDrawnThisTurn.value = true
    }
  }

  if (!cardDrawnThisTurn.value && Math.random()<0.3) {
    aiDrawCard()
    cardDrawnThisTurn.value = true
  }

  if (checkWin(board.value, x, y, 2)) {
    winner.value = 'AI'
    return
  }

  nextTurn()
}

function nextTurn() {
  // 切换回合
  cardDrawnThisTurn.value = false // 新回合重置
  if (turn.value === 1) {
    turn.value = 2
    actionUsed.value = false
    setTimeout(aiTurn, 300)
  } else {
    turn.value = 1
    actionUsed.value = false
  }
}

function checkWin(board: number[][], x: number, y: number, who: number): boolean {
  const directions = [
    { x: 1, y: 0 }, // 横向
    { x: 0, y: 1 }, // 纵向
    { x: 1, y: 1 }, // 斜向（\）
    { x: 1, y: -1 } // 斜向（/）
  ]

  for (const { x: dx, y: dy } of directions) {
    let count = 1

    // 正向检查
    for (let step = 1; step < 5; step++) {
      const newX = x + dx * step
      const newY = y + dy * step
      if (newX < 0 || newY < 0 || newX >= boardSize || newY >= boardSize) break
      if (board[newY][newX] === who) count++
      else break
    }

    // 反向检查
    for (let step = 1; step < 5; step++) {
      const newX = x - dx * step
      const newY = y - dy * step
      if (newX < 0 || newY < 0 || newX >= boardSize || newY >= boardSize) break
      if (board[newY][newX] === who) count++
      else break
    }

    if (count >= 5) return true
  }

  return false
}

function findAiMove(): { x: number; y: number } | null {
  // 1. 阻挡玩家四连
  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      if (board.value[y][x] !== 0) continue
      board.value[y][x] = 1
      if (checkWin(board.value, x, y, 1)) {
        board.value[y][x] = 0
        return { x, y }
      }
      board.value[y][x] = 0
    }
  }
  // 2. 阻挡玩家三连
  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      if (board.value[y][x] !== 0) continue
      board.value[y][x] = 1
      let count = 0
      if (isNInRow(board.value, x, y, 1, 3)) count++
      board.value[y][x] = 0
      if (count > 0) return { x, y }
    }
  }
  // 3. 优先在玩家棋子附近落子
  const candidates: { x: number; y: number }[] = []
  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      if (board.value[y][x] !== 0) continue
      // 检查周围是否有玩家棋子
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue
          const nx = x + dx
          const ny = y + dy
          if (
            nx >= 0 &&
            ny >= 0 &&
            nx < boardSize &&
            ny < boardSize &&
            board.value[ny][nx] === 1
          ) {
            candidates.push({ x, y })
            break
          }
        }
      }
    }
  }
  if (candidates.length > 0) {
    return candidates[Math.floor(Math.random() * candidates.length)]
  }
  // 4. 随机落子
  const emptySpaces: { x: number; y: number }[] = []
  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      if (board.value[y][x] === 0) {
        emptySpaces.push({ x, y })
      }
    }
  }
  if (emptySpaces.length === 0) return null
  return emptySpaces[Math.floor(Math.random() * emptySpaces.length)]
}

// 辅助函数：判断某点落下后是否有N连
function isNInRow(board: number[][], x: number, y: number, who: number, n: number): boolean {
  const directions = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: -1 }
  ]
  for (const { x: dx, y: dy } of directions) {
    let count = 1
    for (let step = 1; step < n; step++) {
      const nx = x + dx * step
      const ny = y + dy * step
      if (nx < 0 || ny < 0 || nx >= boardSize || ny >= boardSize) break
      if (board[ny][nx] === who) count++
      else break
    }
    for (let step = 1; step < n; step++) {
      const nx = x - dx * step
      const ny = y - dy * step
      if (nx < 0 || ny < 0 || nx >= boardSize || ny >= boardSize) break
      if (board[ny][nx] === who) count++
      else break
    }
    if (count >= n) return true
  }
  return false
}

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
  aiHand.value = []
  aiUsageCounts.value = { FEI: 0, JING: 0, LI: 0 }
  playerRound.value = 0 // 重置玩家落子次数
  aiRound.value = 0     // 重置AI落子次数
  actionUsed.value = false
  cardDrawnThisTurn.value = false
  log('新的一局开始！')
}
initBoard()
function blocksOpponentFour(board: Player[][], x: number, y: number, opponent: Player): boolean {
  const directions = [
    { x: 1, y: 0 }, // Horizontal
    { x: 0, y: 1 }, // Vertical
    { x: 1, y: 1 }, // Diagonal (\)
    { x: 1, y: -1 } // Diagonal (/)
  ];

  for (const { x: dx, y: dy } of directions) {
    let count = 1;

    // Check forward
    for (let step = 1; step < 4; step++) {
      const nx = x + dx * step;
      const ny = y + dy * step;
      if (nx < 0 || ny < 0 || nx >= boardSize || ny >= boardSize) break;
      if (board[ny][nx] === opponent) count++;
      else break;
    }

    // Check backward
    for (let step = 1; step < 4; step++) {
      const nx = x - dx * step;
      const ny = y - dy * step;
      if (nx < 0 || ny < 0 || nx >= boardSize || ny >= boardSize) break;
      if (board[ny][nx] === opponent) count++;
      else break;
    }

    // If placing here blocks a potential four-in-a-row
    if (count === 4) return true;
  }

  return false;
}
</script>

<style>
.app {
  text-align: center;
}

.game {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.sidebar {
  max-width: 300px;
  margin-left: 20px;
  text-align: left;
}

.log {
  max-height: 200px;
  overflow-y: auto;
  background: #f9f9f9;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 10px;
}

.card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #e0e0e0;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 10px;
}

.restart-btn {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.restart-btn:hover {
  background: #0056b3;
}

.winner {
  font-size: 18px;
  font-weight: bold;
  margin: 10px 0;
}
</style>