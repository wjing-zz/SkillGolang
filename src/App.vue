<template>
  <div class="app">
    <BackgroundMusic />
    <h1>
      技能五子棋
      <button class="rule-btn" @click="showRules = true">玩法说明</button>
    </h1>
    <div class="game">
      <GomokuBoard
        :size="boardSize"
        :board="board"
        @place="handlePlace"
      />
      <aside style="margin-top:1rem;" class="sidebar">
        <label class="challenge-label">挑战：</label>
          <select v-model="opponent" class="opponent-select" @change="restartGame">
          <option value="子棋">子棋</option>
          <option value="张技能五">张技能五</option>
        </select>

        <button style="margin-left: 1rem;" @click="restartGame" class="restart-btn">
          重新开始
        </button>
        <h3 style="margin-top:1rem;">玩家手牌</h3>
        <div class="card-row">
          <div
            v-for="i in 3"
            :key="i"
            class="card-slot"
          >
            <div v-if="hand[i-1]" class="card-ui" :class="getCardRarityClass(hand[i-1])">
              <span class="card-name">{{ hand[i-1] }}</span>
              <button @click="useCard(hand[i-1])" :disabled="!canUseCard(hand[i-1])">
                使用
              </button>
            </div>
            <div v-else class="card-ui empty-card">
              <span class="card-empty">空</span>
            </div>
          </div>
        </div>

        <h3 style="margin-top:1rem;">{{ opponent }}手牌</h3>
        <div class="card-row">
          <div
            v-for="i in 3"
            :key="i"
            class="card-slot"
          >
            <div v-if="aiHand[i-1]" class="card-ui" :class="getCardRarityClass(aiHand[i-1])">
              <span class="card-name">{{ aiHand[i-1] }}</span>
              <button disabled>
                {{ opponent }}自动使用
              </button>
            </div>
            <div v-else class="card-ui empty-card">
              <span class="card-empty">空</span>
            </div>
          </div>
        </div>

        <GameLog :logs="logs" :opponent="opponent"/>
        <div v-if="winner" class="winner">🎉 {{ winner === '玩家' ? '玩家' : opponent }} 获胜！</div>

      </aside>
    </div>
    <RulesModel :show="showRules" @close="showRules = false" />
    <Popup :message="popupMessage" :trigger="popupTrigger" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import GomokuBoard from './components/GomokuBoard.vue'
import RulesModel from './components/RulesModel.vue'
import BackgroundMusic from './components/BackgroundMusic.vue'
import GameLog from './components/GameLog.vue'
import { findAiMove } from './lib/commonMethod'
import Popup from './components/Popup.vue'

const popupMessage = ref('')
const popupTrigger = ref(0)
const showRules = ref(false)
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
const opponent = ref('子棋')
// ===== 玩家卡牌系统 =====
const hand = ref<string[]>([]) // 玩家手牌
const usageCounts = ref({ FEI: 0, JING: 0, LI: 0 })

// 卡牌池及权重
const cardPool = [
  { name: '飞沙走石', rarity: '紫', weight: 3 },
  { name: '静如止水', rarity: '紫', weight: 3 },
  { name: '力拔山兮', rarity: '金', weight: 0.3 }
]

// 连续未抽卡计数
const playerNoCardRounds = ref(0)
const aiNoCardRounds = ref(0)

// 静如止水额外行动机会
const playerExtraMove = ref(0)
const aiExtraMove = ref(0)

