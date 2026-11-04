import { COLS, ROWS, keyOf } from './constants';
import type { CellData } from './types';

export interface Computed {
  display: string; // cell mein kya dikhega
  value: number | string; // doosre formulas ke liye
  error: string | null; // '#CYCLE!' waghera
}

export class FormulaError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

interface Ctx {
  getCell: (r: number, c: number) => Computed;
}

interface Range {
  r1: number;
  c1: number;
  r2: number;
  c2: number;
}
type Operand = number | Range;

interface Token {
  type: 'num' | 'id' | 'op';
  text: string;
}

/* ---------- helpers ---------- */
const formatNumber = (n: number): string => String(parseFloat(n.toPrecision(12)));

const errorResult = (code: string): Computed => ({ display: code, value: '', error: code });

const valueResult = (v: number | string): Computed => {
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return errorResult('#NUM!');
    return { display: formatNumber(v), value: v, error: null };
  }
  return { display: v, value: v, error: null };
};

/* ---------- 1) tokenizer ---------- */
function tokenize(src: string): Token[] {
  const out: Token[] = [];
  const re = /\s*(?:(\d+\.?\d*|\.\d+)|([A-Za-z][A-Za-z0-9]*)|([+\-*/(),:]))/y;
  let pos = 0;

  while (pos < src.length) {
    re.lastIndex = pos;
    const m = re.exec(src);
    if (!m) {
      if (src.slice(pos).trim() === '') break;
      throw new FormulaError('#ERROR!');
    }
    pos = re.lastIndex;
    if (m[1] !== undefined) out.push({ type: 'num', text: m[1] });
    else if (m[2] !== undefined) out.push({ type: 'id', text: m[2].toUpperCase() });
    else out.push({ type: 'op', text: m[3] });
  }
  return out;
}

/* ---------- 2) "B7" ko row/column mein badalna ---------- */
function parseRef(text: string): { r: number; c: number } {
  const m = /^([A-Z]+)(\d+)$/.exec(text);
  if (!m) throw new FormulaError('#NAME?');

  let c = 0;
  for (const ch of m[1]) c = c * 26 + (ch.charCodeAt(0) - 64);
  c -= 1;
  const r = parseInt(m[2], 10) - 1;

  // sheet se bahar ka cell (jaise Z999) => #REF!
  if (c < 0 || c >= COLS || r < 0 || r >= ROWS) throw new FormulaError('#REF!');
  return { r, c };
}

