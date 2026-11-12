import React from 'react';
import { useMarketplace } from '../context/MarketplaceContext';
import { ChevronDown, Wallet, Sparkles } from 'lucide-react';

interface HeaderProps {
  currentTab: 'explore' | 'auctions' | 'vault' | 'terminal';
  setCurrentTab: (tab: 'explore' | 'auctions' | 'vault' | 'terminal') => void;
  onOpenMintModal: () => void;
  onOpenAccountModal: () => void;
  onOpenListModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  onOpenMintModal,
  onOpenAccountModal,
  onOpenListModal,
}) => {
  const { currentAccount, pendingWithdrawals } = useMarketplace();
  const claimable = pendingWithdrawals[currentAccount.address] || 0;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark (Single text element wordmark) */}
        <button
          onClick={() => setCurrentTab('explore')}
          className="flex items-center gap-2.5 text-left text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-inner">
            <span className="font-mono text-xs font-black text-white">NV</span>
          </div>
          <span className="font-semibold tracking-tight">NFTMarketplace</span>
        </button>

        {/* Zone 2: Navigation Links (4-5 single-line clean text links) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <button
            onClick={() => setCurrentTab('explore')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'explore'
                ? 'text-white border-b-2 border-indigo-500 font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Explore Market
          </button>
          <button
            onClick={() => setCurrentTab('auctions')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'auctions'
                ? 'text-white border-b-2 border-indigo-500 font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Live Auctions
          </button>
          <button
            onClick={() => setCurrentTab('vault')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'vault'
                ? 'text-white border-b-2 border-indigo-500 font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            My Collection
          </button>
          <button
            onClick={() => setCurrentTab('terminal')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'terminal'
                ? 'text-white border-b-2 border-indigo-500 font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Contract & Escrow
          </button>
          <button
            onClick={onOpenMintModal}
            className="whitespace-nowrap shrink-0 text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Mint NFT</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action (Wallet & Actor Switcher) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenListModal}
            className="hidden sm:inline-flex items-center justify-center rounded-lg bg-neutral-800 px-3.5 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            + List Item
          </button>

          <button
            onClick={onOpenAccountModal}
            className="flex items-center gap-2.5 rounded-lg border border-neutral-800 bg-neutral-900/90 py-1.5 px-3 text-left hover:border-neutral-700 hover:bg-neutral-850 transition-all whitespace-nowrap shrink-0"
            title="Click to switch simulated actor or view address"
          >
            <img
              src={currentAccount.avatar}
              alt={currentAccount.name}
              className="h-6 w-6 rounded-full bg-neutral-800 object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="hidden sm:block text-left leading-tight">
              <div className="flex items-center gap-1.5 text-xs font-medium text-white">
                <span className="truncate max-w-[90px]">{currentAccount.name.split(' ')[0]}</span>
                {claimable > 0 && (
                  <span className="text-[10px] text-amber-400 font-mono">
                    +{claimable.toFixed(2)} ETH
                  </span>
                )}
              </div>
              <div className="font-mono text-[11px] text-neutral-400 tabular-nums">
                {currentAccount.ethBalance.toFixed(2)} ETH
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
          </button>
        </div>
      </div>
    </header>
  );
};
