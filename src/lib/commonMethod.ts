

export function findAiMove(
  board: number[][],
  boardSize: number,
  checkWin: (board: number[][], x: number, y: number, who: number) => boolean,
  isNInRow: (board: number[][], x: number, y: number, who: number, n: number) => boolean
): { x: number; y: number } | null {
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

  // 4. 随机落子
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

