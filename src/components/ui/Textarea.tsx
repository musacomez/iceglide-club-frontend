import { TextareaHTMLAttributes, forwardRef } from 'react';
import clsx from '@/lib/utils/clsx';

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(({ label, className, id, ...rest }, ref) => {
  const textareaId = id ?? rest.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={3}
        className={clsx(
          'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400',
          className,
        )}
        {...rest}
      />
    </div>
  );
});
Textarea.displayName = 'Textarea';
