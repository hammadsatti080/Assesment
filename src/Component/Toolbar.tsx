'use client';

import { useState, useRef, useEffect } from 'react';
import type { MouseEvent } from 'react';
import { ZOOM_LEVELS } from '../lib/constants';
import type { CellStyle, StyleProp } from '../lib/types';

interface ToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomChange: (z: number) => void;
  activeStyle: CellStyle;
  onToggleStyle: (prop: StyleProp) => void;
}

export default function Toolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomChange,
  activeStyle,
  onToggleStyle,
}: ToolbarProps) {
  const [zoomOpen, setZoomOpen] = useState<boolean>(false);
  const zoomRef = useRef<HTMLDivElement>(null);

  // dropdown ke bahar click karne par band ho jaye
  useEffect(() => {
    const handleClickOutside = (e: globalThis.MouseEvent): void => {
      if (zoomRef.current && !zoomRef.current.contains(e.target as Node)) {
        setZoomOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // button click se grid ka focus/selection na jaye
  const keepFocus = (e: MouseEvent): void => e.preventDefault();

  return (
    <div className="toolbar-wrap">
      <div className="toolbar">
        <button
          type="button"
          className="tool"
          title="Undo (Ctrl+Z)"
          disabled={!canUndo}
          onMouseDown={keepFocus}
          onClick={onUndo}
        >
          ↶
        </button>
        <button
          type="button"
          className="tool"
          title="Redo (Ctrl+Y)"
          disabled={!canRedo}
          onMouseDown={keepFocus}
          onClick={onRedo}
        >
          ↷
        </button>

        <span className="divider" />

        {/* Zoom dropdown */}
        <div className="zoom-wrap" ref={zoomRef}>
          <button
            type="button"
            className="tool wide"
            onClick={() => setZoomOpen((o) => !o)}
          >
            {zoom}% ▾
          </button>

          {zoomOpen && (
            <ul className="zoom-menu">
              {ZOOM_LEVELS.map((z) => (
                <li key={z}>
                  <button
                    type="button"
                    className={`zoom-option ${z === zoom ? 'active' : ''}`}
                    onClick={() => {
                      onZoomChange(z);
                      setZoomOpen(false);
                    }}
                  >
                    {z}%
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <span className="divider" />

        <button
          type="button"
          title="Bold (Ctrl+B)"
          className={`tool bold ${activeStyle.bold ? 'active' : ''}`}
          onMouseDown={keepFocus}
          onClick={() => onToggleStyle('bold')}
        >
          B
        </button>
        <button
          type="button"
          title="Italic (Ctrl+I)"
          className={`tool italic ${activeStyle.italic ? 'active' : ''}`}
          onMouseDown={keepFocus}
          onClick={() => onToggleStyle('italic')}
        >
          I
        </button>
        <button
          type="button"
          title="Underline (Ctrl+U)"
          className={`tool underline ${activeStyle.underline ? 'active' : ''}`}
          onMouseDown={keepFocus}
          onClick={() => onToggleStyle('underline')}
        >
          U
        </button>
      </div>
    </div>
  );
}