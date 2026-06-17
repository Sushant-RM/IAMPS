import type { ReactNode } from 'react';

type InputType = 'text' | 'email' | 'password' | 'number' | 'date' | 'url' | 'time' | 'file' | 'select' | 'textarea';

interface FormFieldProps {
  label: string;
  name: string;
  type?: InputType;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onBlur?: () => void;
  error?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  options?: { value: string; label: string }[];
  accept?: string;
  autoComplete?: string;
  children?: ReactNode;
  className?: string;
}

const inputClass =
  'w-full bg-slate-900 border border-slate-800 rounded-[12px] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all disabled:opacity-50';

const errorClass = 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500';

export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  hint,
  required,
  placeholder,
  disabled,
  rows = 4,
  options,
  accept,
  autoComplete,
  children,
  className = '',
}: FormFieldProps) {
  const fieldId = `field-${name}`;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;

  const baseProps = {
    id: fieldId,
    name,
    disabled,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : hint ? hintId : undefined,
    className: `${inputClass} ${error ? errorClass : ''} ${className}`,
  };

  return (
    <div className="space-y-2">
      <label htmlFor={fieldId} className="block text-sm font-semibold text-slate-200">
        {label}
        {required && <span className="text-red-400 ml-1" aria-hidden="true">*</span>}
      </label>

      {children}

      {!children && type === 'select' && options ? (
        <select
          {...baseProps}
          value={value as string}
          onChange={onChange}
          onBlur={onBlur}
          required={required}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : !children && type === 'textarea' ? (
        <textarea
          {...baseProps}
          value={value as string}
          onChange={onChange}
          onBlur={onBlur}
          required={required}
          placeholder={placeholder}
          rows={rows}
        />
      ) : !children && type === 'file' ? (
        <input
          {...baseProps}
          type="file"
          accept={accept}
          onChange={onChange}
          onBlur={onBlur}
          className={`${inputClass} file:mr-4 file:py-2 file:px-4 file:rounded-[8px] file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 ${error ? errorClass : ''}`}
        />
      ) : !children ? (
        <input
          {...baseProps}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
      ) : null}

      {hint && !error && (
        <p id={hintId} className="text-xs text-slate-500">{hint}</p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-semibold text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
