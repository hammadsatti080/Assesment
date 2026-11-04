
import type { CSSProperties } from 'react';
import type { CellStyle } from '../lib/types';

interface CellProps {
  value: string;
  style: CellStyle;
  isSelected: boolean;
  isEditing: boolean;
  isNumber: boolean;
  isError: boolean;
  isFillTarget: boolean;

  row: number;
  col: number;

  draft: string;
  onDraftChange: (value: string) => void;
  onClick: () => void;
  onDoubleClick: () => void;

  onFillStart: (row: number, col: number) => void;
  onFillEnter: (row: number, col: number) => void;
}

export default function Cell({
  value,
  style,
  isSelected,
  isEditing,
  isNumber,
  isError,
  isFillTarget,
  row,
  col,
  draft,
  onDraftChange,
  onClick,
  onDoubleClick,
  onFillStart,
  onFillEnter,
}: CellProps) {
  const textStyle: CSSProperties = {
    fontWeight: style.bold ? 700 : 400,
    fontStyle: style.italic ? 'italic' : 'normal',
    textDecoration: style.underline ? 'underline' : 'none',
  };

  const classes = [
    'cell',
    isSelected ? 'selected' : '',
    isNumber ? 'num' : '',
    isError ? 'error' : '',
    isFillTarget ? 'fill-target' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <td
      className={classes}
      style={{ ...textStyle, position: 'relative' }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseEnter={() => onFillEnter(row, col)}
    >
      {isSelected && isEditing ? (
        <input
          className="cell-input"
          style={textStyle}
          autoFocus
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
        />
      ) : (
        value
      )}

      {isSelected && !isEditing && (
        <div
          className="fill-handle"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onFillStart(row, col);
          }}
        />
      )}
    </td>
  );
}
