'use client';

import { useState } from 'react';
import type { ChangeEvent } from 'react';

interface TopBarProps {
  onSave: () => void;
  saveStatus: 'saved' | 'saving' | 'failed';
}

export default function TopBar({ onSave, saveStatus }: TopBarProps) {
  const [title, setTitle] = useState<string>('Untitled spreadsheet');

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setTitle(e.target.value);
  };

  return (
    <header className="topbar">
      <div className="logo"><span /></div>

      <div className="title-area">
        <input
          className="doc-title"
          value={title}
          onChange={handleTitleChange}
        />
      </div>

      <div className="top-actions">
        <button type="button" className="save-btn" onClick={onSave}>
          Save
        </button>

          <span>
    {saveStatus === 'saved' ? 'Saved' :
     saveStatus === 'saving' ? 'Saving...' :
     'Save failed'}
  </span>

        <button type="button" className="share-btn">Share</button>
        <div className="avatar">A</div>
      </div>
    </header>
  );
}