export function findAiMove(
  board: number[][],
  boardSize: number,
  checkWin: (board: number[][], x: number, y: number, who: number) => boolean,
  isNInRow: (board: number[][], x: number, y: number, who: number, n: number) => boolean,
  opponent: string
): { x: number; y: number } | null {
  // 如果对手是张技能五，启用权重机制
  // if (opponent === '张技能五') {
    
  //   const weightedMoves: { x: number; y: number; score: number }[] = []

  //   for (let y = 0; y < boardSize; y++) {
  //     for (let x = 0; x < boardSize; x++) {
  //       if (board[y][x] !== 0) continue

  //       let score = 1 // 基础分
  //       board[y][x] = 2

  //       // 直接赢（五连）
  //       if (checkWin(board, x, y, 2)) {
  //         board[y][x] = 0
  //         return { x, y } // 立即取胜
  //       }

  //       // 四连机会
  //       if (isNInRow(board, x, y, 2, 4)) score += 50
  //       // 三连机会
  //       if (isNInRow(board, x, y, 2, 3)) score += 20

  //       board[y][x] = 0

  //       // 靠近玩家棋子也加分
  //       for (let dy = -1; dy <= 1; dy++) {
  //         for (let dx = -1; dx <= 1; dx++) {
  //           if (dx === 0 && dy === 0) continue
  //           const nx = x + dx
  //           const ny = y + dy
  //           if (
  //             nx >= 0 &&
  //             ny >= 0 &&
  //             nx < boardSize &&
  //             ny < boardSize &&
  //             board[ny][nx] === 1
  //           ) {
  //             score += 5
  //           }
  //         }
  //       }

  //       weightedMoves.push({ x, y, score })
  //     }
  //   }

  //   if (weightedMoves.length === 0) return null

  //   // 按权重随机选择
  //   const total = weightedMoves.reduce((sum, m) => sum + m.score, 0)
  //   let r = Math.random() * total
  //   for (const move of weightedMoves) {
  //     if (r < move.score) return { x: move.x, y: move.y }
  //     r -= move.score
  //   }
  //   return weightedMoves[0] // fallback
  // }

  // ====== 原有逻辑（非张技能五） ======
  // 1. 阻挡玩家四连
  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      if (board[y][x] !== 0) continue
      board[y][x] = 1
      if (checkWin(board, x, y, 1)) {
        board[y][x] = 0
        return { x, y }
      }
      board[y][x] = 0
    }
  }

  // 2. 阻挡玩家三连
  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      if (board[y][x] !== 0) continue
      board[y][x] = 1
      if (isNInRow(board, x, y, 1, 3)) {
        board[y][x] = 0
        return { x, y }
      }
      board[y][x] = 0
    }
  }

  // 3. 优先在玩家棋子附近落子
  const candidates: { x: number; y: number }[] = []
  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      if (board[y][x] !== 0) continue
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
            board[ny][nx] === 1
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

  // 4. 自己三连/四连
  const selfPriority: { x: number; y: number }[] = []
  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      if (board[y][x] !== 0) continue
      board[y][x] = 2
      if (checkWin(board, x, y, 2)) {
        board[y][x] = 0
        return { x, y }
      }
      if (isNInRow(board, x, y, 2, 4) || isNInRow(board, x, y, 2, 3)) {
        selfPriority.push({ x, y })
      }
      board[y][x] = 0
    }
  }
  if (selfPriority.length > 0) {
    return selfPriority[Math.floor(Math.random() * selfPriority.length)]
  }

  // 5. 随机落子
  const emptySpaces: { x: number; y: number }[] = []
  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      if (board[y][x] === 0) {
        emptySpaces.push({ x, y })
      }
    }
  }
  if (emptySpaces.length === 0) return null
  return emptySpaces[Math.floor(Math.random() * emptySpaces.length)]
}
