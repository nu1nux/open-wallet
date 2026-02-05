import { type HTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export interface BalanceProps extends HTMLAttributes<HTMLDivElement> {
  amount: string;
  symbol: string;
  usdValue?: string;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Balance({
  amount,
  symbol,
  usdValue,
  loading = false,
  size = 'md',
  className,
  ...props
}: BalanceProps) {
  const sizeClasses = {
    sm: {
      amount: 'text-lg font-semibold',
      symbol: 'text-sm',
      usd: 'text-xs',
    },
    md: {
      amount: 'text-2xl font-bold',
      symbol: 'text-base',
      usd: 'text-sm',
    },
    lg: {
      amount: 'text-4xl font-bold',
      symbol: 'text-lg',
      usd: 'text-base',
    },
  };

  if (loading) {
    return (
      <div className={cn('animate-pulse', className)} {...props}>
        <div className="h-8 w-32 rounded bg-gray-200" />
        {usdValue !== undefined && (
          <div className="mt-1 h-4 w-20 rounded bg-gray-100" />
        )}
      </div>
    );
  }

  return (
    <div className={cn('', className)} {...props}>
      <div className="flex items-baseline gap-1.5">
        <span className={cn('text-gray-900', sizeClasses[size].amount)}>
          {amount}
        </span>
        <span className={cn('text-gray-500', sizeClasses[size].symbol)}>
          {symbol}
        </span>
      </div>
      {usdValue && (
        <p className={cn('mt-0.5 text-gray-400', sizeClasses[size].usd)}>
          {usdValue}
        </p>
      )}
    </div>
  );
}