/* ---------- 3) parser + evaluator ---------- */
function evaluateFormula(src: string, ctx: Ctx): number | string {
  const tokens = tokenize(src);
  let i = 0;

  const isOp = (text: string): boolean => {
    const t = tokens[i];
    return t !== undefined && t.type === 'op' && t.text === text;
  };

  const expect = (text: string): void => {
    const t = tokens[i++];
    if (!t || t.type !== 'op' || t.text !== text) throw new FormulaError('#ERROR!');
  };

  const readCell = (r: number, c: number): number | string => {
    const cell = ctx.getCell(r, c);
    if (cell.error) throw new FormulaError(cell.error); // error aage pass hota hai
    return cell.value;
  };

  const strToNum = (s: string): number => {
    if (s.trim() === '') return 0; // khali cell = 0
    const n = Number(s);
    if (Number.isNaN(n)) throw new FormulaError('#VALUE!');
    return n;
  };

  const toNumber = (o: Operand): number => {
    if (typeof o === 'number') return o;
    if (o.r1 !== o.r2 || o.c1 !== o.c2) throw new FormulaError('#VALUE!'); // poori range arithmetic mein nahi chalti
    const v = readCell(o.r1, o.c1);
    return typeof v === 'number' ? v : strToNum(v);
  };

  // range ke sirf numbers jama karo (text aur khali cells ignore)
  const collect = (rg: Range, out: number[]): void => {
    for (let r = rg.r1; r <= rg.r2; r++) {
      for (let c = rg.c1; c <= rg.c2; c++) {
        const v = readCell(r, c);
        if (typeof v === 'number') out.push(v);
      }
    }
  };

  const callFunction = (name: string): number => {
    const nums: number[] = [];

    if (!isOp(')')) {
      for (;;) {
        const arg = parseExpr();
        if (typeof arg === 'number') nums.push(arg);
        else collect(arg, nums);
        if (isOp(',')) i++;
        else break;
      }
    }
    expect(')');

    const sum = nums.reduce((a, b) => a + b, 0);
    switch (name) {
      case 'SUM':
        return sum;
      case 'AVG':
      case 'AVERAGE':
        if (nums.length === 0) throw new FormulaError('#DIV/0!');
        return sum / nums.length;
      case 'COUNT':
        return nums.length;
      case 'MIN':
        return nums.length ? nums.reduce((a, b) => Math.min(a, b), Infinity) : 0;
      case 'MAX':
        return nums.length ? nums.reduce((a, b) => Math.max(a, b), -Infinity) : 0;
      default:
        throw new FormulaError('#NAME?');
    }
  };

  const parsePrimary = (): Operand => {
    const t = tokens[i++];
    if (!t) throw new FormulaError('#ERROR!');

    if (t.type === 'num') return parseFloat(t.text);

    if (t.type === 'op' && t.text === '(') {
      const v = parseExpr();
      expect(')');
      return v;
    }

    if (t.type === 'id') {
      if (isOp('(')) {
        i++;
        return callFunction(t.text);
      }
      const a = parseRef(t.text);
      if (isOp(':')) {
        i++;
        const end = tokens[i++];
        if (!end || end.type !== 'id') throw new FormulaError('#ERROR!');
        const b = parseRef(end.text);
        return {
          r1: Math.min(a.r, b.r),
          c1: Math.min(a.c, b.c),
          r2: Math.max(a.r, b.r),
          c2: Math.max(a.c, b.c),
        };
      }
      return { r1: a.r, c1: a.c, r2: a.r, c2: a.c };
    }

    throw new FormulaError('#ERROR!');
  };

  const parseUnary = (): Operand => {
    if (isOp('-')) {
      i++;
      return -toNumber(parseUnary());
    }
    if (isOp('+')) {
      i++;
      return toNumber(parseUnary());
    }
    return parsePrimary();
  };

  const parseTerm = (): Operand => {
    let left = parseUnary();
    while (isOp('*') || isOp('/')) {
      const op = tokens[i++].text;
      const right = toNumber(parseUnary());
      if (op === '/' && right === 0) throw new FormulaError('#DIV/0!');
      left = op === '*' ? toNumber(left) * right : toNumber(left) / right;
    }
    return left;
  };

  const parseExpr = (): Operand => {
    let left = parseTerm();
    while (isOp('+') || isOp('-')) {
      const op = tokens[i++].text;
      const right = toNumber(parseTerm());
      left = op === '+' ? toNumber(left) + right : toNumber(left) - right;
    }
    return left;
  };

  const result = parseExpr();
  if (i !== tokens.length) throw new FormulaError('#ERROR!'); // faltu tokens bache

  if (typeof result === 'number') return result;
  if (result.r1 === result.r2 && result.c1 === result.c2) {
    const v = readCell(result.r1, result.c1); // =A1
    return v === '' ? 0 : v;
  }
  throw new FormulaError('#VALUE!'); // =A1:A5 akeli
}

/* ---------- 4) evaluator: memo + cycle detection ---------- */
export function createEvaluator(data: CellData): (r: number, c: number) => Computed {
  const memo = new Map<string, Computed>();
  const visiting = new Set<string>();

  const getCell = (r: number, c: number): Computed => {
    const key = keyOf(r, c);

    const cached = memo.get(key);
    if (cached) return cached;

    // is cell ka hisaab abhi chal raha hai aur wapas isi tak pohanch gaye => cycle
    if (visiting.has(key)) return errorResult('#CYCLE!');

    const raw = data[key] ?? '';
    let result: Computed;

    if (raw.startsWith('=')) {
      visiting.add(key);
      try {
        result = valueResult(evaluateFormula(raw.slice(1), { getCell }));
      } catch (e) {
        result = errorResult(e instanceof FormulaError ? e.code : '#ERROR!');
      } finally {
        visiting.delete(key);
      }
    } else if (raw.trim() !== '' && !Number.isNaN(Number(raw))) {
      result = { display: raw, value: Number(raw), error: null }; // number jaisa likha waisa dikhao
    } else {
      result = { display: raw, value: raw, error: null }; // text ya khali
    }

    memo.set(key, result);
    return result;
  };

  return getCell;
}