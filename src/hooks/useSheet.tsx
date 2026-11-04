
import { useState, useRef, useEffect, useMemo } from 'react';
import type { KeyboardEvent, RefObject } from 'react';
import { COLS, ROWS, colName, keyOf } from '../lib/constants';
import { createEvaluator } from '../lib/formula';
import type { Computed } from '../lib/formula';
import type { CellStyle, Position, SheetState, StyleProp , Worksheet } from '../lib/types';

export type SaveStatus = 'saved' | 'saving' | 'failed';

const SHEET_ID = 'budget';
const EMPTY_SHEET: SheetState = { data: {}, styles: {} };

export interface UseSheetReturn {
  sheet: SheetState;
  sel: Position;
  editing: boolean;
  cellEditing: boolean;
  draft: string;
  zoom: number;
  gridRef: RefObject<HTMLDivElement | null>;
  cellValue: string;
  cellName: string;
  activeStyle: CellStyle;
  canUndo: boolean;
  canRedo: boolean;
  saveStatus: SaveStatus;
  getComputed: (r: number, c: number) => Computed;
  undo: () => void;
  redo: () => void;
  retrySave: () => void;
  setZoom: (z: number) => void;
  toggleStyle: (prop: StyleProp) => void;
  setDraft: (value: string) => void;
  changeDraft: (value: string) => void;
  startEdit: (initial?: string) => void;
  selectCell: (r: number, c: number) => void;
  onGridKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
  onFormulaKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
/*....*/
  fillCells: (
  sr: number,
  sc: number,
  er: number,
  ec: number
) => void;

/*... Add new sheet*/ 
sheets: Worksheet[];
activeSheetId: string;
addSheet: () => void;
selectSheet: (id: string) => void;


}

