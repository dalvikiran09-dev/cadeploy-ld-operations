/**
 * Avatar & Initials Utilities
 * Replaces all user avatar photos with deterministic, uppercase initials.
 */

/**
 * Generates initials from a user's display name.
 * 
 * Rules:
 * - Multi-word name ("Kiran Dalvi", "John Michael Smith") -> First letter of first name + first letter of last name ("KD", "JS")
 * - Single-word name ("Kiran", "Admin") -> First letter ("K", "A")
 * - Normalized to uppercase
 */
export function getInitials(name?: string | null): string {
  if (!name) return 'U';
  const trimmed = name.trim();
  if (!trimmed) return 'U';

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  const firstLetter = parts[0].charAt(0).toUpperCase();
  const lastLetter = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${firstLetter}${lastLetter}`;
}

/**
 * Deterministic color palette list for initials avatars.
 * Uses refined, accessible background + text styling.
 */
const AVATAR_COLOR_PALETTES = [
  'bg-blue-600 text-white',
  'bg-indigo-600 text-white',
  'bg-violet-600 text-white',
  'bg-purple-600 text-white',
  'bg-emerald-600 text-white',
  'bg-teal-600 text-white',
  'bg-cyan-600 text-white',
  'bg-sky-600 text-white',
  'bg-amber-600 text-white',
  'bg-rose-600 text-white',
  'bg-slate-700 text-white dark:bg-slate-600',
  'bg-teal-700 text-white dark:bg-teal-600',
];

/**
 * Generates a deterministic color class string based on the user's name or ID.
 */
export function getAvatarColorClass(seed: string = ''): string {
  if (!seed) return AVATAR_COLOR_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLOR_PALETTES.length;
  return AVATAR_COLOR_PALETTES[index];
}
