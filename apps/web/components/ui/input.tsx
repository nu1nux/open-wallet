import { forwardRef, type InputHTMLAttributes } from 'react';
import { Input as BaseInput } from '@base-ui/react/input';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className = '', ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-medium text-neutral-700">
            {label}
          </label>
        )}
        <BaseInput
          id={inputId}
          ref={ref}
          className={`
            w-full rounded-md border bg-white px-3 h-9 text-sm text-neutral-900
            placeholder:text-neutral-400
            focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-0
            disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-50
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-neutral-300 hover:border-neutral-400 focus:border-neutral-900'}
            ${className}
          `.trim()}
          {...props}
        />
        {error && <p className="mt-1.5 text-[13px] text-red-600">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-[13px] text-neutral-500">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
