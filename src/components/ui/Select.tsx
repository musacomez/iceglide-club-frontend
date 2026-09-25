import { SelectHTMLAttributes, forwardRef } from 'react';
import clsx from '@/lib/utils/clsx';

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, Props>(({ label, className, id, children, ...rest }, ref) => {
  const selectId = id ?? rest.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={clsx(
          'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-400',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
    </div>
  );
});
Select.displayName = 'Select';
