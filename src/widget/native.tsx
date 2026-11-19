/**
 * Home screen widget only exists on Android (see native.android.tsx).
 * Must stay .tsx: Metro tries every platform variant of .ts before any .tsx,
 * so a native.ts would shadow native.android.tsx.
 */
export function registerWidget() {}
export function refreshWidgets() {}
