
import { useState, useRef, useEffect, useMemo } from 'react';
import type { KeyboardEvent, RefObject } from 'react';

import {
  COLS,
  INITIAL_ROWS,
  ROWS_INCREMENT,
  MAX_ROWS,
  colName,
  keyOf
} from '../lib/constants';

import { createEvaluator } from '../lib/formula';
import type { Computed } from '../lib/formula';

import type {
  CellStyle,
  Position,
  SheetState,
  StyleProp,
  Worksheet
} from '../lib/types';

export type SaveStatus = 'saved' | 'saving' | 'failed';

const SHEET_ID = 'budget';

const EMPTY_SHEET: SheetState = {
  data: {},
  styles: {}
};

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

  fillCells: (
    sr: number,
    sc: number,
    er: number,
    ec: number
  ) => void;

  // Multiple sheets
  sheets: Worksheet[];
  activeSheetId: string;
  addSheet: () => void;
  selectSheet: (id: string) => void;

  // Dynamic rows
  rowCount: number;
  addRows: () => void;

  saveNow: () => void;
}

export function useSheet(): UseSheetReturn {

  /* ---------- SHEETS ---------- */

  const [sheets, setSheets] = useState<Worksheet[]>([
    {
      id: 'sheet1',
      name: 'Sheet1',
      data: EMPTY_SHEET,
      rowCount: INITIAL_ROWS
    }
  ]);

  const [activeSheetId, setActiveSheetId] = useState('sheet1');

  const activeSheet = sheets.find(
    (item) => item.id === activeSheetId
  );

  const sheet = activeSheet?.data ?? EMPTY_SHEET;

  const rowCount = activeSheet?.rowCount ?? INITIAL_ROWS;

  /* ---------- HISTORY ---------- */

  const [past, setPast] = useState<SheetState[]>([]);
  const [future, setFuture] = useState<SheetState[]>([]);

  const [sel, setSel] = useState<Position>({
    r: 0,
    c: 0
  });

  const [editing, setEditing] = useState(false);

  const [editSource, setEditSource] = useState<'cell' | 'formula'>('cell');

  const [draft, setDraft] = useState('');

  const [zoom, setZoom] = useState(100);

  const [loaded, setLoaded] = useState(false);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');

  const gridRef = useRef<HTMLDivElement>(null);

  /* ---------- SAVE REFS ---------- */

  const latest = useRef<SheetState>(EMPTY_SHEET);
  const inFlight = useRef(false);
  const dirty = useRef(false);

  const key = keyOf(sel.r, sel.c);

  const cellValue = sheet.data[key] ?? '';

  const cellName = `${colName(sel.c)}${sel.r + 1}`;

  const activeStyle: CellStyle = sheet.styles[key] ?? {};

  const getComputed = useMemo(
    () => createEvaluator(sheet.data),
    [sheet.data]
  );

  const refocus = (): void => {
    gridRef.current?.focus();
  };

  /* ---------- ADD NEW SHEET ---------- */

  const addSheet = (): void => {

    const newId = `sheet${Date.now()}`;

    const newSheet: Worksheet = {
      id: newId,
      name: `Sheet${sheets.length + 1}`,
      data: {
        data: {},
        styles: {}
      },
      rowCount: INITIAL_ROWS
    };

    setSheets((prev) => [...prev, newSheet]);

    setActiveSheetId(newId);

    setPast([]);
    setFuture([]);

    setSel({ r: 0, c: 0 });

    setEditing(false);
    setDraft('');
  };

  /* ---------- SELECT SHEET ---------- */

  const selectSheet = (id: string): void => {

    setActiveSheetId(id);

    setPast([]);
    setFuture([]);

    setSel({ r: 0, c: 0 });

    setEditing(false);
    setDraft('');
  };

  /* ---------- ADD ROWS ---------- */

  const addRows = (): void => {

    setSheets((prev) =>
      prev.map((item) =>
        item.id === activeSheetId
          ? {
              ...item,
              rowCount: Math.min(
                item.rowCount + ROWS_INCREMENT,
                MAX_ROWS
              )
            }
          : item
      )
    );
  };

  /* ---------- LOAD ---------- */

  useEffect(() => {

    fetch(`/api/sheets/${SHEET_ID}`)
      .then(async (r) => {

        if (r.status === 404) {
          return EMPTY_SHEET;
        }

        if (!r.ok) {
          throw new Error('load failed');
        }

        return (await r.json()) as SheetState;
      })
      .then((saved) => {

        latest.current = saved;

        setSheets((prev) =>
          prev.map((item) =>
            item.id === 'sheet1'
              ? {
                  ...item,
                  data: saved
                }
              : item
          )
        );

        setLoaded(true);
      })
      .catch((err) => {
        console.error(err);
      });

  }, []);

  /* ---------- SAVE ---------- */

  const flush = async (): Promise<void> => {

    if (inFlight.current) return;

    inFlight.current = true;

    while (dirty.current) {

      dirty.current = false;

      setSaveStatus('saving');

      try {

        const res = await fetch(`/api/sheets/${SHEET_ID}`, {
          method: 'PUT',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify(latest.current)
        });

        if (!res.ok) {
          throw new Error('save failed');
        }

        if (!dirty.current) {
          setSaveStatus('saved');
        }

      } catch {

        dirty.current = true;

        setSaveStatus('failed');

        break;
      }
    }

    inFlight.current = false;
  };

  const retrySave = (): void => {

    dirty.current = true;

    void flush();
  };

  const saveNow = (): void => {
  if (editing) {
    commit();
  }

  latest.current = sheet;
  dirty.current = true;
  void flush();
};

/*const saveNow = (): void => {
  latest.current = sheet;
  dirty.current = true;
  void flush();
};
*/

  /* ---------- AUTO SAVE ---------- */

  useEffect(() => {

    if (!loaded || sheet === latest.current) return;

    latest.current = sheet;

    dirty.current = true;

    const t = setTimeout(() => {
      void flush();
    }, 400);

    return () => clearTimeout(t);

  }, [sheet, loaded]);

  /* ---------- HISTORY / APPLY CHANGE ---------- */

  const applyChange = (
    updater: (s: SheetState) => SheetState
  ): void => {

    setPast((p) => [...p, sheet]);

    setFuture([]);

    setSheets((prev) =>
      prev.map((item) =>
        item.id === activeSheetId
          ? {
              ...item,
              data: updater(item.data)
            }
          : item
      )
    );
  };

  /* ---------- DRAG TO FILL ---------- */

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
        styles: newStyles
      }));
    }
  };

  /* ---------- UNDO ---------- */

  const undo = (): void => {

    if (past.length === 0) return;

    const prev = past[past.length - 1];

    setPast((p) => p.slice(0, -1));

    setFuture((f) => [sheet, ...f]);

    setSheets((prevSheets) =>
      prevSheets.map((item) =>
        item.id === activeSheetId
          ? {
              ...item,
              data: prev
            }
          : item
      )
    );

    setEditing(false);
  };

  /* ---------- REDO ---------- */

  const redo = (): void => {

    if (future.length === 0) return;

    const next = future[0];

    setFuture((f) => f.slice(1));

    setPast((p) => [...p, sheet]);

    setSheets((prevSheets) =>
      prevSheets.map((item) =>
        item.id === activeSheetId
          ? {
              ...item,
              data: next
            }
          : item
      )
    );

    setEditing(false);
  };

  /* ---------- MOVEMENT ---------- */

  const move = (dr: number, dc: number): void => {

    setSel((s) => ({
      r: Math.min(
        rowCount - 1,
        Math.max(0, s.r + dr)
      ),

      c: Math.min(
        COLS - 1,
        Math.max(0, s.c + dc)
      )
    }));
  };

  /* ---------- EDITING ---------- */

  const startEdit = (initial?: string): void => {

    setDraft(initial ?? cellValue);

    setEditSource('cell');

    setEditing(true);
  };

  const commit = (): void => {

    if (draft !== cellValue) {

      applyChange((s) => ({
        ...s,

        data: {
          ...s.data,
          [key]: draft
        }
      }));
    }

    setEditing(false);
  };

  const cancel = (): void => {
    setEditing(false);
  };

  const changeDraft = (value: string): void => {

    setEditSource('formula');

    setEditing(true);

    setDraft(value);
  };

  const selectCell = (r: number, c: number): void => {

    if (editing) commit();

    setSel({ r, c });
  };

  /* ---------- CLEAR CELL ---------- */

  const clearCell = (): void => {

    if (cellValue === '') return;

    applyChange((s) => ({
      ...s,

      data: {
        ...s.data,
        [key]: ''
      }
    }));
  };

  /* ---------- FORMATTING ---------- */

  const toggleStyle = (prop: StyleProp): void => {

    applyChange((s) => {

      const current = s.styles[key] ?? {};

      return {
        ...s,

        styles: {
          ...s.styles,

          [key]: {
            ...current,
            [prop]: !current[prop]
          }
        }
      };
    });
  };

  /* ---------- KEYBOARD ---------- */

  const onGridKeyDown = (
    e: KeyboardEvent<HTMLDivElement>
  ): void => {

    if (editing) {

      if (e.key === 'Enter') {
        e.preventDefault();
        commit();
        move(1, 0);
        refocus();
      }

      else if (e.key === 'Tab') {
        e.preventDefault();
        commit();
        move(0, 1);
        refocus();
      }

      else if (e.key === 'Escape') {
        cancel();
        refocus();
      }

      return;
    }

    if (e.ctrlKey || e.metaKey) {

      const k = e.key.toLowerCase();

      if (k === 'z') {
        e.preventDefault();

        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }

      else if (k === 'y') {
        e.preventDefault();
        redo();
      }

      else if (k === 'b') {
        e.preventDefault();
        toggleStyle('bold');
      }

      else if (k === 'i') {
        e.preventDefault();
        toggleStyle('italic');
      }

      else if (k === 'u') {
        e.preventDefault();
        toggleStyle('underline');
      }

      return;
    }

    switch (e.key) {

      case 'ArrowUp':
        e.preventDefault();
        move(-1, 0);
        break;

      case 'ArrowDown':
        e.preventDefault();
        move(1, 0);
        break;

      case 'ArrowLeft':
        e.preventDefault();
        move(0, -1);
        break;

      case 'ArrowRight':
        e.preventDefault();
        move(0, 1);
        break;

      case 'Tab':
        e.preventDefault();
        move(0, e.shiftKey ? -1 : 1);
        break;

      case 'Enter':
      case 'F2':
        e.preventDefault();
        startEdit();
        break;

      case 'Delete':
      case 'Backspace':
        clearCell();
        break;

      default:

        if (e.key.length === 1) {
          e.preventDefault();
          startEdit(e.key);
        }
    }
  };

  /* ---------- FORMULA KEYBOARD ---------- */

  const onFormulaKeyDown = (
    e: KeyboardEvent<HTMLInputElement>
  ): void => {

    if (e.key === 'Enter') {
      commit();
      refocus();
    }

    else if (e.key === 'Escape') {
      cancel();
      refocus();
    }
  };

  /* ---------- RETURN ---------- */

  return {

    sheet,
    sel,
    editing,
    draft,
    zoom,
    gridRef,

    cellEditing: editing && editSource === 'cell',

    cellValue,
    cellName,
    activeStyle,

    canUndo: past.length > 0,
    canRedo: future.length > 0,

    saveStatus,
    getComputed,

    undo,
    redo,
    retrySave,

    setZoom,
    toggleStyle,

    setDraft,
    changeDraft,
    startEdit,
    selectCell,

    onGridKeyDown,
    onFormulaKeyDown,

    fillCells,

    sheets,
    activeSheetId,
    addSheet,
    selectSheet,

    rowCount,
    addRows,

    saveNow,
  };
}
