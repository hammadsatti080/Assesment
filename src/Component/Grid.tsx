

import { useState } from 'react';
import type { KeyboardEvent, RefObject } from 'react';
import Cell from './Cell';
import { COLS, ROWS, colName, keyOf } from '../lib/constants';
import type { Computed } from '../lib/formula';
import type { Position, SheetState } from '../lib/types';

interface GridProps {
  gridRef: RefObject<HTMLDivElement | null>;
  sheet: SheetState;
  sel: Position;
  editing: boolean;
  draft: string;
  zoom: number;
  getComputed: (r: number, c: number) => Computed;
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
  onSelect: (r: number, c: number) => void;
  onStartEdit: () => void;
  onDraftChange: (value: string) => void;

  onFill: (
    sr: number,
    sc: number,
    er: number,
    ec: number
  ) => void;
}

export default function Grid({
  gridRef,
  sheet,
  sel,
  editing,
  draft,
  zoom,
  getComputed,
  onKeyDown,
  onSelect,
  onStartEdit,
  onDraftChange,
  onFill,
}: GridProps) {

  const [fillDrag, setFillDrag] = useState<{
    sr: number;
    sc: number;
    er: number;
    ec: number;
  } | null>(null);

  const handleFillStart = (row: number, col: number) => {
    setFillDrag({
      sr: row,
      sc: col,
      er: row,
      ec: col,
    });
  };

  const handleFillEnter = (row: number, col: number) => {
    setFillDrag((prev) =>
      prev ? { ...prev, er: row, ec: col } : null
    );
  };

  const handleFillEnd = () => {
    if (!fillDrag) return;

    onFill(
      fillDrag.sr,
      fillDrag.sc,
      fillDrag.er,
      fillDrag.ec
    );

    setFillDrag(null);
  };

  return (
    <div
      className="grid-wrap"
      ref={gridRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseUp={handleFillEnd}
      onMouseLeave={handleFillEnd}
    >
      <table className="grid" style={{ zoom: zoom / 100 }}>
        <thead>
          <tr>
            <th className="corner" />

            {Array.from({ length: COLS }, (_, c) => (
              <th
                key={c}
                className={`col-head ${
                  sel.c === c ? 'active' : ''
                }`}
              >
                {colName(c)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: ROWS }, (_, r) => (
            <tr key={r}>
              <th
                className={`row-head ${
                  sel.r === r ? 'active' : ''
                }`}
              >
                {r + 1}
              </th>

              {Array.from({ length: COLS }, (_, c) => {
                const k = keyOf(r, c);
                const computed = getComputed(r, c);

                const isFillTarget =
                  !!fillDrag &&
                  r >= Math.min(fillDrag.sr, fillDrag.er) &&
                  r <= Math.max(fillDrag.sr, fillDrag.er) &&
                  c >= Math.min(fillDrag.sc, fillDrag.ec) &&
                  c <= Math.max(fillDrag.sc, fillDrag.ec);

                return (
                  <Cell
                    key={c}
                    row={r}
                    col={c}
                    value={computed.display}
                    isNumber={
                      typeof computed.value === 'number' &&
                      computed.error === null
                    }
                    isError={computed.error !== null}
                    style={sheet.styles[k] ?? {}}
                    isSelected={sel.r === r && sel.c === c}
                    isEditing={editing}
                    draft={draft}
                    isFillTarget={isFillTarget}
                    onDraftChange={onDraftChange}
                    onClick={() => onSelect(r, c)}
                    onDoubleClick={() => onStartEdit()}
                    onFillStart={handleFillStart}
                    onFillEnter={handleFillEnter}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
