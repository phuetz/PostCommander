import { useEffect } from 'react';

interface ShortcutHandlers {
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
  onCommandPalette?: () => void;
  onToggleChat?: () => void;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}

/**
 * Global keyboard shortcuts for the workflow editor.
 *
 *  Cmd/Ctrl+S        → save
 *  Cmd/Ctrl+Z        → undo
 *  Cmd/Ctrl+Shift+Z  → redo
 *  Cmd/Ctrl+Y        → redo (Windows-style alias)
 *  Delete/Backspace  → delete selected node (ignored when typing)
 *  Cmd/Ctrl+K        → open command palette
 *  Cmd/Ctrl+/        → toggle chat
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      // Delete: only when NOT editing a text field
      if ((key === 'delete' || key === 'backspace') && !isEditableTarget(e.target)) {
        if (handlers.onDelete) {
          e.preventDefault();
          handlers.onDelete();
        }
        return;
      }

      if (!mod) return;

      if (key === 's') {
        e.preventDefault();
        handlers.onSave?.();
      } else if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handlers.onUndo?.();
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault();
        handlers.onRedo?.();
      } else if (key === 'k') {
        e.preventDefault();
        handlers.onCommandPalette?.();
      } else if (key === '/') {
        e.preventDefault();
        handlers.onToggleChat?.();
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handlers]);
}
