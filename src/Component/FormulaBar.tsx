import type { KeyboardEvent } from 'react';

interface FormulaBarProps {
  cellName: string;
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
}

export default function FormulaBar({
  cellName,
  value,
  onChange,
  onKeyDown,
}: FormulaBarProps) {
  return (
    <div className="formula-row">
      <div className="name-box">
        {cellName} <span className="caret">▾</span>
      </div>
      <div className="fx">fx</div>
      <input
        className="formula-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}