import { InputHTMLAttributes, forwardRef } from 'react';
import clsx from '@/lib/utils/clsx';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(({ label, error, className, id, ...rest }, ref) => {
  const inputId = id ?? rest.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={clsx(
          'w-full rounded-lg border px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400',
          error ? 'border-rose-400' : 'border-slate-300',
          className,
        )}
        {...rest}
      />
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </div>
  );
});
Input.displayName = 'Input';
