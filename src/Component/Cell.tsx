



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

  // 1) Check karein ke value percentage hai ya nahi
  const stringVal = typeof value === 'string' ? value.trim() : String(value);
  const isPercentage = stringVal.endsWith('%');
  const numericVal = isPercentage ? parseFloat(stringVal.replace('%', '')) : NaN;

  // 2) Range ke hisaab se 3 alag colors define karein
  const percentageStyle: CSSProperties = {};
  
  if (isPercentage && !isNaN(numericVal)) {
    if (numericVal <= 50) {
      // 0 se 50 tak (Soft Yellow / Orange)
      percentageStyle.backgroundColor = '#fef08a'; 
      percentageStyle.color = '#854d0e';
    } else if (numericVal > 50 && numericVal <= 80) {
      // 50 se 80 tak (Soft Blue)
      percentageStyle.backgroundColor = '#e0f2fe'; 
      percentageStyle.color = '#0369a1';
    } else {
      // 80 se above (Soft Green)
      percentageStyle.backgroundColor = '#dcfce7'; 
      percentageStyle.color = '#166534';
    }
  }

 const shouldAlignRight = isNumber || isPercentage; // <-- Yeh line upar add karein
  
  const textStyle: CSSProperties = {
    fontWeight: style.bold ? 700 : 400,
    fontStyle: style.italic ? 'italic' : 'normal',
    textDecoration: style.underline ? 'underline' : 'none',
    textAlign: shouldAlignRight ? 'right' : 'left', // <-- Yeh line add karni hai
    ...percentageStyle,
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
      style={{ 
        ...textStyle, 
        position: 'relative',
        backgroundColor: percentageStyle.backgroundColor || undefined 
      }}
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