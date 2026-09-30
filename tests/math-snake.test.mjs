import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DIVISORS,
  QUOTIENTS,
  answerOf,
  divisorsFor,
  fallbackQuestion,
  formatQuestion,
  generateQuestion,
} from '../public/games/mathematics/math-snake/questions.js';
import {
  MIN_INTERVAL,
  START_INTERVAL,
  chooseGrid,
  intervalForCorrect,
  createGame,
  pickWrongValues,
  pointsForCombo,
  queueTurn,
  relayout,
  spawnRound,
  step,
} from '../public/games/mathematics/math-snake/engine.js';

function mulberry32(seed) {
  let value = seed >>> 0;
  return function rng() {
    value = (value + 0x6d2b79f5) | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function assertQuestion(question, difficulty) {
  assert.equal(question.text, formatQuestion(question));
  assert.equal(question.answer, answerOf(question));
  assert.equal(Number.isInteger(question.answer), true);
  assert.ok(Math.abs(question.answer) <= 99);
  assert.equal(question.text.includes('×'), false);
  assert.equal(question.text.includes('*'), false);
  assert.equal(question.text.includes('/'), false);
  assert.match(question.text, new RegExp(` ${question.op1.replace('+', '\\+')} `));

  const raw = String(question.a);
  if (question.op2 == null) {
    assert.equal(question.text.startsWith(`${raw} `), true);
    assert.equal(question.text.includes('['), false);
  } else {
    const open = question.b < 0 ? '[' : '(';
    const close = question.b < 0 ? ']' : ')';
    assert.equal(question.text.startsWith(`${open}${raw} `), true);
    assert.equal(question.text.includes(close), true);
    assert.match(question.text, new RegExp(` ${question.op2.replace('+', '\\+')} `));
  }
  if (question.b < 0) assert.equal(question.text.includes(`(${question.b})`), true);
  if (question.c != null && question.c < 0) assert.equal(question.text.includes(`(${question.c})`), true);

  if (difficulty === 'easy') {
    assert.ok(question.op1 === '+' || question.op1 === '-');
    assert.equal(question.op2, null);
    assert.ok(question.a >= -10 && question.a <= 10);
    assert.ok(question.b >= -10 && question.b <= 10);
    assert.notEqual(question.b, 0);
    assert.ok(question.a < 0 || question.b < 0);
  }

  if (difficulty === 'medium') {
    assert.ok(['+', '-', 'x'].includes(question.op1));
    assert.equal(question.op2, null);
    if (question.op1 === 'x') {
      assert.ok(question.a >= -10 && question.a <= 10);
      assert.ok(question.b >= -5 && question.b <= 5);
      assert.ok(!(question.a === 0 && question.b === 0));
    } else {
      assert.ok(question.a >= -10 && question.a <= 10);
      assert.ok(question.b >= -10 && question.b <= 10);
      assert.notEqual(question.b, 0);
      assert.ok(question.a < 0 || question.b < 0);
    }
  }

  if (difficulty === 'hard') {
    assert.ok(['+', '-', 'x', '÷'].includes(question.op1));
    assert.ok(['+', '-', 'x', '÷'].includes(question.op2));
    assert.ok(!(question.a >= 0 && question.b >= 0 && question.b !== 0));
    if (question.op1 === '÷') {
      assert.ok(DIVISORS.includes(question.b));
      assert.ok(question.a % question.b === 0);
      assert.ok(QUOTIENTS.includes(question.a / question.b));
    } else {
      assert.ok(question.a >= -10 && question.a <= 10);
      assert.ok(question.b >= -10 && question.b <= 10);
    }
    assert.ok(question.c >= -10 && question.c <= 10);
    if (question.op2 === '+' || question.op2 === '-') assert.notEqual(question.c, 0);
    if (question.op2 === '÷') {
      assert.notEqual(question.c, 0);
      const mid = answerOf({ ...question, op2: null, c: null });
      assert.ok(mid % question.c === 0);
      assert.ok(Math.abs(mid / question.c) <= 99);
    }
  }
}

function approach(state, cell) {
  if (cell.x > 0) {
    state.snake = [{ x: cell.x - 1, y: cell.y }];
    state.direction = 'right';
  } else if (cell.x < state.cols - 1) {
    state.snake = [{ x: cell.x + 1, y: cell.y }];
    state.direction = 'left';
  } else if (cell.y > 0) {
    state.snake = [{ x: cell.x, y: cell.y - 1 }];
    state.direction = 'down';
  } else {
    state.snake = [{ x: cell.x, y: cell.y + 1 }];
    state.direction = 'up';
  }
  state.pending = null;
}

function eatWhere(state, predicate, rng) {
  const bubble = state.bubbles.find(predicate);
  assert.ok(bubble);
  const eaten = bubble.value;
  const prompt = state.question.text;
  const answer = state.question.answer;
  approach(state, bubble);
  step(state, rng);
  return { eaten, prompt, answer };
}

describe('question formatting', () => {
  it('matches the signed-number and hard bracket examples', () => {
    assert.equal(formatQuestion({ a: -4, op1: '+', b: -3, op2: null, c: null }), '-4 + (-3)');
    assert.equal(formatQuestion({ a: -3, op1: '+', b: -4, op2: 'x', c: 2 }), '[-3 + (-4)] x 2');
    assert.equal(formatQuestion({ a: -3, op1: '+', b: 4, op2: 'x', c: 2 }), '(-3 + 4) x 2');
    assert.equal(formatQuestion({ a: 8, op1: '÷', b: -2, op2: '+', c: 3 }), '[8 ÷ (-2)] + 3');
    assert.equal(formatQuestion({ a: -8, op1: '÷', b: 2, op2: 'x', c: -3 }), '(-8 ÷ 2) x (-3)');
    assert.equal(formatQuestion({ a: 0, op1: 'x', b: -5, op2: null, c: null }), '0 x (-5)');
    assert.equal(formatQuestion({ a: 4, op1: 'x', b: 0, op2: null, c: null }), '4 x 0');
    assert.equal(formatQuestion({ a: -3, op1: '+', b: 0, op2: 'x', c: 2 }), '(-3 + 0) x 2');
  });

  it('uses the temporary divisors when no exact divisor fits', () => {
    assert.deepEqual(divisorsFor(1000), []);
    assert.ok(divisorsFor(100).includes(2));
    assert.equal(divisorsFor(100).includes(1), false);
    assert.equal(divisorsFor(0).length, 20);
  });
});

describe('question ranges', () => {
  for (const difficulty of ['easy', 'medium', 'hard']) {
    it(`keeps ${difficulty} inside the rules`, () => {
      const rng = mulberry32(difficulty === 'easy' ? 11 : difficulty === 'medium' ? 29 : 47);
      const seen = new Set();
      for (let index = 0; index < 2500; index += 1) {
        const question = generateQuestion(difficulty, rng);
        assertQuestion(question, difficulty);
        seen.add(question.text);
      }
      assertQuestion(fallbackQuestion(difficulty), difficulty);
      assert.ok(seen.size > 30);
    });
  }

  it('gives medium operations an even chance and keeps useful zeros', () => {
    const rng = mulberry32(99);
    const counts = { '+': 0, '-': 0, x: 0 };
    let zeroFirst = 0;
    let zeroSecond = 0;
    let positiveProduct = 0;
    const total = 6000;
    for (let index = 0; index < total; index += 1) {
      const question = generateQuestion('medium', rng);
      counts[question.op1] += 1;
      if (question.op1 === 'x' && question.a === 0 && question.b === 0) {
        assert.fail('0 x 0 should be redrawn');
      }
      if (question.op1 === 'x' && question.a === 0) zeroFirst += 1;
      if (question.op1 === 'x' && question.b === 0) zeroSecond += 1;
      if (question.op1 === 'x' && question.a > 0 && question.b > 0) positiveProduct += 1;
    }
    for (const count of Object.values(counts)) {
      assert.ok(count > total * 0.28 && count < total * 0.39, JSON.stringify(counts));
    }
    assert.ok(zeroFirst > 0);
    assert.ok(zeroSecond > 0);
    assert.ok(positiveProduct > 0);
  });

  it('uses every hard operation, including exact division', () => {
    const rng = mulberry32(123);
    const first = new Set();
    const second = new Set();
    let divisions = 0;
    for (let index = 0; index < 4000; index += 1) {
      const question = generateQuestion('hard', rng);
      first.add(question.op1);
      second.add(question.op2);
      if (question.op1 === '÷') divisions += 1;
    }
    assert.deepEqual([...first].sort(), ['+', '-', 'x', '÷'].sort());
    assert.deepEqual([...second].sort(), ['+', '-', 'x', '÷'].sort());
    assert.ok(divisions > 200);
  });
});

describe('scoring and movement', () => {
  it('scores combos, and speeds up only as correct answers add up', () => {
    const rng = mulberry32(7);
    const state = createGame({ difficulty: 'easy', cols: 16, rows: 12, rng });
    assert.equal(state.interval, START_INTERVAL);
    assert.equal(pointsForCombo(1), 10);
    assert.equal(pointsForCombo(2), 15);
    assert.equal(pointsForCombo(3), 20);
    assert.equal(pointsForCombo(4), 25);

    let expected = 0;
    let previous = START_INTERVAL;
    for (let combo = 1; combo <= 4; combo += 1) {
      const gained = pointsForCombo(combo);
      const result = eatWhere(state, (bubble) => bubble.value === state.question.answer, rng);
      expected += gained;
      assert.equal(state.score, expected);
      assert.equal(state.combo, combo);
      assert.equal(state.maxCombo, combo);
      assert.equal(state.correct, combo);
      assert.equal(state.interval, intervalForCorrect(combo));
      assert.ok(state.interval < previous);
      previous = state.interval;
      assert.match(state.feedback.text, new RegExp(`^\\+${gained} · `));
      assert.ok(state.feedback.text.includes(result.prompt));
      assert.ok(state.feedback.text.includes(`= ${result.answer}`));
    }

    const wrong = eatWhere(state, (bubble) => bubble.value !== state.question.answer, rng);
    assert.equal(state.score, expected - 5);
    assert.equal(state.combo, 0);
    assert.equal(state.maxCombo, 4);
    assert.equal(state.wrong, 1);
    assert.equal(state.penaltyMoves, 10);
    assert.ok(state.feedback.text.includes(`Correct answer: ${wrong.answer}`));
    assert.ok(state.feedback.text.includes(`You ate ${wrong.eaten}`));

    state.score = 3;
    eatWhere(state, (bubble) => bubble.value !== state.question.answer, rng);
    assert.equal(state.score, 0);
    eatWhere(state, (bubble) => bubble.value !== state.question.answer, rng);
    assert.equal(state.score, 0);

    const held = state.interval;
    assert.equal(held, intervalForCorrect(4));
    eatWhere(state, (bubble) => bubble.value !== state.question.answer, rng);
    assert.equal(state.interval, held);
    eatWhere(state, (bubble) => bubble.value !== state.question.answer, rng);
    assert.equal(state.interval, held);

    while (state.interval > MIN_INTERVAL && state.correct < 80) {
      eatWhere(state, (bubble) => bubble.value === state.question.answer, rng);
    }
    assert.equal(state.interval, MIN_INTERVAL);
    const floor = state.interval;
    eatWhere(state, (bubble) => bubble.value === state.question.answer, rng);
    assert.equal(state.interval, floor);
  });

  it('grows for a right or wrong bubble and leaves the tail in place', () => {
    const rng = mulberry32(8);
    const state = createGame({ difficulty: 'easy', cols: 14, rows: 12, rng });
    const correct = state.bubbles.find((bubble) => bubble.value === state.question.answer);
    correct.x = 6;
    correct.y = 5;
    state.bubbles = [correct];
    state.power = null;
    state.snake = [
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 },
    ];
    state.direction = 'right';
    state.pending = null;
    step(state, rng);
    assert.equal(state.snake.length, 4);
    assert.deepEqual(state.snake[0], { x: 6, y: 5 });
    assert.deepEqual(state.snake[3], { x: 3, y: 5 });

    const wrongBubble = state.bubbles.find((bubble) => bubble.value !== state.question.answer);
    wrongBubble.x = 8;
    wrongBubble.y = 5;
    state.snake = [
      { x: 7, y: 5 },
      { x: 6, y: 5 },
    ];
    state.direction = 'right';
    state.pending = null;
    state.power = null;
    state.bubbles = [wrongBubble];
    step(state, rng);
    assert.equal(state.snake.length, 3);
    assert.equal(state.combo, 0);
  });

  it('counts the wrong-answer warning for ten moves', () => {
    const rng = mulberry32(9);
    const state = createGame({ difficulty: 'easy', cols: 20, rows: 12, rng });
    eatWhere(state, (bubble) => bubble.value !== state.question.answer, rng);
    assert.equal(state.penaltyMoves, 10);
    state.penaltyMoves = 2;
    eatWhere(state, (bubble) => bubble.value !== state.question.answer, rng);
    assert.equal(state.penaltyMoves, 10);
    state.bubbles = [];
    state.power = null;
    state.snake = [{ x: 2, y: 5 }];
    state.direction = 'right';
    state.pending = null;
    for (let index = 0; index < 9; index += 1) step(state, rng);
    assert.equal(state.penaltyMoves, 1);
    step(state, rng);
    assert.equal(state.penaltyMoves, 0);
  });

  it('accepts one turn per step and never reverses immediately', () => {
    const rng = mulberry32(4);
    const state = createGame({ difficulty: 'easy', cols: 12, rows: 12, rng });
    state.bubbles = [];
    state.power = null;
    state.snake = [{ x: 5, y: 5 }];
    state.direction = 'right';
    state.pending = null;
    queueTurn(state, 'left');
    assert.equal(state.pending, null);
    queueTurn(state, 'up');
    queueTurn(state, 'down');
    assert.equal(state.pending, 'up');
    step(state, rng);
    assert.equal(state.direction, 'up');
    assert.deepEqual(state.snake[0], { x: 5, y: 4 });
    queueTurn(state, 'down');
    assert.equal(state.pending, null);
    queueTurn(state, 'right');
    step(state, rng);
    assert.equal(state.direction, 'right');
    assert.deepEqual(state.snake[0], { x: 6, y: 4 });
  });

  it('ends on a wall, wraps only three times, and still hits itself', () => {
    const rng = mulberry32(5);
    const state = createGame({ difficulty: 'medium', cols: 8, rows: 8, rng });
    state.bubbles = [];
    state.power = null;
    state.passCharges = 0;
    state.snake = [{ x: 0, y: 3 }];
    state.direction = 'left';
    state.pending = null;
    const before = state.snake.map((cell) => ({ ...cell }));
    step(state, rng);
    assert.equal(state.status, 'over');
    assert.equal(state.overReason, 'wall');
    assert.deepEqual(state.snake, before);

    const wrapping = createGame({ difficulty: 'hard', cols: 5, rows: 5, rng });
    wrapping.bubbles = [];
    wrapping.power = null;
    wrapping.passCharges = 3;
    wrapping.snake = [{ x: 4, y: 2 }];
    wrapping.direction = 'right';
    wrapping.pending = null;
    let wraps = 0;
    while (wrapping.status === 'playing' && wraps < 12) {
      const charges = wrapping.passCharges;
      step(wrapping, rng);
      if (wrapping.passCharges < charges) wraps += 1;
    }
    assert.equal(wraps, 3);
    assert.equal(wrapping.status, 'over');
    assert.equal(wrapping.overReason, 'wall');

    const vertical = createGame({ difficulty: 'easy', cols: 6, rows: 6, rng });
    vertical.bubbles = [];
    vertical.power = null;
    vertical.passCharges = 2;
    vertical.snake = [{ x: 2, y: 0 }];
    vertical.direction = 'up';
    step(vertical, rng);
    assert.deepEqual(vertical.snake[0], { x: 2, y: 5 });
    assert.equal(vertical.passCharges, 1);
    assert.equal(vertical.status, 'playing');

    const body = createGame({ difficulty: 'easy', cols: 8, rows: 8, rng });
    body.bubbles = [];
    body.power = null;
    body.passCharges = 3;
    body.snake = [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
      { x: 0, y: 0 },
    ];
    body.direction = 'left';
    body.pending = null;
    step(body, rng);
    assert.equal(body.status, 'over');
    assert.equal(body.overReason, 'self');
    assert.equal(body.passCharges, 3);
  });

  it('treats P as its own step and keeps it until it is eaten', () => {
    const rng = mulberry32(15);
    let powered = null;
    for (let index = 0; index < 200 && !powered; index += 1) {
      const state = createGame({ difficulty: 'easy', cols: 12, rows: 12, rng: mulberry32(1000 + index) });
      if (state.power) powered = state;
    }
    assert.ok(powered);
    const spot = { ...powered.power };
    const length = powered.snake.length;
    eatWhere(powered, (bubble) => bubble.value === powered.question.answer, rng);
    assert.deepEqual(powered.power, spot);
    assert.equal(powered.snake.length, length + 1);

    powered.passCharges = 3;
    const blocked = { ...powered.power };
    eatWhere(powered, (bubble) => bubble.value !== powered.question.answer, rng);
    assert.deepEqual(powered.power, blocked);

    const fresh = createGame({ difficulty: 'easy', cols: 12, rows: 12, rng: mulberry32(3) });
    fresh.passCharges = 2;
    fresh.power = null;
    for (let index = 0; index < 40; index += 1) {
      eatWhere(fresh, (bubble) => bubble.value === fresh.question.answer, rng);
      assert.equal(fresh.power, null);
      fresh.passCharges = 2;
    }

    const item = createGame({ difficulty: 'medium', cols: 12, rows: 12, rng });
    item.power = { x: 6, y: 4 };
    item.bubbles = item.bubbles.filter((bubble) => bubble.x !== 6 || bubble.y !== 4);
    item.bubbles.push({ x: 6, y: 4, value: item.question.answer });
    item.snake = [
      { x: 5, y: 4 },
      { x: 4, y: 4 },
      { x: 3, y: 4 },
      { x: 2, y: 4 },
    ];
    item.direction = 'right';
    item.pending = null;
    const score = item.score;
    const prompt = item.question.text;
    const interval = item.interval;
    step(item, rng);
    assert.equal(item.snake.length, 4);
    assert.equal(item.interval, interval);
    assert.equal(item.power, null);
    assert.equal(item.passCharges, 3);
    assert.equal(item.score, score);
    assert.equal(item.question.text, prompt);
    assert.equal(item.bubbles.some((bubble) => bubble.x === 6 && bubble.y === 4), true);
  });

  it('starts as one cell in the center and keeps a round when the board changes', () => {
    const rng = mulberry32(21);
    const state = createGame({ difficulty: 'hard', cols: 9, rows: 11, rng });
    assert.deepEqual(state.snake, [{ x: 4, y: 5 }]);
    assert.equal(state.direction, 'right');
    assert.equal(state.bubbles.length, 9);
    const values = state.bubbles.map((bubble) => bubble.value);
    assert.equal(values.filter((value) => value === state.question.answer).length, 1);
    assert.equal(new Set(values).size, 9);
    const wrongs = pickWrongValues(state.question.answer, mulberry32(1));
    assert.equal(new Set(wrongs).size, 8);
    for (const bubble of state.bubbles) {
      if (bubble.value !== state.question.answer) {
        const offset = bubble.value - state.question.answer;
        assert.ok(offset >= -10 && offset <= 10 && offset !== 0);
      }
      assert.ok(!(bubble.x === 4 && bubble.y === 5));
    }

    state.score = 37;
    state.correct = 4;
    state.interval = 150;
    const prompt = state.question.text;
    relayout(state, 14, 14, rng);
    assert.equal(state.score, 37);
    assert.equal(state.correct, 4);
    assert.equal(state.interval, 150);
    assert.equal(state.question.text, prompt);
    assert.equal(state.status, 'playing');
    assert.deepEqual(state.snake[0], { x: 4, y: 5 });

    state.snake = Array.from({ length: 10 }, (_, index) => ({ x: index, y: 1 }));
    state.bubbles = [{ x: 11, y: 1, value: state.question.answer }];
    relayout(state, 6, 8, rng);
    assert.equal(state.snake.length, 10);
    assert.equal(state.question.text, prompt);
    assert.equal(state.score, 37);
    const keys = new Set(state.snake.map((cell) => `${cell.x},${cell.y}`));
    assert.equal(keys.size, state.snake.length);
    for (const cell of state.snake) {
      assert.ok(cell.x >= 0 && cell.x < 6 && cell.y >= 0 && cell.y < 8);
    }
    assert.equal(state.bubbles.length, 1);
    assert.equal(state.bubbles[0].value, state.question.answer);
    assert.ok(state.bubbles[0].x >= 0 && state.bubbles[0].x < 6);
  });

  it('keeps play invariants for random runs', () => {
    const opposite = { left: 'right', right: 'left', up: 'down', down: 'up' };
    const directions = ['up', 'down', 'left', 'right'];
    for (let game = 0; game < 25; game += 1) {
      const rng = mulberry32(400 + game);
      const state = createGame({
        difficulty: ['easy', 'medium', 'hard'][game % 3],
        cols: 12,
        rows: 12,
        rng,
      });
      for (let move = 0; move < 70 && state.status === 'playing'; move += 1) {
        const beforeDirection = state.direction;
        const beforeLength = state.snake.length;
        const beforeCorrect = state.correct;
        const beforeWrong = state.wrong;
        const beforePower = state.power;
        queueTurn(state, directions[Math.floor(rng() * directions.length)]);
        step(state, rng);
        if (state.status === 'playing') {
          assert.notEqual(state.direction, opposite[beforeDirection]);
          const ate = state.correct !== beforeCorrect || state.wrong !== beforeWrong;
          assert.equal(state.snake.length, beforeLength + (ate ? 1 : 0));
          if (beforePower && !state.power) assert.equal(state.passCharges, 3);
        } else {
          assert.ok(state.overReason === 'wall' || state.overReason === 'self');
          assert.equal(state.snake.length, beforeLength);
        }
        assert.ok(state.score >= 0);
        assert.ok(state.interval >= MIN_INTERVAL && state.interval <= START_INTERVAL);
        assert.ok(state.passCharges >= 0 && state.passCharges <= 3);
        assert.ok(state.maxCombo >= state.combo);
        const seen = new Set();
        for (const cell of state.snake) {
          const key = `${cell.x},${cell.y}`;
          assert.equal(seen.has(key), false);
          seen.add(key);
        }
        for (const bubble of state.bubbles) {
          assert.equal(seen.has(`${bubble.x},${bubble.y}`), false);
          seen.add(`${bubble.x},${bubble.y}`);
        }
        if (state.power) assert.equal(seen.has(`${state.power.x},${state.power.y}`), false);
      }
    }
  });
});

describe('board fit', () => {
  it('uses a tall board on a narrow screen and a wide board on a desktop', () => {
    const phone = chooseGrid(360, 520, 390);
    assert.ok(phone.rows > phone.cols);
    assert.ok(phone.cell <= 38);
    assert.ok(phone.cell >= 26);
    assert.ok(phone.cols * phone.rows >= 120);
    assert.ok(phone.cols * phone.cell <= 360);
    assert.ok(phone.rows * phone.cell <= 520);

    const desktop = chooseGrid(1040, 560, 1280);
    assert.ok(desktop.cols > desktop.rows);
    assert.ok(desktop.cell <= 38);
    assert.ok(desktop.cell >= 26);
    assert.ok(desktop.cols * desktop.rows >= 300);
    assert.ok(desktop.cols * desktop.cell <= 1040);
    assert.ok(desktop.rows * desktop.cell <= 560);

    const tiny = chooseGrid(0, 0, 390);
    assert.ok(tiny.cols >= 4 && tiny.rows >= 4 && tiny.cell >= 1);
  });

  it('places no bubbles when the snake fills the board', () => {
    const rng = mulberry32(2);
    const state = createGame({ difficulty: 'easy', cols: 4, rows: 4, rng });
    state.snake = [];
    for (let y = 0; y < 4; y += 1) {
      for (let x = 0; x < 4; x += 1) state.snake.push({ x, y });
    }
    spawnRound(state, rng);
    assert.equal(state.bubbles.length, 0);
    assertQuestion(state.question, 'easy');
  });
});
