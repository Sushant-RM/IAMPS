import type { ReactNode } from 'react';

interface FormAlertProps {
  type?: 'error' | 'success' | 'info';
  children: ReactNode;
}

const styles = {
  error: 'bg-red-950/40 border-red-500/40 text-red-300',
  success: 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300',
  info: 'bg-blue-950/40 border-blue-500/40 text-blue-300',
};

export default function FormAlert({ type = 'error', children }: FormAlertProps) {
  return (
    <div
      role="alert"
      className={`mb-6 p-4 border rounded-[12px] text-sm font-medium flex items-start gap-3 ${styles[type]}`}
    >
      <span aria-hidden="true" className="shrink-0 mt-0.5">
        {type === 'error' ? '✗' : type === 'success' ? '✓' : 'ℹ'}
      </span>
      <div>{children}</div>
    </div>
  );
}
