export const COLS = 26;
export const ROWS = 100;

export const MENUS: string[] = [
  'File', 'Edit', 'View', 'Insert', 'Format',
  'Data', 'Tools', 'Extensions', 'Help',
];

export const ZOOM_LEVELS: number[] = [200, 150, 125, 100, 90, 80, 70, 60, 50, 40, 30, 20];

export const colName = (i: number): string => String.fromCharCode(65 + i);
export const keyOf = (r: number, c: number): string => `${r},${c}`;