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
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 rounded border border-neutral-200 bg-white px-2 py-1 text-[11px] font-medium text-neutral-600 hover:bg-neutral-50"
      >
        {selectedChain.isTestnet && (
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        )}
        <span>{selectedChain.shortName.toUpperCase()}</span>
        <svg
          className={`h-3 w-3 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-1 w-48 rounded border border-neutral-200 bg-white py-1 shadow-lg">
          {chains.map((chain) => (
            <button
              key={chain.chainId}
              type="button"
              onClick={() => {
                onSelect(chain.chainId);
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] hover:bg-neutral-50 ${
                chain.chainId === selectedChainId ? 'bg-neutral-100 font-medium' : ''
              }`}
            >
              {chain.isTestnet && (
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              )}
              <span className="flex-1">{chain.name}</span>
              {chain.chainId === selectedChainId && (
                <svg className="h-3 w-3 text-neutral-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
