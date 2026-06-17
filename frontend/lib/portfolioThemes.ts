export type PortfolioTheme =
  | 'professional'
  | 'academic'
  | 'minimal'
  | 'modern'
  | 'executive'
  | 'creative';

export const PORTFOLIO_THEMES: { id: PortfolioTheme; label: string; exportTemplate: string }[] = [
  { id: 'professional', label: 'Professional', exportTemplate: 'professional' },
  { id: 'academic', label: 'Academic', exportTemplate: 'academic' },
  { id: 'minimal', label: 'Minimal', exportTemplate: 'minimal' },
  { id: 'modern', label: 'Modern', exportTemplate: 'modern' },
  { id: 'executive', label: 'Executive', exportTemplate: 'executive' },
];

export function normalizeTheme(value?: string): PortfolioTheme {
  const allowed: PortfolioTheme[] = ['professional', 'academic', 'minimal', 'modern', 'executive', 'creative'];
  if (value && allowed.includes(value as PortfolioTheme)) return value as PortfolioTheme;
  return 'professional';
}

export function getPreviewFontClass(theme: PortfolioTheme): string {
  if (theme === 'academic') return 'font-serif';
  if (theme === 'creative' || theme === 'modern') return 'font-sans';
  if (theme === 'minimal') return 'font-sans tracking-tight';
  return 'font-sans';
}

export function getThemeAccent(theme: PortfolioTheme) {
  switch (theme) {
    case 'academic':
      return { bar: 'bg-slate-800', heading: 'text-slate-800', badge: 'bg-slate-100 text-slate-700 border-slate-200', border: 'border-slate-300' };
    case 'minimal':
      return { bar: 'bg-slate-400', heading: 'text-slate-500', badge: 'bg-slate-50 text-slate-600 border-slate-200', border: 'border-slate-200' };
    case 'modern':
      return { bar: 'bg-gradient-to-r from-blue-600 to-indigo-600', heading: 'text-blue-600', badge: 'bg-blue-50 text-blue-700 border-blue-100', border: 'border-blue-100' };
    case 'executive':
      return { bar: 'bg-slate-900', heading: 'text-slate-900', badge: 'bg-slate-100 text-slate-800 border-slate-300', border: 'border-slate-300' };
    case 'creative':
      return { bar: 'bg-purple-600', heading: 'text-purple-600', badge: 'bg-purple-50 text-purple-700 border-purple-100', border: 'border-purple-100' };
    default:
      return { bar: 'bg-indigo-600', heading: 'text-indigo-600', badge: 'bg-indigo-50 text-indigo-700 border-indigo-100', border: 'border-indigo-100' };
  }
}
