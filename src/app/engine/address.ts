import type { Address, CellPos } from "./types";

export function colToLetters(col: number): string {
  let n = col + 1;
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export function lettersToCol(letters: string): number {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

export function toAddress({ row, col }: CellPos): Address {
  return `${colToLetters(col)}${row + 1}`;
}

export function parseAddress(addr: string): CellPos | null {
  const m = /^([A-Z]{1,3})([1-9][0-9]*)$/.exec(addr.toUpperCase());
  if (!m) return null;
  return { col: lettersToCol(m[1]), row: parseInt(m[2], 10) - 1 };
}