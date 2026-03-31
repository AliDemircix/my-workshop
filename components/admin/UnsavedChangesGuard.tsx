"use client";
import { useEffect, useRef } from 'react';

/**
 * Warns the user before navigating away when `isDirty` is true.
 * Usage: mount inside any admin edit form, pass `isDirty={formHasChanges}`.
 * When `isDirty` is omitted it defaults to `true` (always warn).
 */
export default function UnsavedChangesGuard({ isDirty = true }: { isDirty?: boolean }) {
  const dirty = useRef(isDirty);
  dirty.current = isDirty;

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirty.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  return null;
}
