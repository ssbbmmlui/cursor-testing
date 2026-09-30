import { generateQuestion } from './questions.js';

export const START_INTERVAL = 180;
export const MIN_INTERVAL = 80;
export const SPEED_STEP = 10;

const DELTA = {
  left: [-1, 0],
  right: [1, 0],
  up: [0, -1],
  down: [0, 1],
};

const OPPOSITE = {
  left: 'right',
  right: 'left',
  up: 'down',
  down: 'up',
};

function shuffle(items, rng) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1));
    const item = items[index];
    items[index] = items[swap];
    items[swap] = item;
  }
  return items;
}

function cellKey(cell) {
  return `${cell.x},${cell.y}`;
}

function inside(cell, cols, rows) {
  return cell.x >= 0 && cell.y >= 0 && cell.x < cols && cell.y < rows;
}

export function pointsForCombo(combo) {
  return 10 + (combo - 1) * 5;
}

export function pickWrongValues(answer, rng) {
  const offsets = [];
  for (let offset = -10; offset <= 10; offset += 1) {
    if (offset !== 0) offsets.push(offset);
  }
  shuffle(offsets, rng);
  return offsets.slice(0, 8).map((offset) => answer + offset);
}

function emptyCells(state) {
  const taken = new Set(state.snake.map(cellKey));
  if (state.power) taken.add(cellKey(state.power));
  const cells = [];
  for (let y = 0; y < state.rows; y += 1) {
    for (let x = 0; x < state.cols; x += 1) {
      if (!taken.has(`${x},${y}`)) cells.push({ x, y });
    }
  }
  return cells;
}

export function spawnRound(state, rng) {
  const question = generateQuestion(state.difficulty, rng);
  const values = [question.answer, ...pickWrongValues(question.answer, rng)];
  const cells = shuffle(emptyCells(state), rng);
  const bubbles = [];
  for (let index = 0; index < values.length && index < cells.length; index += 1) {
    bubbles.push({ x: cells[index].x, y: cells[index].y, value: values[index] });
  }
  state.question = question;
  state.bubbles = bubbles;
  if (!state.power && state.passCharges <= 0 && cells.length > bubbles.length && rng() < 0.15) {
    const rest = cells.length - bubbles.length;
    const cell = cells[bubbles.length + Math.floor(rng() * rest)];
    state.power = { x: cell.x, y: cell.y };
  }
}

export function createGame({ difficulty, cols, rows, rng = Math.random }) {
  const state = {
    difficulty,
    cols,
    rows,
    snake: [{ x: Math.floor(cols / 2), y: Math.floor(rows / 2) }],
    direction: 'right',
    pending: null,
    score: 0,
    combo: 0,
    maxCombo: 0,
    correct: 0,
    wrong: 0,
    interval: START_INTERVAL,
    question: null,
    bubbles: [],
    power: null,
    passCharges: 0,
    feedback: { kind: 'info', text: 'Eat the bubble that equals the answer.' },
    penaltyMoves: 0,
    status: 'playing',
    overReason: null,
  };
  spawnRound(state, rng);
  return state;
}

export function queueTurn(state, direction) {
  if (!state || state.status !== 'playing') return;
  if (!DELTA[direction]) return;
  if (state.pending) return;
  if (direction === state.direction || direction === OPPOSITE[state.direction]) return;
  state.pending = direction;
}

function wrapCoord(value, size) {
  if (value < 0) return size - 1;
  if (value >= size) return 0;
  return value;
}

function neighborFree(x, y, cols, rows, used) {
  const steps = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  for (const [dx, dy] of steps) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
    if (used.has(`${nx},${ny}`)) continue;
    return { x: nx, y: ny };
  }
  return null;
}

