const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Oct 4, 2026" from an ISO date or date-time string. */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const initials = (name: string) =>
  name
    .split(/[\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
