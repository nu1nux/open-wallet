import { Field as BaseField } from '@base-ui/react/field';
import { Input as BaseInput } from '@base-ui/react/input';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/* ── Field (root wrapper) ── */

interface FieldProps extends ComponentPropsWithoutRef<typeof BaseField.Root> {
  children: ReactNode;
}

function FieldRoot({ className = '', children, ...props }: FieldProps) {
  return (
    <BaseField.Root className={`w-full ${className}`.trim()} {...props}>
      {children}
    </BaseField.Root>
  );
}

/* ── Sub-components ── */

function FieldLabel({ className = '', ...props }: ComponentPropsWithoutRef<typeof BaseField.Label>) {
  return (
    <BaseField.Label
      className={`mb-1.5 block text-[13px] font-medium text-neutral-700 ${className}`.trim()}
      {...props}
    />
  );
}

function FieldControl({ className = '', ...props }: ComponentPropsWithoutRef<typeof BaseInput>) {
  return (
    <BaseInput
      className={`
        w-full rounded-md border bg-white px-3 h-9 text-sm text-neutral-900
        placeholder:text-neutral-400
        focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-0
        disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-50
        data-[invalid]:border-red-500 data-[invalid]:focus:border-red-500 data-[invalid]:focus:ring-red-500
        border-neutral-300 hover:border-neutral-400 focus:border-neutral-900
        ${className}
      `.trim()}
      render={<BaseField.Control />}
      {...props}
    />
  );
}

function FieldError({ className = '', ...props }: ComponentPropsWithoutRef<typeof BaseField.Error>) {
  return (
    <BaseField.Error
      className={`mt-1.5 text-[13px] text-red-600 ${className}`.trim()}
      {...props}
    />
  );
}

function FieldDescription({ className = '', ...props }: ComponentPropsWithoutRef<typeof BaseField.Description>) {
  return (
    <BaseField.Description
      className={`mt-1.5 text-[13px] text-neutral-500 ${className}`.trim()}
      {...props}
    />
  );
}

export const Field = Object.assign(FieldRoot, {
  Label: FieldLabel,
  Control: FieldControl,
  Error: FieldError,
  Description: FieldDescription,
});
