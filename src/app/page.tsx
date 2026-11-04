
'use client';

import TopBar from '../Component/TopBar';
import Toolbar from '../Component/Toolbar';
import FormulaBar from '../Component/FormulaBar';
import Grid from '../Component/Grid';
import SheetTabs from '../Component/SheetTabs';
import { useSheet } from '../hooks/useSheet';

export default function Page() {
  const s = useSheet();

  return (
    <div className="app">
      <TopBar
  onSave={s.saveNow}
  saveStatus={s.saveStatus}
/>

      <Toolbar
        canUndo={s.canUndo}
        canRedo={s.canRedo}
        onUndo={s.undo}
        onRedo={s.redo}
        zoom={s.zoom}
        onZoomChange={s.setZoom}
        activeStyle={s.activeStyle}
        onToggleStyle={s.toggleStyle}
      />

      <FormulaBar
        cellName={s.cellName}
        value={s.editing ? s.draft : s.cellValue}
        onChange={s.changeDraft}
        onKeyDown={s.onFormulaKeyDown}
      />

      <Grid
        gridRef={s.gridRef}
        sheet={s.sheet}
        sel={s.sel}
        editing={s.cellEditing}
        draft={s.draft}
        zoom={s.zoom}
        getComputed={s.getComputed}
        onKeyDown={s.onGridKeyDown}
        onSelect={s.selectCell}
        onStartEdit={s.startEdit}
        onDraftChange={s.setDraft}
            onFill={s.fillCells}

              // New props
  rowCount={s.rowCount}
  addRows={s.addRows}
      />

     <SheetTabs
  sheets={s.sheets}
  activeSheetId={s.activeSheetId}
  onAddSheet={s.addSheet}
  onSelectSheet={s.selectSheet}
/>
    </div>
  );
}

