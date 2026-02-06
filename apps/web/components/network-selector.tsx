'use client';

import { useState, useRef, useEffect } from 'react';
import {
  ChainId,
  ChainFamily,
  getChainsByFamily,
  CHAIN_CONFIGS,
} from '@open-wallet/types';

interface NetworkSelectorProps {
  chainFamily: ChainFamily;
  selectedChainId: ChainId;
  onSelect: (chainId: ChainId) => void;
}

export function NetworkSelector({
  chainFamily,
  selectedChainId,
  onSelect,
}: NetworkSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const chains = getChainsByFamily(chainFamily);
  const selectedChain = CHAIN_CONFIGS[selectedChainId];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-950"
      >
        {selectedChain.isTestnet && (
          <span className="h-2 w-2 rounded-full bg-amber-400" />
        )}
        <span>{selectedChain.name}</span>
        <ChevronIcon isOpen={isOpen} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 z-10 mt-1 w-56 rounded-md border border-neutral-200 bg-white py-1 shadow-lg">
          {chains.map((chain) => (
            <button
              key={chain.chainId}
              type="button"
              onClick={() => {
                onSelect(chain.chainId);
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-50 ${
                chain.chainId === selectedChainId
                  ? 'bg-neutral-100 font-medium'
                  : ''
              }`}
            >
              {chain.isTestnet && (
                <span className="h-2 w-2 rounded-full bg-amber-400" />
              )}
              <span className="flex-1">{chain.name}</span>
              {chain.isTestnet && (
                <span className="text-[11px] text-neutral-400">Testnet</span>
              )}
              {chain.chainId === selectedChainId && <CheckIcon />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className={`h-4 w-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4 text-neutral-900"
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
  );
}
