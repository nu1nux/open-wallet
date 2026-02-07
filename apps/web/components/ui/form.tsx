import { Form as BaseForm } from '@base-ui/react/form';
import type { ComponentPropsWithoutRef } from 'react';

interface FormProps extends ComponentPropsWithoutRef<typeof BaseForm> {}

export function Form({ className = '', ...props }: FormProps) {
  return <BaseForm className={`space-y-4 ${className}`.trim()} {...props} />;
}
