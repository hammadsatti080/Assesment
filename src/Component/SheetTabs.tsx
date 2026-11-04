/*
export default function SheetTabs() {
  return (
    <footer className="tabs">
      <button className="add-sheet">＋</button>
      <button className="add-sheet">☰</button>
      <div className="sheet-tab">
        Sheet1 <span className="caret">▾</span>
      </div>
    </footer>
  );
}
  */

interface SheetTabsProps {
  sheets: { id: string; name: string }[];
  activeSheetId: string;
  onAddSheet: () => void;
  onSelectSheet: (id: string) => void;
}

export default function SheetTabs({
  sheets,
  activeSheetId,
  onAddSheet,
  onSelectSheet,
}: SheetTabsProps) {
  return (
    <footer className="tabs">
      <button className="add-sheet" onClick={onAddSheet}>
        ＋
      </button>

      <button className="add-sheet">☰</button>

      {sheets.map((sheet) => (
        <div
          key={sheet.id}
          className={`sheet-tab ${
            activeSheetId === sheet.id ? 'active' : ''
          }`}
          onClick={() => onSelectSheet(sheet.id)}
        >
          {sheet.name} <span className="caret">▾</span>
        </div>
      ))}
    </footer>
  );
}