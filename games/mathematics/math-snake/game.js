import { chooseGrid, createGame, queueTurn, relayout, step } from './engine.js';

const SUBJECT = 'mathematics';
const GAME_ID = 'math-snake';
const LEVEL = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};
const REASON = {
  wall: 'You hit a wall',
  self: 'You hit yourself',
};
const KEYS = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  a: 'left',
  s: 'down',
  d: 'right',
  W: 'up',
  A: 'left',
  S: 'down',
  D: 'right',
};

const menu = document.getElementById('menu');
const play = document.getElementById('play');
const over = document.getElementById('over');
const wrap = document.getElementById('board-wrap');
const canvas = document.getElementById('board');
const context = canvas.getContext('2d');

let session = null;
let view = { cols: 8, rows: 11, cell: 42 };
let timer = 0;
let starting = false;
let report = null;
let swipe = null;

function rememberScore() {
  if (!session) return;
  report = {
    type: 'playlab:score',
    subject: SUBJECT,
    gameId: GAME_ID,
    score: session.score,
    metadata: {
      trackId: LEVEL[session.difficulty],
      difficulty: session.difficulty,
      correct: session.correct,
      wrong: session.wrong,
      maxCombo: session.maxCombo,
    },
  };
}

function submitScore() {
  rememberScore();
  if (!report || window.parent === window) return;
  window.parent.postMessage(report, '*');
}

function stopLoop() {
  window.clearTimeout(timer);
}

function startLoop() {
  stopLoop();
  const beat = () => {
    if (!session || session.status !== 'playing') return;
    step(session);
    paint();
    if (session.status !== 'playing') {
      showOver();
      submitScore();
      return;
    }
    timer = window.setTimeout(beat, session.interval);
  };
  timer = window.setTimeout(beat, session.interval);
}

function showMenu() {
  stopLoop();
  starting = false;
  session = null;
  over.hidden = true;
  play.hidden = true;
  menu.hidden = false;
}

function showOver() {
  if (!session) return;
  document.getElementById('over-level').textContent = LEVEL[session.difficulty];
  document.getElementById('over-reason').textContent = REASON[session.overReason] || REASON.wall;
  document.getElementById('over-score').textContent = String(session.score);
  document.getElementById('over-correct').textContent = String(session.correct);
  document.getElementById('over-wrong').textContent = String(session.wrong);
  document.getElementById('over-combo').textContent = String(session.maxCombo);
  over.hidden = false;
}

function start(difficulty) {
  if (starting) return;
  starting = true;
  stopLoop();
  menu.hidden = true;
  play.hidden = false;
  over.hidden = true;
  const begin = () => {
    if (wrap.clientWidth < 80 || wrap.clientHeight < 80) {
      requestAnimationFrame(begin);
      return;
    }
    const grid = chooseGrid(wrap.clientWidth, wrap.clientHeight, window.innerWidth);
    session = createGame({ difficulty, cols: grid.cols, rows: grid.rows });
    view = grid;
    starting = false;
    paint();
    startLoop();
    try {
      play.focus({ preventScroll: true });
    } catch {
      play.focus();
    }
  };
  requestAnimationFrame(begin);
}

function syncBoard() {
  if (!session || starting) return;
  if (wrap.clientWidth < 80 || wrap.clientHeight < 80) return;
  const grid = chooseGrid(wrap.clientWidth, wrap.clientHeight, window.innerWidth);
  if (grid.cols !== session.cols || grid.rows !== session.rows) {
    relayout(session, grid.cols, grid.rows);
  }
  view = grid;
  paint();
}

function paint() {
  if (!session) return;
  const cell = view.cell;
  const width = session.cols * cell;
  const height = session.rows * cell;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const pixelWidth = Math.round(width * dpr);
  const pixelHeight = Math.round(height * dpr);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawBoard(width, height, cell);
  syncHud();
}

function syncHud() {
  const level = document.getElementById('level');
  level.textContent = LEVEL[session.difficulty];
  level.className = `level ${session.difficulty}`;
  document.getElementById('question').textContent = session.question.text;
  const feedback = document.getElementById('feedback');
  feedback.textContent = session.feedback.text;
  feedback.className = `feedback ${session.feedback.kind}`;
  document.getElementById('score').textContent = String(session.score);
  const combo = document.getElementById('combo');
  combo.textContent = String(session.combo);
  combo.parentElement.classList.toggle('hot', session.combo >= 2);
  const pass = document.getElementById('pass');
  if (session.passCharges > 0) {
    pass.textContent = `Wall pass × ${session.passCharges}`;
    pass.classList.add('on');
  } else {
    pass.textContent = 'Wall pass off';
    pass.classList.remove('on');
  }
  wrap.classList.toggle('penalty', session.penaltyMoves > 0);
  wrap.classList.toggle('passing', session.passCharges > 0);
}

function drawBoard(width, height, cell) {
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#16324a';
  context.fillRect(0, 0, width, height);
  for (let y = 0; y < session.rows; y += 1) {
    for (let x = 0; x < session.cols; x += 1) {
      context.fillStyle = (x + y) % 2 === 0 ? '#18364f' : '#143049';
      roundRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2, 6);
      context.fill();
    }
  }

  if (session.penaltyMoves > 0) {
    context.fillStyle = 'rgba(226, 61, 61, 0.16)';
    context.fillRect(0, 0, width, height);
  }

  for (const bubble of session.bubbles) drawBubble(bubble.x, bubble.y, cell, String(bubble.value));
  if (session.power) drawPower(session.power.x, session.power.y, cell);

  session.snake.forEach((segment, index) => {
    drawSegment(segment.x, segment.y, cell, index === 0);
  });
}

