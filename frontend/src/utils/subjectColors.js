/**
 * Utilities for subject color management.
 * Colors are stored on each subject document as `subject.color`.
 * This module provides a hook and helper to resolve a subject's color
 * from the subjects array anywhere in the app.
 */

/** A curated palette of vibrant, accessible colors users can choose from. */
export const SUBJECT_COLOR_PALETTE = [
  '#ef5a1b', // sunset-orange
  '#f8b51b', // sunset-gold
  '#c72c3c', // sunset-ruby
  '#7e235d', // sunset-plum
  '#2f1a72', // sunset-deep
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f97316', // amber-orange
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#a855f7', // purple
  '#14b8a6', // teal
  '#f43f5e', // rose
  '#eab308', // yellow
];

/** Fallback color when a subject has none set. */
export const DEFAULT_SUBJECT_COLOR = '#ef5a1b';

/**
 * Given a subjectId and a subjects array, returns the subject's `color`
 * or the default color if none is stored.
 */
export function getSubjectColor(subjectId, subjects = []) {
  const sub = subjects.find((s) => s._id === subjectId);
  return sub?.color || DEFAULT_SUBJECT_COLOR;
}
