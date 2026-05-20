import { useCallback, useRef, useState } from 'react';
import type { Node, Edge } from '@xyflow/react';

interface Snapshot {
  nodes: Node[];
  edges: Edge[];
}

const MAX_HISTORY = 50;

/**
 * Bounded undo/redo stack for the workflow canvas. Snapshots are pushed
 * coarsely — on commit-worthy events like drag-stop, drop, delete, accept-diff,
 * template-load — not on every onNodesChange tick (those fire dozens of times
 * during a drag and would shred the history).
 *
 * Usage:
 *   const history = useWorkflowHistory();
 *   history.push({ nodes, edges });        // after a commit-worthy change
 *   const prev = history.undo();           // returns the previous snapshot or null
 *   const next = history.redo();           // returns the next snapshot or null
 */
export function useWorkflowHistory() {
  const undoStack = useRef<Snapshot[]>([]);
  const redoStack = useRef<Snapshot[]>([]);
  const [version, setVersion] = useState(0); // bumped so React re-renders the UI guards

  const push = useCallback((snapshot: Snapshot) => {
    // Skip if identical to top of undo stack (idempotent)
    const top = undoStack.current[undoStack.current.length - 1];
    if (top && top.nodes === snapshot.nodes && top.edges === snapshot.edges) return;
    undoStack.current.push({
      nodes: [...snapshot.nodes],
      edges: [...snapshot.edges],
    });
    if (undoStack.current.length > MAX_HISTORY) undoStack.current.shift();
    redoStack.current.length = 0;
    setVersion((v) => v + 1);
  }, []);

  const undo = useCallback((current: Snapshot): Snapshot | null => {
    if (undoStack.current.length === 0) return null;
    const prev = undoStack.current.pop()!;
    redoStack.current.push({
      nodes: [...current.nodes],
      edges: [...current.edges],
    });
    setVersion((v) => v + 1);
    return prev;
  }, []);

  const redo = useCallback((current: Snapshot): Snapshot | null => {
    if (redoStack.current.length === 0) return null;
    const next = redoStack.current.pop()!;
    undoStack.current.push({
      nodes: [...current.nodes],
      edges: [...current.edges],
    });
    setVersion((v) => v + 1);
    return next;
  }, []);

  const clear = useCallback(() => {
    undoStack.current.length = 0;
    redoStack.current.length = 0;
    setVersion((v) => v + 1);
  }, []);

  // Silence unused-var lint warning for version (it's the dependency trigger)
  void version;

  return {
    push,
    undo,
    redo,
    clear,
    canUndo: undoStack.current.length > 0,
    canRedo: redoStack.current.length > 0,
  };
}
