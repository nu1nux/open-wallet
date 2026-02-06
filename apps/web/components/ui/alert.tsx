import type { HTMLAttributes, ReactNode } from 'react';

const variants = {
  info: 'border-neutral-200 bg-neutral-50 text-neutral-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  error: 'border-red-200 bg-red-50 text-red-800',
};

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof variants;
  title?: string;
  icon?: ReactNode;
}

export function Alert({ variant = 'info', title, icon, children, className = '', ...props }: AlertProps) {
  return (
    <div className={`rounded-md border p-3 ${variants[variant]} ${className}`} {...props}>
      <div className="flex items-start">
        {icon && <div className="flex-shrink-0">{icon}</div>}
        <div className={icon ? 'ml-2.5' : ''}>
          {title && <h3 className="mb-0.5 text-sm font-medium">{title}</h3>}
          <div className="text-[13px]">{children}</div>
        </div>
      </div>
    </div>
  );
}
