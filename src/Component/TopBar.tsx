'use client';

import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';

interface TopBarProps {
  onSave: () => void;
  saveStatus: 'saved' | 'saving' | 'failed';
}

type Theme = 'light' | 'dark';

export default function TopBar({ onSave, saveStatus }: TopBarProps) {
  const [title, setTitle] = useState<string>('Untitled spreadsheet');
  const [theme, setTheme] = useState<Theme>('light');

  // Load saved theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setTitle(e.target.value);
  };

  // Toggle between light and dark theme
  const toggleTheme = (): void => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';

    setTheme(newTheme);

    document.documentElement.setAttribute('data-theme', newTheme);

    localStorage.setItem('theme', newTheme);
  };

  return (
    <header className="topbar">
      <div className="logo">
        <span />
      </div>

      <div className="title-area">
        <input
          className="doc-title"
          value={title}
          onChange={handleTitleChange}
        />
      </div>

      <div className="top-actions">

        {/* Theme Toggle */}
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>

        {/* Save Button */}
        <button
          type="button"
          className="save-btn"
          onClick={onSave}
        >
          Save
        </button>

        {/* Save Status */}
        <span>
          {saveStatus === 'saved'
            ? 'Saved'
            : saveStatus === 'saving'
              ? 'Saving...'
              : 'Save failed'}
        </span>

        {/* Share Button */}
        <button type="button" className="share-btn">
          Share
        </button>

        <div className="avatar">A</div>

      </div>
    </header>
  );
}
