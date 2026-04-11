const HANDLE_REGEX = /^[a-z0-9_]{3,20}$/;

export const RESERVED_WORDS = [
  'admin', 'support', 'sharedkitchen', 'help', 'system',
  'mod', 'moderator', 'official', 'team', 'staff',
  'null', 'undefined', 'api', 'www', 'app',
];

export const PROFILE_SELECT = 'id, display_name, avatar_url, handle';

export function validateHandle(handle: string): { valid: boolean; error?: string } {
  if (handle.length < 3) return { valid: false, error: 'Must be at least 3 characters' };
  if (handle.length > 20) return { valid: false, error: 'Must be 20 characters or less' };
  if (!HANDLE_REGEX.test(handle)) return { valid: false, error: 'Only lowercase letters, numbers, and underscores' };
  if (RESERVED_WORDS.includes(handle)) return { valid: false, error: 'This username is reserved' };
  return { valid: true };
}

export function suggestHandle(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 15) || 'user';
}

export function suggestAlternatives(base: string): string[] {
  const suffix1 = Math.floor(Math.random() * 90 + 10);
  const suffix2 = Math.floor(Math.random() * 90 + 10);
  const suffix3 = Math.floor(Math.random() * 90 + 10);
  return [`${base}${suffix1}`, `${base}${suffix2}`, `${base}_${suffix3}`];
}