function drawSegment(x, y, cell, head) {
  const pad = head ? cell * 0.1 : cell * 0.16;
  const penalty = session.penaltyMoves > 0;
  context.fillStyle = head ? (penalty ? '#ffd0d0' : '#d8ffe8') : penalty ? '#ff8d8d' : '#3ddc97';
  roundRect(x * cell + pad, y * cell + pad, cell - pad * 2, cell - pad * 2, cell * 0.28);
  context.fill();
  if (!head) return;
  const cx = x * cell + cell / 2;
  const cy = y * cell + cell / 2;
  const fx = session.direction === 'left' ? -1 : session.direction === 'right' ? 1 : 0;
  const fy = session.direction === 'up' ? -1 : session.direction === 'down' ? 1 : 0;
  const side = cell * 0.13;
  const forward = cell * 0.08;
  context.fillStyle = '#17324a';
  context.beginPath();
  context.arc(cx + fx * forward - fy * side, cy + fy * forward + fx * side, Math.max(2, cell * 0.06), 0, Math.PI * 2);
  context.arc(cx + fx * forward + fy * side, cy + fy * forward - fx * side, Math.max(2, cell * 0.06), 0, Math.PI * 2);
  context.fill();
  if (session.passCharges > 0) {
    context.strokeStyle = '#f0b429';
    context.lineWidth = Math.max(2, cell * 0.06);
    roundRect(x * cell + pad - 1, y * cell + pad - 1, cell - pad * 2 + 2, cell - pad * 2 + 2, cell * 0.3);
    context.stroke();
  }
}

function drawBubble(x, y, cell, label) {
  const cx = x * cell + cell / 2;
  const cy = y * cell + cell / 2;
  const radius = cell * 0.43;
  context.beginPath();
  context.arc(cx, cy + cell * 0.04, radius * 0.92, 0, Math.PI * 2);
  context.fillStyle = 'rgba(8, 20, 32, 0.28)';
  context.fill();
  const gradient = context.createRadialGradient(cx - radius * 0.35, cy - radius * 0.4, radius * 0.2, cx, cy, radius);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(1, '#d7efff');
  context.beginPath();
  context.arc(cx, cy, radius, 0, Math.PI * 2);
  context.fillStyle = gradient;
  context.fill();
  context.lineWidth = Math.max(2, cell * 0.045);
  context.strokeStyle = '#7ec8ff';
  context.stroke();
  fitText(label, cell * 0.58, radius * 1.8);
  context.fillStyle = '#10283f';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(label, cx, cy + cell * 0.02);
}

function drawPower(x, y, cell) {
  const cx = x * cell + cell / 2;
  const cy = y * cell + cell / 2;
  const radius = cell * 0.36;
  context.beginPath();
  context.moveTo(cx, cy - radius);
  context.lineTo(cx + radius, cy);
  context.lineTo(cx, cy + radius);
  context.lineTo(cx - radius, cy);
  context.closePath();
  context.fillStyle = '#ffbf3c';
  context.fill();
  context.lineWidth = Math.max(2, cell * 0.04);
  context.strokeStyle = '#fff6d8';
  context.stroke();
  fitText('P', cell * 0.42, radius * 1.2);
  context.fillStyle = '#5c3b00';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('P', cx, cy + 1);
}

function fitText(label, start, maxWidth) {
  let size = Math.floor(start);
  context.font = `800 ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  while (size > 11 && context.measureText(label).width > maxWidth) {
    size -= 1;
    context.font = `800 ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  }
}

function roundRect(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

document.querySelectorAll('.choice').forEach((button) => {
  button.addEventListener('click', () => start(button.dataset.difficulty));
});

document.getElementById('again').addEventListener('click', () => {
  if (!session) return;
  const difficulty = session.difficulty;
  session = null;
  start(difficulty);
});

document.getElementById('change').addEventListener('click', showMenu);

window.addEventListener('keydown', (event) => {
  const direction = KEYS[event.key];
  if (!direction || !session) return;
  event.preventDefault();
  queueTurn(session, direction);
});

document.addEventListener(
  'touchstart',
  (event) => {
    if (event.touches.length !== 1) {
      swipe = null;
      return;
    }
    const touch = event.touches[0];
    swipe = { x: touch.clientX, y: touch.clientY };
  },
  { passive: true },
);

document.addEventListener(
  'touchmove',
  (event) => {
    if (!play.hidden && over.hidden) event.preventDefault();
  },
  { passive: false },
);

document.addEventListener('touchend', (event) => {
  if (!swipe || !session || session.status !== 'playing') {
    swipe = null;
    return;
  }
  const touch = event.changedTouches[0];
  const dx = touch.clientX - swipe.x;
  const dy = touch.clientY - swipe.y;
  swipe = null;
  if (Math.hypot(dx, dy) < 24) return;
  if (Math.abs(dx) > Math.abs(dy)) queueTurn(session, dx > 0 ? 'right' : 'left');
  else queueTurn(session, dy > 0 ? 'down' : 'up');
});

for (const eventName of ['gesturestart', 'gesturechange', 'gestureend']) {
  document.addEventListener(eventName, (event) => event.preventDefault());
}

window.addEventListener('resize', () => {
  requestAnimationFrame(syncBoard);
});
window.visualViewport?.addEventListener('resize', () => {
  requestAnimationFrame(syncBoard);
});
if (typeof ResizeObserver === 'function') {
  const observer = new ResizeObserver(() => syncBoard());
  observer.observe(wrap);
}

window.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'playlab:requestScore') return;
  submitScore();
});
window.addEventListener('pagehide', submitScore);
window.addEventListener('beforeunload', submitScore);
