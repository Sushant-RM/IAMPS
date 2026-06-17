import type { ReactNode } from 'react';

interface SubmitButtonProps {
  loading?: boolean;
  loadingText?: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  fullWidth?: boolean;
}

const variants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20',
  secondary: 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
};

export default function SubmitButton({
  loading = false,
  loadingText = 'Saving...',
  children,
  disabled = false,
  className = '',
  variant = 'primary',
  fullWidth = true,
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className={`${fullWidth ? 'w-full' : ''} px-6 py-3.5 rounded-[12px] font-bold text-sm uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {loadingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
