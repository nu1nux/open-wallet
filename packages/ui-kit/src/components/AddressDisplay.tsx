import { useState, type HTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export interface AddressDisplayProps extends HTMLAttributes<HTMLDivElement> {
  address: string;
  truncate?: boolean;
  truncateChars?: number;
  copyable?: boolean;
  showTooltip?: boolean;
}

export function AddressDisplay({
  address,
  truncate = true,
  truncateChars = 6,
  copyable = true,
  showTooltip = true,
  className,
  ...props
}: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  const displayAddress = truncate
    ? `${address.slice(0, truncateChars + 2)}...${address.slice(-truncateChars)}`
    : address;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 font-mono text-sm',
        className
      )}
      {...props}
    >
      <span
        className="cursor-default"
        title={showTooltip ? address : undefined}
      >
        {displayAddress}
      </span>
      {copyable && (
        <button
          onClick={handleCopy}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Copy address"
          type="button"
        >
          {copied ? (
            <svg
              className="h-4 w-4 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
