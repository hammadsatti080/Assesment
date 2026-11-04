/*
'use client';
import { useState, useRef } from 'react';

const COLS = 26;
const ROWS = 100;
const MENUS = ['File', 'Edit', 'View', 'Insert', 'Format', 'Data', 'Tools', 'Extensions', 'Help'];
const colName = (i) => String.fromCharCode(65 + i);
const keyOf = (r, c) => `${r},${c}`;

export default function Stylesheet() {
  const [data, setData] = useState({});
  const [sel, setSel] = useState({ r: 0, c: 0 });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [title, setTitle] = useState('Untitled spreadsheet');
  const gridRef = useRef(null);

  const cellValue = data[keyOf(sel.r, sel.c)] ?? '';
  const cellName = `${colName(sel.c)}${sel.r + 1}`;

  const move = (dr, dc) =>
    setSel((s) => ({
      r: Math.min(ROWS - 1, Math.max(0, s.r + dr)),
      c: Math.min(COLS - 1, Math.max(0, s.c + dc)),
    }));

  const startEdit = (initial) => {
    setDraft(initial ?? cellValue);
    setEditing(true);
  };
  const commit = () => {
    setData((d) => ({ ...d, [keyOf(sel.r, sel.c)]: draft }));
    setEditing(false);
  };
  const cancel = () => setEditing(false);
  const refocus = () => gridRef.current?.focus();

  const onKeyDown = (e) => {
    if (editing) {
      if (e.key === 'Enter') { e.preventDefault(); commit(); move(1, 0); refocus(); }
      else if (e.key === 'Tab') { e.preventDefault(); commit(); move(0, 1); refocus(); }
      else if (e.key === 'Escape') { cancel(); refocus(); }
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
      case 'Backspace':
        setData((d) => ({ ...d, [keyOf(sel.r, sel.c)]: '' }));
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          startEdit(e.key);
        }
    }
  };

  return (
    <div className="app">
  
      <header className="topbar">
        <div className="logo">
          <span />
        </div>
        <div className="title-area">
          <input
            className="doc-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <nav className="menu">
            {MENUS.map((m) => (
              <button key={m} className="menu-item">{m}</button>
            ))}
          </nav>
        </div>
        <div className="top-actions">
          <button className="share-btn">Share</button>
          <div className="avatar">A</div>
        </div>
      </header>

   
      <div className="toolbar-wrap">
        <div className="toolbar">
          <button className="tool" title="Undo">↶</button>
          <button className="tool" title="Redo">↷</button>
          <button className="tool" title="Print">⎙</button>
          <span className="divider" />
          <button className="tool wide">100% ▾</button>
          <span className="divider" />
          <button className="tool bold">B</button>
          <button className="tool italic">I</button>
          <button className="tool underline">U</button>
        </div>
      </div>

      <div className="formula-row">
        <div className="name-box">{cellName} <span className="caret">▾</span></div>
        <div className="fx">fx</div>
        <input
          className="formula-input"
          value={editing ? draft : cellValue}
          onChange={(e) => { setEditing(true); setDraft(e.target.value); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { commit(); refocus(); }
            else if (e.key === 'Escape') { cancel(); refocus(); }
          }}
        />
      </div>

     
      <div className="grid-wrap" ref={gridRef} tabIndex={0} onKeyDown={onKeyDown}>
        <table className="grid">
          <thead>
            <tr>
              <th className="corner" />
              {Array.from({ length: COLS }, (_, c) => (
                <th key={c} className={`col-head ${sel.c === c ? 'active' : ''}`}>
                  {colName(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROWS }, (_, r) => (
              <tr key={r}>
                <th className={`row-head ${sel.r === r ? 'active' : ''}`}>{r + 1}</th>
                {Array.from({ length: COLS }, (_, c) => {
                  const isSel = sel.r === r && sel.c === c;
                  return (
                    <td
                      key={c}
                      className={`cell ${isSel ? 'selected' : ''}`}
                      onClick={() => { if (editing) commit(); setSel({ r, c }); }}
                      onDoubleClick={() => startEdit()}
                    >
                      {isSel && editing ? (
                        <input
                          className="cell-input"
                          autoFocus
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                        />
                      ) : (
                        data[keyOf(r, c)] ?? ''
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      
      <footer className="tabs">
        <button className="add-sheet">＋</button>
        <button className="add-sheet">☰</button>
        <div className="sheet-tab">Sheet1 <span className="caret">▾</span></div>
      </footer>
    </div>
  );
}

*/