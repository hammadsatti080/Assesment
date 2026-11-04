export type CellData = Record<string, string>;

export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export type StyleProp = keyof CellStyle;
export type StyleData = Record<string, CellStyle>;

export interface SheetState {
  data: CellData;
  styles: StyleData;
}

export interface Position {
  r: number;
  c: number;
}

export interface Worksheet {
  id: string;
  name: string;
  data: SheetState;
}