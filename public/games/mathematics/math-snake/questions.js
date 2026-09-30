/** Integer questions for Math Snake. Answers are integers with absolute value at most 99. */

export const DIVISORS = [-8, -6, -4, -3, -2, -1, 1, 2, 3, 4, 6, 8];
export const QUOTIENTS = [-10, -8, -6, -4, -3, -2, -1, 1, 2, 3, 4, 6, 8, 10];

const EASY_OPS = ['+', '-'];
const MEDIUM_OPS = ['+', '-', 'x'];
const HARD_OPS = ['+', '-', 'x', '÷'];

function randomInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

function pick(rng, items) {
  return items[Math.floor(rng() * items.length)];
}

function formatOperand(value, first) {
  if (!first && value < 0) return `(${value})`;
  return String(value);
}

/** First number is never wrapped. Later negative numbers are. Hard groups the first operation. */
export function formatQuestion(parts) {
  const left = formatOperand(parts.a, true);
  const mid = formatOperand(parts.b, false);
  const binary = `${left} ${parts.op1} ${mid}`;
  if (parts.op2 == null) return binary;
  const grouped = parts.b < 0 ? `[${binary}]` : `(${binary})`;
  return `${grouped} ${parts.op2} ${formatOperand(parts.c, false)}`;
}

function normalizeInteger(value) {
  if (!Number.isInteger(value)) return null;
  return value === 0 ? 0 : value;
}

export function compute(op, left, right) {
  if (!Number.isInteger(left) || !Number.isInteger(right)) return null;
  let value = null;
  if (op === '+') value = left + right;
  else if (op === '-') value = left - right;
  else if (op === 'x') value = left * right;
  else if (op === '÷') {
    if (right === 0 || left % right !== 0) return null;
    value = left / right;
  }
  return normalizeInteger(value);
}

export function answerOf(parts) {
  const mid = compute(parts.op1, parts.a, parts.b);
  if (mid == null) return null;
  if (parts.op2 == null) return mid;
  return compute(parts.op2, mid, parts.c);
}

/** Divisors from -10 to 10 that divide result and keep the quotient's absolute value within 99. */
export function divisorsFor(result) {
  if (!Number.isInteger(result)) return [];
  const choices = [];
  for (let divisor = -10; divisor <= 10; divisor += 1) {
    if (divisor === 0) continue;
    if (result % divisor !== 0) continue;
    if (Math.abs(result / divisor) <= 99) choices.push(divisor);
  }
  return choices;
}

function withText(parts) {
  const answer = answerOf(parts);
  return { ...parts, answer, text: formatQuestion(parts) };
}

export function fallbackQuestion(difficulty) {
  if (difficulty === 'hard') {
    return withText({ a: -2, op1: '+', b: -2, op2: '+', c: 1 });
  }
  if (difficulty === 'medium') {
    return withText({ a: -2, op1: 'x', b: 3, op2: null, c: null });
  }
  return withText({ a: -4, op1: '+', b: -3, op2: null, c: null });
}

function rollAddSub(rng, op1) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const a = randomInt(rng, -10, 10);
    const b = randomInt(rng, -10, 10);
    if (b === 0 || (a >= 0 && b >= 0)) continue;
    return { a, op1, b, op2: null, c: null };
  }
  return { a: -4, op1, b: -3, op2: null, c: null };
}

function rollMultiply(rng) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const a = randomInt(rng, -10, 10);
    const b = randomInt(rng, -5, 5);
    if (a === 0 && b === 0) continue;
    return { a, op1: 'x', b, op2: null, c: null };
  }
  return { a: -2, op1: 'x', b: 3, op2: null, c: null };
}

function rollPair(rng, op1) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    let a;
    let b;
    if (op1 === '÷') {
      b = pick(rng, DIVISORS);
      a = b * pick(rng, QUOTIENTS);
    } else {
      a = randomInt(rng, -10, 10);
      b = randomInt(rng, -10, 10);
    }
    if (a >= 0 && b >= 0 && b !== 0) continue;
    return { a, b };
  }
  if (op1 === '÷') return { a: -8, b: 2 };
  return { a: -4, b: -3 };
}

function rollThird(rng, op2, result) {
  if (op2 === '÷') {
    const choices = divisorsFor(result);
    if (choices.length === 0) return pick(rng, [-2, -1, 1, 2]);
    return pick(rng, choices);
  }
  const allowZero = op2 === 'x';
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const value = randomInt(rng, -10, 10);
    if (!allowZero && value === 0) continue;
    return value;
  }
  return 1;
}

function roll(difficulty, rng) {
  if (difficulty === 'easy') return rollAddSub(rng, pick(rng, EASY_OPS));
  if (difficulty === 'medium') {
    const op1 = pick(rng, MEDIUM_OPS);
    return op1 === 'x' ? rollMultiply(rng) : rollAddSub(rng, op1);
  }
  if (difficulty === 'hard') {
    const op1 = pick(rng, HARD_OPS);
    const op2 = pick(rng, HARD_OPS);
    const pair = rollPair(rng, op1);
    const mid = compute(op1, pair.a, pair.b);
    if (mid == null) return null;
    const c = rollThird(rng, op2, mid);
    return { a: pair.a, op1, b: pair.b, op2, c };
  }
  return null;
}

export function generateQuestion(difficulty, rng = Math.random) {
  for (let attempt = 0; attempt < 400; attempt += 1) {
    const parts = roll(difficulty, rng);
    if (!parts) continue;
    const answer = answerOf(parts);
    if (answer == null || !Number.isInteger(answer) || Math.abs(answer) > 99) continue;
    return { ...parts, answer, text: formatQuestion(parts) };
  }
  return fallbackQuestion(difficulty);
}
