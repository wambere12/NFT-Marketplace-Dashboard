import React, { useState } from 'react';
import { MarketplaceProvider, useMarketplace } from './context/MarketplaceContext';
import { Header } from './components/Header';
import { TimeMachineBar } from './components/TimeMachineBar';
import { NFTCard } from './components/NFTCard';
import { NFTDetailModal } from './components/NFTDetailModal';
import { ListItemModal } from './components/ListItemModal';
import { MintNFTModal } from './components/MintNFTModal';
import { AccountSwitcherModal } from './components/AccountSwitcherModal';
import { ContractTerminal } from './components/ContractTerminal';
import { NFTItem } from './types/marketplace';
import {
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Clock,
  Layers,
  Tag,
  Plus,
} from 'lucide-react';

const MarketplaceContent: React.FC = () => {
  const { nfts, currentAccount, currentBlockTimestamp } = useMarketplace();

  // Navigation & modal states
  const [currentTab, setCurrentTab] = useState<'explore' | 'auctions' | 'vault' | 'terminal'>('explore');
  const [selectedNFT, setSelectedNFT] = useState<NFTItem | null>(null);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Search & Filter controls
  const [searchQuery, setSearchQuery] = useState('');
  const [marketFilter, setMarketFilter] = useState<'all' | 'fixed' | 'auction' | 'ending_soon'>('all');

  // Filtered items logic
  const filteredNFTs = nfts.filter((nft) => {
    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = nft.name.toLowerCase().includes(q);
      const matchCol = nft.collectionName.toLowerCase().includes(q);
      const matchId = nft.tokenId.toString().includes(q);
      if (!matchName && !matchCol && !matchId) return false;
    }

    // Tab-specific filters
    if (currentTab === 'auctions') {
      return nft.listing?.active && nft.listing?.isAuction;
    }

    if (currentTab === 'vault') {
      return nft.owner.toLowerCase() === currentAccount.address.toLowerCase();
    }

    // Explore tab filters
    if (marketFilter === 'fixed') {
      return nft.listing?.active && !nft.listing?.isAuction;
    }
    if (marketFilter === 'auction') {
      return nft.listing?.active && nft.listing?.isAuction;
    }
    if (marketFilter === 'ending_soon') {
      return (
        nft.listing?.active &&
        nft.listing?.isAuction &&
        nft.listing.endTime > 0 &&
        nft.listing.endTime - currentBlockTimestamp < 7200
      );
    }

    return true;
  });

  // Featured Hero Showcase NFT (e.g. Cyber Monolith or first active auction)
  const featuredNFT = nfts.find((n) => n.listing?.active && n.listing.isAuction) || nfts[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0f] text-neutral-100 font-sans">
      {/* 3-Zone Top Navigation Bar */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenMintModal={() => setIsMintModalOpen(true)}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        onOpenListModal={() => setIsListModalOpen(true)}
      />

      {/* EVM Block & Escrow Status Bar */}
      <TimeMachineBar />

      {/* Main Viewport Router */}
      <main className="flex-1">
        {currentTab === 'terminal' ? (
          <ContractTerminal />
        ) : (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-10">
            {/* STOREFRONT HERO SHOWCASE (Shown on Explore tab) */}
            {currentTab === 'explore' && featuredNFT && featuredNFT.listing && (
              <section className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900/90 via-neutral-900/60 to-neutral-950 p-6 md:p-10 shadow-2xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 space-y-5">
                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                      <span>Curated Spotlight</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{featuredNFT.collectionName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-indigo-400">EIP-2981 Verified</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15] text-balance">
                      {featuredNFT.name}
                    </h1>

                    <p className="text-sm sm:text-base text-neutral-400 max-w-xl leading-relaxed">
                      {featuredNFT.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-6 pt-2">
                      <div>
                        <span className="block text-xs text-neutral-500 uppercase tracking-wider">
                          Current Highest Bid
                        </span>
                        <span className="font-mono text-2xl font-bold text-white tabular-nums">
                          {featuredNFT.listing.highestBid > 0
                            ? `${featuredNFT.listing.highestBid.toFixed(3)} ETH`
                            : `${featuredNFT.listing.price.toFixed(3)} ETH`}
                        </span>
                      </div>

                      <div className="h-8 w-px bg-neutral-800 hidden sm:block" />

                      <div>
                        <span className="block text-xs text-neutral-500 uppercase tracking-wider">
                          Contract Fee & Royalty
                        </span>
                        <span className="font-mono text-xs text-neutral-300">
                          2.5% Platform · {((featuredNFT.royaltyBps || 500) / 100).toFixed(1)}% Creator
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                      <button
                        onClick={() => setSelectedNFT(featuredNFT)}
                        className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors shadow-lg flex items-center gap-2 whitespace-nowrap"
                      >
                        <span>Inspect & Place Bid</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => setCurrentTab('terminal')}
                        className="rounded-lg border border-neutral-700 bg-neutral-800/80 px-4 py-2.5 text-sm font-medium text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors whitespace-nowrap"
                      >
                        Inspect Smart Contract
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-5">
                    <div
                      onClick={() => setSelectedNFT(featuredNFT)}
                      className="group cursor-pointer relative aspect-square w-full max-w-md mx-auto rounded-xl overflow-hidden border border-neutral-700/80 bg-neutral-950 shadow-2xl"
                    >
                      <img
                        src={featuredNFT.imageUrl}
                        alt={featuredNFT.name}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-neutral-950/80 backdrop-blur-md p-3 border border-neutral-800 flex items-center justify-between text-xs">
                        <span className="text-neutral-300 font-medium">Live English Auction</span>
                        <span className="font-mono text-indigo-400 font-semibold tabular-nums">
                          Token #{featuredNFT.tokenId}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* TAB TITLE & CONTEXT HEADER (When not in home explore) */}
            {currentTab === 'auctions' && (
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Live Timed Auctions</h1>
                <p className="mt-1 text-xs text-neutral-400">
                  English auctions with 5% minimum bid increment rule and pull-payment escrow refunds.
                </p>
              </div>
            )}

            {currentTab === 'vault' && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white">
                    {currentAccount.name.split(' ')[0]}&apos;s Collection Vault
                  </h1>
                  <p className="mt-1 text-xs text-neutral-400">
                    NFTs currently owned by {currentAccount.address.slice(0, 8)}...{currentAccount.address.slice(-6)}.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsListModalOpen(true)}
                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4" />
                    <span>List New Item</span>
                  </button>
                  <button
                    onClick={() => setIsMintModalOpen(true)}
                    className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-3.5 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors whitespace-nowrap"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Mint Token</span>
                  </button>
                </div>
              </div>
            )}

            {/* INTERACTIVE CONTROLS BAR (Search, Filters, Segments) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
              {/* Segmented Filter Buttons (Clean functional buttons) */}
              <div className="flex items-center gap-1 p-1 bg-neutral-900 rounded-lg border border-neutral-800 text-xs self-start">
                <button
                  onClick={() => setMarketFilter('all')}
                  className={`px-3 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap ${
                    marketFilter === 'all'
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  All Items ({nfts.length})
                </button>
                <button
                  onClick={() => setMarketFilter('fixed')}
                  className={`px-3 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap ${
                    marketFilter === 'fixed'
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Buy Now
                </button>
                <button
                  onClick={() => setMarketFilter('auction')}
                  className={`px-3 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap ${
                    marketFilter === 'auction'
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Auctions
                </button>
                <button
                  onClick={() => setMarketFilter('ending_soon')}
                  className={`px-3 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap ${
                    marketFilter === 'ending_soon'
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Ending Soon
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search token name or ID..."
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 py-1.5 pl-9 pr-3 text-xs text-white placeholder-neutral-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* PRODUCT GRID (3-column desktop, 2-column tablet) */}
            {filteredNFTs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-800 py-16 text-center space-y-3">
                <Tag className="mx-auto h-8 w-8 text-neutral-600" />
                <h3 className="text-sm font-semibold text-neutral-300">No items match your criteria</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Try adjusting your filters, searching for a different token, or minting a new NFT.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setMarketFilter('all');
                  }}
                  className="rounded-lg bg-neutral-800 px-3 py-1.5 text-xs text-neutral-200 hover:bg-neutral-700"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredNFTs.map((nft) => (
                  <NFTCard key={`${nft.contractAddress}-${nft.tokenId}`} nft={nft} onSelect={setSelectedNFT} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* FOOTER (Quiet, clean typography, anti-slop, no fake engines) */}
      <footer className="border-t border-neutral-800/80 bg-neutral-950/80 py-8 text-xs text-neutral-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-neutral-400">
            <span className="font-semibold text-neutral-300">NFTMarketplace</span>
            <span aria-hidden="true">·</span>
            <span>Solidity ^0.8.24</span>
            <span aria-hidden="true">·</span>
            <span>OpenZeppelin ReentrancyGuard & Ownable</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setCurrentTab('terminal')}
              className="hover:text-white transition-colors"
            >
              Contract Source
            </button>
            <button
              onClick={() => setIsMintModalOpen(true)}
              className="hover:text-white transition-colors"
            >
              Mint Demo Token
            </button>
            <button
              onClick={() => setIsAccountModalOpen(true)}
              className="hover:text-white transition-colors"
            >
              Switch Actor
            </button>
          </div>
        </div>
      </footer>

      {/* Interactive Modals */}
      <NFTDetailModal
        nft={selectedNFT}
        onClose={() => setSelectedNFT(null)}
        onOpenListModalForNFT={(item) => {
          setSelectedNFT(null);
          setIsListModalOpen(true);
        }}
      />

      <ListItemModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        preselectedNFT={selectedNFT}
      />

      <MintNFTModal
        isOpen={isMintModalOpen}
        onClose={() => setIsMintModalOpen(false)}
      />

      <AccountSwitcherModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <MarketplaceProvider>
      <MarketplaceContent />
    </MarketplaceProvider>
  );
}
