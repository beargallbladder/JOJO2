export function formatPScore(p: number): string {
  return p.toFixed(3);
}

export function formatPercent(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

export function formatVinCode(code: string): string {
  // Group: XXX XXXX XXXX XXXXXX
  return `${code.slice(0, 3)} ${code.slice(3, 7)} ${code.slice(7, 11)} ${code.slice(11)}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}
