import type { ToastState } from '../../lib/useToast';

const styles: Record<string, string> = {
  success: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50',
  error: 'bg-red-950/90 text-red-300 border-red-500/50',
  info: 'bg-blue-950/90 text-blue-300 border-blue-500/50',
};

const icons: Record<string, string> = {
  success: '✓',
  error: '✗',
  info: 'ℹ',
};

export default function Toast({ toast }: { toast: ToastState | null }) {
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-28 right-4 sm:right-6 z-[200] px-6 py-4 rounded-[12px] shadow-2xl border transition-all duration-300 max-w-sm ${styles[toast.type]}`}
    >
      <div className="flex items-center gap-3 font-semibold text-sm">
        <span aria-hidden="true">{icons[toast.type]}</span>
        {toast.message}
      </div>
    </div>
  );
}