export function useSheet(): UseSheetReturn {
 // const [sheet, setSheet] = useState<SheetState>(EMPTY_SHEET);
 const [sheets, setSheets] = useState<Worksheet[]>([
  {
    id: 'sheet1',
    name: 'Sheet1',
    data: EMPTY_SHEET,
  },
]);

const [activeSheetId, setActiveSheetId] = useState('sheet1');

const sheet =
  sheets.find((item) => item.id === activeSheetId)?.data ?? EMPTY_SHEET;
  const [past, setPast] = useState<SheetState[]>([]);
  const [future, setFuture] = useState<SheetState[]>([]);
  const [sel, setSel] = useState<Position>({ r: 0, c: 0 });
  const [editing, setEditing] = useState<boolean>(false);
  const [editSource, setEditSource] = useState<'cell' | 'formula'>('cell');
  const [draft, setDraft] = useState<string>('');
  const [zoom, setZoom] = useState<number>(100);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const gridRef = useRef<HTMLDivElement>(null);
 /* const [sheets, setSheets] = useState([
  { id: 'sheet1', name: 'Sheet1' }
]);
const [activeSheetId, setActiveSheetId] = useState('sheet1');
*/
/*

const addSheet = (): void => {
  const newId = `sheet${sheets.length + 1}`;

  setSheets((prev) => [
    ...prev,
    { id: newId, name: `Sheet${prev.length + 1}` }
  ]);

  setActiveSheetId(newId);
};

const selectSheet = (id: string): void => {
  setActiveSheetId(id);
}; 
*/
const addSheet = (): void => {
  const newId = `sheet${Date.now()}`;

  const newSheet: Worksheet = {
    id: newId,
    name: `Sheet${sheets.length + 1}`,
    data: { data: {}, styles: {} },
  };

  setSheets((prev) => [...prev, newSheet]);
  setActiveSheetId(newId);

  setSel({ r: 0, c: 0 });
  setEditing(false);
  setDraft('');
};

const selectSheet = (id: string): void => {
  setActiveSheetId(id);
  setSel({ r: 0, c: 0 });
  setEditing(false);
  setDraft('');
};


  // save ke liye refs
  const latest = useRef<SheetState>(EMPTY_SHEET);
  const inFlight = useRef<boolean>(false);
  const dirty = useRef<boolean>(false);

  const key = keyOf(sel.r, sel.c);
  const cellValue = sheet.data[key] ?? ''; // raw text (formula ho to formula)
  const cellName = `${colName(sel.c)}${sel.r + 1}`;
  const activeStyle: CellStyle = sheet.styles[key] ?? {};

  // sirf tab dobara hisaab hota hai jab cell ka data badle (selection ya zoom par nahi)
  const getComputed = useMemo(() => createEvaluator(sheet.data), [sheet.data]);

  const refocus = (): void => gridRef.current?.focus();

  /* ---------- load ---------- */
  useEffect(() => {
    fetch(`/api/sheets/${SHEET_ID}`)
      .then(async (r) => {
        if (r.status === 404) return EMPTY_SHEET; // pehli dafa: sheet abhi bani nahi
        if (!r.ok) throw new Error('load failed');
        return (await r.json()) as SheetState;
      })
      .then((saved) => {
        latest.current = saved; // taake load ke baad faltu save na chale
      //  setSheet(saved);
      setSheets((prev) =>
  prev.map((item) =>
    item.id === 'sheet1'
      ? { ...item, data: saved }
      : item
  )
);
        setLoaded(true);
      })
      .catch((err) => console.error(err));
  }, []);

  /* ---------- save (ek waqt mein ek, hamesha latest data) ---------- */
  const flush = async (): Promise<void> => {
    if (inFlight.current) return;
    inFlight.current = true;

    while (dirty.current) {
      dirty.current = false;
      setSaveStatus('saving');
      try {
        const res = await fetch(`/api/sheets/${SHEET_ID}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(latest.current),
        });
        if (!res.ok) throw new Error('save failed');
        if (!dirty.current) setSaveStatus('saved');
      } catch {
        dirty.current = true; // data abhi unsaved hai
        setSaveStatus('failed');
        break; // user Retry dabaye ya agli edit par dobara try hoga
      }
    }

    inFlight.current = false;
  };

  const retrySave = (): void => {
    dirty.current = true;
    void flush();
  };

  // har change ke baad 400ms debounce
  useEffect(() => {
    if (!loaded || sheet === latest.current) return;
    latest.current = sheet;
    dirty.current = true;
    const t = setTimeout(() => void flush(), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet, loaded]);

  /* ---------- history (undo / redo) ---------- */
/*  const applyChange = (updater: (s: SheetState) => SheetState): void => {
    setPast((p) => [...p, sheet]);
    setFuture([]);
    setSheet(updater(sheet));    
  };
*/
const applyChange = (updater: (s: SheetState) => SheetState): void => {
  setPast((p) => [...p, sheet]);
  setFuture([]);

  setSheets((prev) =>
    prev.map((item) =>
      item.id === activeSheetId
        ? { ...item, data: updater(item.data) }
        : item
    )
  );
};

  // Drag-to-fill function
const fillCells = (
  sr: number,
  sc: number,
  er: number,
  ec: number
): void => {
  const sourceKey = keyOf(sr, sc);
  const sourceValue = sheet.data[sourceKey] ?? '';
  const sourceStyle = sheet.styles[sourceKey];

  const newData = { ...sheet.data };
  const newStyles = { ...sheet.styles };

  const minR = Math.min(sr, er);
  const maxR = Math.max(sr, er);
  const minC = Math.min(sc, ec);
  const maxC = Math.max(sc, ec);

  let changed = false;

  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      if (r === sr && c === sc) continue;

      const targetKey = keyOf(r, c);

      newData[targetKey] = sourceValue;

      if (sourceStyle) {
        newStyles[targetKey] = { ...sourceStyle };
      } else {
        delete newStyles[targetKey];
      }

      changed = true;
    }
  }

  if (changed) {
    applyChange((current) => ({
      ...current,
      data: newData,
      styles: newStyles,
    }));
  }
};

  const undo = (): void => {
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    setPast(past.slice(0, -1));
    setFuture((f) => [sheet, ...f]);
 //   setSheet(prev);
 setSheets((sheets) =>
  sheets.map((item) =>
    item.id === activeSheetId
      ? { ...item, data: prev }
      : item
  )
);
    setEditing(false);
  };

  const redo = (): void => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture(future.slice(1));
    setPast((p) => [...p, sheet]);
    //setSheet(next);
    setSheets((sheets) =>
  sheets.map((item) =>
    item.id === activeSheetId
      ? { ...item, data: next }
      : item
  )
);
    setEditing(false);
  };

  /* ---------- movement & editing ---------- */
  const move = (dr: number, dc: number): void =>
    setSel((s) => ({
      r: Math.min(ROWS - 1, Math.max(0, s.r + dr)),
      c: Math.min(COLS - 1, Math.max(0, s.c + dc)),
    }));

  const startEdit = (initial?: string): void => {
    setDraft(initial ?? cellValue);
    setEditSource('cell');
    setEditing(true);
  };

  const commit = (): void => {
    if (draft !== cellValue) {
      applyChange((s) => ({ ...s, data: { ...s.data, [key]: draft } }));
    }
    setEditing(false);
  };

  const cancel = (): void => setEditing(false);

  const changeDraft = (value: string): void => {
    setEditSource('formula');
    setEditing(true);
    setDraft(value);
  };

  const selectCell = (r: number, c: number): void => {
    if (editing) commit();
    setSel({ r, c });
  };

  const clearCell = (): void => {
    if (cellValue === '') return;
    applyChange((s) => ({ ...s, data: { ...s.data, [key]: '' } }));
  };

  /* ---------- styles (bold / italic / underline) ---------- */
  const toggleStyle = (prop: StyleProp): void => {
    applyChange((s) => {
      const current = s.styles[key] ?? {};
      return {
        ...s,
        styles: { ...s.styles, [key]: { ...current, [prop]: !current[prop] } },
      };
    });
  };

  /* ---------- keyboard ---------- */
  const onGridKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (editing) {
      if (e.key === 'Enter') { e.preventDefault(); commit(); move(1, 0); refocus(); }
      else if (e.key === 'Tab') { e.preventDefault(); commit(); move(0, 1); refocus(); }
      else if (e.key === 'Escape') { cancel(); refocus(); }
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      const k = e.key.toLowerCase();
      if (k === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
      else if (k === 'y') { e.preventDefault(); redo(); }
      else if (k === 'b') { e.preventDefault(); toggleStyle('bold'); }
      else if (k === 'i') { e.preventDefault(); toggleStyle('italic'); }
      else if (k === 'u') { e.preventDefault(); toggleStyle('underline'); }
      return;
    }

    switch (e.key) {
      case 'ArrowUp': e.preventDefault(); move(-1, 0); break;
      case 'ArrowDown': e.preventDefault(); move(1, 0); break;
      case 'ArrowLeft': e.preventDefault(); move(0, -1); break;
      case 'ArrowRight': e.preventDefault(); move(0, 1); break;
      case 'Tab': e.preventDefault(); move(0, e.shiftKey ? -1 : 1); break;
      case 'Enter':
      case 'F2': e.preventDefault(); startEdit(); break;
      case 'Delete':
      case 'Backspace': clearCell(); break;
      default:
        if (e.key.length === 1) {
          e.preventDefault();
          startEdit(e.key);
        }
    }
  };

  const onFormulaKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') { commit(); refocus(); }
    else if (e.key === 'Escape') { cancel(); refocus(); }
  };

  return {
    sheet, sel, editing, draft, zoom, gridRef,
    cellEditing: editing && editSource === 'cell',
    cellValue, cellName, activeStyle,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    saveStatus, getComputed,
    undo, redo, retrySave, setZoom, toggleStyle,
    setDraft, changeDraft, startEdit, selectCell,
    onGridKeyDown, onFormulaKeyDown,
      fillCells,
      sheets,
activeSheetId,
addSheet,
selectSheet,

  };
}