// 权重抽卡
function weightedDrawCard(hand: string[]) {
  const totalWeight = cardPool.reduce((sum, c) => sum + c.weight, 0)
  let r = Math.random() * totalWeight
  for (const card of cardPool) {
    if (r < card.weight) {
      // 新增：卡槽已存在同类卡牌则不加入
      if (hand.includes(card.name)) return
      if (hand.length >= 3) return
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
  // 新增：只抽没有的卡牌
  const available = cards.filter(card => !hand.value.includes(card))
  if (available.length === 0) return
  const card = available[Math.floor(Math.random() * available.length)]
  hand.value.push(card)
  log(`获得卡牌：${card}`)
}

function canUseCard(card: string) {
  if (turn.value !== 1 || winner.value) return false
  if (playerRound.value < 3) return false // 玩家前三次不能用卡牌
  // 不再限制 usageCounts
  // if (card === '飞沙走石' && usageCounts.value.FEI >= 1) return false
  // if (card === '静如止水' && usageCounts.value.JING >= 2) return false
  // if (card === '力拔山兮' && usageCounts.value.LI >= 1) return false
  if (playerExtraMove.value > 0) return false // 静如止水期间禁止用卡牌
  return hand.value.includes(card)
}

function useCard(card: string) {
  if (!canUseCard(card)) return
  if (actionUsed.value) return

  if (card === '飞沙走石') {
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
    showPopup(card)
    log('使用【静如止水】：你将连续落两个子（不能用卡牌）')
    playerExtraMove.value = 2
    actionUsed.value = false
    const idx = hand.value.indexOf(card)
    if (idx>=0) hand.value.splice(idx,1)
    return // 不切换回合
  }

  if (card === '力拔山兮') {
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

  showPopup(card)
  const idx = hand.value.indexOf(card)
  if (idx>=0) hand.value.splice(idx,1)
  actionUsed.value = true
  nextTurn()
}

// ===== AI卡牌系统 =====
const aiHand = ref<string[]>([])
const aiUsageCounts = ref({ FEI: 0, JING: 0, LI: 0 })

function aiDrawCard() {
  const cards = ['飞沙走石', '静如止水', '力拔山兮']
  if (aiHand.value.length >= 3) return
  // 新增：只抽没有的卡牌
  const available = cards.filter(card => !aiHand.value.includes(card))
  if (available.length === 0) return
  const card = available[Math.floor(Math.random() * available.length)]
  aiHand.value.push(card)
  log(`AI获得卡牌：${card}`)
}

function aiCanUseCard(card: string) {
  if (turn.value !== 2 || winner.value) return false
  if (aiRound.value < 3) return false // AI前三次不能用卡牌
  if (aiExtraMove.value > 0) return false // 静如止水期间禁止用卡牌
  // if (card === '飞沙走石' && aiUsageCounts.value.FEI >= 1) return false
  // if (card === '静如止水' && aiUsageCounts.value.JING >= 2) return false
  // if (card === '力拔山兮' && aiUsageCounts.value.LI >= 1) return false
  return aiHand.value.includes(card)
}

function aiUseCard(card: string): 'extra' | 'normal' | false {
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
    showPopup(card)
    log('AI使用【静如止水】：AI将连续落两个子（不能用卡牌）')
    aiExtraMove.value = 2
    actionUsed.value = false
    const idx = aiHand.value.indexOf(card)
    if (idx>=0) aiHand.value.splice(idx,1)
    return 'extra'
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
 showPopup(card)
  const idx = aiHand.value.indexOf(card)
  if (idx>=0) aiHand.value.splice(idx,1)
  return 'normal'
}

// ===== 基础逻辑 =====
function log(msg: string) {
  logs.value.push(`[${new Date().toLocaleTimeString()}] ${msg}`)
}

const cardDrawnThisTurn = ref(false) // 每回合是否已抽卡

function handlePlace(x: number, y: number) {
  if (winner.value || turn.value !== 1) return
  if (board.value[y][x] !== 0) return
  if (actionUsed.value) return

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

  if (playerExtraMove.value > 0) {
    playerExtraMove.value--
    actionUsed.value = false // 允许继续落子
    // 只有当 playerExtraMove.value === 0 时才切换回合
    if (playerExtraMove.value === 0) {
      actionUsed.value = true
      nextTurn()
    }
    return
  }

  actionUsed.value = true
  nextTurn()
}

function aiTurn() {
  if (winner.value || turn.value !== 2) return
  if (actionUsed.value) return

  cardDrawnThisTurn.value = false

  // 如果有额外行动，先尝试用卡
  if (aiExtraMove.value === 0) {
    for (const card of aiHand.value.slice()) {
      if (aiCanUseCard(card)) {
        const result = aiUseCard(card)
        if (result === 'extra') {
          aiTurn()
          return
        } else if (result === 'normal') {
          actionUsed.value = true
          nextTurn()
          return
        }
      }
    }
  }

  // 👉 在这里加延时，模拟思考
  const delay = 800 + Math.random() * 1200 // 0.8s ~ 2s
  log("AI 正在思考中…")

  setTimeout(() => {
    const move = findAiMove(board.value, boardSize, checkWin, isNInRow)
    if (!move) {
      winner.value = null
      log('棋盘已满或无可下位置，平局')
      actionUsed.value = true
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

    if (!cardDrawnThisTurn.value && Math.random() < 0.3) {
      aiDrawCard()
      cardDrawnThisTurn.value = true
    }

    if (checkWin(board.value, x, y, 2)) {
      winner.value = 'AI'
      return
    }

    if (aiExtraMove.value > 0) {
      aiExtraMove.value--
      actionUsed.value = false
      if (aiExtraMove.value === 0) {
        actionUsed.value = true
        nextTurn()
      } else {
        setTimeout(aiTurn, 300)
      }
      return
    }

    actionUsed.value = true
    nextTurn()
  }, delay)
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
  playerExtraMove.value = 0
  aiExtraMove.value = 0
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
function getCardRarityClass(cardName: string) {
  const card = cardPool.find(c => c.name === cardName)
  if (!card) return ''
  if (card.rarity === '紫') return 'rare-card'
  if (card.rarity === '金') return 'epic-card'
  return ''
}
function showPopup(msg: string) {
  popupMessage.value = msg
  popupTrigger.value++   // 每次加一，触发 watch
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
.card-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.card-slot {
  flex: 1;
}

.card-ui {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 10px;
  border: 2px solid #bbb;
  min-height: 70px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  padding: 8px 4px;
  position: relative;
}

.card-ui .card-name {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 6px;
}

.card-ui button {
  padding: 4px 10px;
  border-radius: 5px;
  border: none;
  background: #007bff;
  color: white;
  cursor: pointer;
  font-size: 14px;
}

.card-ui button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.empty-card {
  background: #f5f5f5;
  border: 2px dashed #ccc;
}

.card-empty {
  color: #aaa;
  font-size: 14px;
}

.rare-card {
  border-color: #a259e6;
  box-shadow: 0 0 8px #a259e6;
}

.epic-card {
  border-color: gold;
  box-shadow: 0 0 8px gold;
}

.opponent-select {
  margin-left: 0;
  padding: 4px 10px;
  font-size: 15px;
  border-radius: 6px;
  border: 1px solid #bbb;
  background: #f8f8ff;
  vertical-align: middle;
}

.challenge-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.challenge-label {
  font-weight: bold;
  margin-right: 8px;
}
.challenge-text {
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f5f5f5;
  transition: background 0.2s;
}
.challenge-text:hover {
  background: #e0e0e0;
}

@media screen and (min-width: 100px) and (max-width: 900px) {
  .game {
    flex-direction: column;
  }
}
</style>