function rebuildSnake(cols, rows, length, direction) {
  const count = Math.max(1, Math.min(length, cols * rows));
  const [dx, dy] = DELTA[direction];
  let hx = Math.min(Math.max(Math.floor(cols / 2), 0), cols - 1);
  let hy = Math.min(Math.max(Math.floor(rows / 2), 0), rows - 1);
  if (cols > 1 && (hx + dx < 0 || hx + dx >= cols)) hx = dx > 0 ? cols - 2 : 1;
  if (rows > 1 && (hy + dy < 0 || hy + dy >= rows)) hy = dy > 0 ? rows - 2 : 1;

  const snake = [{ x: hx, y: hy }];
  const used = new Set([`${hx},${hy}`]);
  const forwardInBounds = hx + dx >= 0 && hy + dy >= 0 && hx + dx < cols && hy + dy < rows;
  const forwardKey = `${hx + dx},${hy + dy}`;
  if (forwardInBounds) used.add(forwardKey);

  let cx = hx;
  let cy = hy;
  const [bx, by] = DELTA[OPPOSITE[direction]];
  let releasedForward = false;
  while (snake.length < count) {
    let spot = null;
    const nx = cx + bx;
    const ny = cy + by;
    if (nx >= 0 && ny >= 0 && nx < cols && ny < rows && !used.has(`${nx},${ny}`)) {
      spot = { x: nx, y: ny };
    } else {
      spot = neighborFree(cx, cy, cols, rows, used);
      if (!spot) {
        for (let index = snake.length - 1; index >= 0 && !spot; index -= 1) {
          spot = neighborFree(snake[index].x, snake[index].y, cols, rows, used);
        }
      }
    }
    if (!spot && forwardInBounds && !releasedForward) {
      used.delete(forwardKey);
      releasedForward = true;
      continue;
    }
    if (!spot) break;
    snake.push(spot);
    used.add(`${spot.x},${spot.y}`);
    cx = spot.x;
    cy = spot.y;
  }
  return { snake, direction };
}

function fits(cells, cols, rows) {
  const seen = new Set();
  for (const cell of cells) {
    if (!inside(cell, cols, rows)) return false;
    const key = cellKey(cell);
    if (seen.has(key)) return false;
    seen.add(key);
  }
  return true;
}

function shiftInto(cells, cols, rows) {
  const minX = Math.min(...cells.map((cell) => cell.x));
  const maxX = Math.max(...cells.map((cell) => cell.x));
  const minY = Math.min(...cells.map((cell) => cell.y));
  const maxY = Math.max(...cells.map((cell) => cell.y));
  if (maxX - minX + 1 > cols || maxY - minY + 1 > rows) return null;
  let dx = 0;
  let dy = 0;
  if (minX < 0) dx = -minX;
  if (maxX + dx > cols - 1) dx += cols - 1 - (maxX + dx);
  if (minY < 0) dy = -minY;
  if (maxY + dy > rows - 1) dy += rows - 1 - (maxY + dy);
  const moved = cells.map((cell) => ({ x: cell.x + dx, y: cell.y + dy }));
  return fits(moved, cols, rows) ? moved : null;
}

function freeCells(cols, rows, taken, rng) {
  const cells = [];
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      if (!taken.has(`${x},${y}`)) cells.push({ x, y });
    }
  }
  return shuffle(cells, rng);
}

/** Keep the round, but fit the snake, bubbles, and P onto the new grid. */
export function relayout(state, cols, rows, rng = Math.random) {
  if (cols === state.cols && rows === state.rows) return;
  const oldSnake = state.snake.map((cell) => ({ x: cell.x, y: cell.y }));
  const oldBubbles = state.bubbles.map((bubble) => ({ ...bubble }));
  const oldPower = state.power ? { x: state.power.x, y: state.power.y } : null;
  const length = oldSnake.length;
  const direction = state.direction;

  state.cols = cols;
  state.rows = rows;

  if (fits(oldSnake, cols, rows)) {
    state.snake = oldSnake;
  } else {
    const shifted = shiftInto(oldSnake, cols, rows);
    if (shifted) {
      state.snake = shifted;
    } else {
      const rebuilt = rebuildSnake(cols, rows, length, direction);
      state.snake = rebuilt.snake;
      state.direction = rebuilt.direction;
      if (
        state.pending &&
        (state.pending === state.direction || state.pending === OPPOSITE[state.direction])
      ) {
        state.pending = null;
      }
    }
  }

  const taken = new Set(state.snake.map(cellKey));
  const kept = [];
  const displaced = [];
  for (const bubble of oldBubbles) {
    const key = cellKey(bubble);
    if (inside(bubble, cols, rows) && !taken.has(key)) {
      kept.push(bubble);
      taken.add(key);
    } else {
      displaced.push(bubble);
    }
  }
  displaced.sort((a, b) => {
    const aCorrect = a.value === state.question.answer ? 0 : 1;
    const bCorrect = b.value === state.question.answer ? 0 : 1;
    return aCorrect - bCorrect;
  });
  const spots = freeCells(cols, rows, taken, rng);
  for (let index = 0; index < displaced.length && index < spots.length; index += 1) {
    const spot = spots[index];
    kept.push({ x: spot.x, y: spot.y, value: displaced[index].value });
    taken.add(cellKey(spot));
  }
  state.bubbles = kept;

  if (oldPower && inside(oldPower, cols, rows) && !taken.has(cellKey(oldPower))) {
    state.power = oldPower;
  } else if (oldPower) {
    const powerSpots = freeCells(cols, rows, taken, rng);
    state.power = powerSpots.length > 0 ? { x: powerSpots[0].x, y: powerSpots[0].y } : null;
  } else {
    state.power = null;
  }
}

