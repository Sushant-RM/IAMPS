export function formatPdfUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const host =
    typeof window !== 'undefined'
      ? `http://${window.location.hostname}:5000`
      : 'http://localhost:5000';
  return `${host}${url.startsWith('/') ? '' : '/'}${url}`;
}