/**
 * Move one step.
 * Out-of-bounds wraps only while wall pass is active.
 * Self overlap is tested before the tail moves, so the current tail cell counts.
 * A cell with P is resolved as P only, even if a bubble is there too.
 */
export function step(state, rng = Math.random) {
  if (state.status !== 'playing') return state;
  if (state.pending) {
    state.direction = state.pending;
    state.pending = null;
  }

  const head = state.snake[0];
  const [dx, dy] = DELTA[state.direction];
  let x = head.x + dx;
  let y = head.y + dy;
  if (x < 0 || y < 0 || x >= state.cols || y >= state.rows) {
    if (state.passCharges > 0) {
      x = wrapCoord(x, state.cols);
      y = wrapCoord(y, state.rows);
      state.passCharges -= 1;
    } else {
      state.status = 'over';
      state.overReason = 'wall';
      return state;
    }
  }

  if (state.snake.some((cell) => cell.x === x && cell.y === y)) {
    state.status = 'over';
    state.overReason = 'self';
    return state;
  }

  let refreshedPenalty = false;
  if (state.power && state.power.x === x && state.power.y === y) {
    state.snake.unshift({ x, y });
    state.snake.pop();
    state.power = null;
    state.passCharges = 3;
  } else {
    const index = state.bubbles.findIndex((bubble) => bubble.x === x && bubble.y === y);
    if (index >= 0) {
      const bubble = state.bubbles[index];
      const prompt = state.question.text;
      const answer = state.question.answer;
      state.snake.unshift({ x, y });
      if (bubble.value === answer) {
        state.combo += 1;
        if (state.combo > state.maxCombo) state.maxCombo = state.combo;
        const gained = pointsForCombo(state.combo);
        state.score += gained;
        state.correct += 1;
        state.feedback = { kind: 'correct', text: `+${gained} · ${prompt} = ${answer}` };
      } else {
        state.combo = 0;
        state.score = Math.max(0, state.score - 5);
        state.wrong += 1;
        state.penaltyMoves = 10;
        refreshedPenalty = true;
        state.feedback = {
          kind: 'wrong',
          text: `-5 · Correct answer: ${answer}. You ate ${bubble.value}.`,
        };
      }
      if (state.correct > 0 && state.correct % 5 === 0) {
        state.interval = Math.max(MIN_INTERVAL, state.interval - SPEED_STEP);
      }
      spawnRound(state, rng);
    } else {
      state.snake.unshift({ x, y });
      state.snake.pop();
    }
  }

  if (!refreshedPenalty && state.penaltyMoves > 0) state.penaltyMoves -= 1;
  return state;
}

export function chooseGrid(boardWidth, boardHeight, viewportWidth) {
  const width = Math.max(0, Math.floor(Number(boardWidth) || 0));
  const height = Math.max(0, Math.floor(Number(boardHeight) || 0));
  const view = Number(viewportWidth) || width;
  const narrow = view < 720 && height > width;
  const maxCols = narrow ? 10 : 22;
  const maxRows = narrow ? 18 : 16;

  if (width < 40 || height < 40) {
    return { cols: 6, rows: narrow ? 8 : 6, cell: 8 };
  }

  let best = null;
  for (let cell = 84; cell >= 34; cell -= 1) {
    let cols = Math.min(maxCols, Math.floor(width / cell));
    let rows = Math.min(maxRows, Math.floor(height / cell));
    if (cols < 6 || rows < 8) continue;
    if (narrow && cols >= rows) {
      cols = rows - 1;
      if (cols < 6 || cols * cell > width) continue;
    }
    if (!narrow && width > height && cols < rows) {
      cols = Math.min(maxCols, Math.floor(width / cell));
    }
    if (cols * cell > width || rows * cell > height) continue;
    if (narrow && rows <= cols) continue;
    if (cols * rows < 64) continue;
    const score = cell * 10000 + cols * rows;
    if (!best || score > best.score) best = { cols, rows, cell, score };
  }
  if (best) return { cols: best.cols, rows: best.rows, cell: best.cell };

  let cols = Math.max(4, Math.min(maxCols, Math.floor(width / 34)));
  let rows = Math.max(5, Math.min(maxRows, Math.floor(height / 34)));
  if (narrow && cols >= rows) cols = Math.max(4, rows - 1);
  const cell = Math.max(1, Math.floor(Math.min(width / cols, height / rows)));
  return { cols, rows, cell };
}
