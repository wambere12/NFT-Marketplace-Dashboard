import React from 'react';
import { NFTItem } from '../types/marketplace';
import { useMarketplace } from '../context/MarketplaceContext';
import { Clock, Tag, Flame, CheckCircle } from 'lucide-react';

interface NFTCardProps {
  nft: NFTItem;
  onSelect: (nft: NFTItem) => void;
}

export const NFTCard: React.FC<NFTCardProps> = ({ nft, onSelect }) => {
  const { currentBlockTimestamp, currentAccount } = useMarketplace();
  const listing = nft.listing;
  const isAuction = listing?.isAuction;
  const isActive = listing?.active;

  // Calculate auction time remaining
  let timeRemainingText = '';
  let isEnded = false;
  if (isAuction && listing && listing.endTime > 0) {
    const diff = listing.endTime - currentBlockTimestamp;
    if (diff <= 0) {
      isEnded = true;
      timeRemainingText = 'Ended (Ready to Settle)';
    } else {
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;
      if (hours > 0) {
        timeRemainingText = `${hours}h ${minutes}m ${seconds}s`;
      } else {
        timeRemainingText = `${minutes}m ${seconds}s`;
      }
    }
  }

  const isOwner = nft.owner.toLowerCase() === currentAccount.address.toLowerCase();

  return (
    <div
      onClick={() => onSelect(nft)}
      className="group cursor-pointer rounded-xl border border-neutral-800 bg-neutral-900/70 p-3 transition-all duration-200 hover:-translate-y-1 hover:border-neutral-700 hover:bg-neutral-850 hover:shadow-xl flex flex-col justify-between"
    >
      <div>
        {/* Artwork Container (65-75% visual dominance) */}
        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-neutral-950">
          <img
            src={nft.imageUrl}
            alt={nft.name}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Quiet overlay indicator if auction or unlisted */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs">
            {isActive && isAuction && (
              <span className={`flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[11px] tabular-nums backdrop-blur-md ${
                isEnded ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60' : 'bg-neutral-950/80 text-white border border-neutral-800'
              }`}>
                <Clock className="h-3 w-3 text-indigo-400" />
                <span>{timeRemainingText}</span>
              </span>
            )}

            {isActive && !isAuction && (
              <span className="flex items-center gap-1.5 rounded-md bg-neutral-950/80 px-2 py-1 font-mono text-[11px] text-neutral-300 border border-neutral-800 backdrop-blur-md">
                <Tag className="h-3 w-3 text-emerald-400" />
                <span>Fixed Price</span>
              </span>
            )}

            {!isActive && (
              <span className="flex items-center gap-1 rounded-md bg-neutral-950/80 px-2 py-1 font-mono text-[11px] text-neutral-400 border border-neutral-800 backdrop-blur-md">
                Unlisted
              </span>
            )}

            {isOwner && (
              <span className="ml-auto rounded-md bg-indigo-950/80 border border-indigo-800/60 px-2 py-0.5 text-[10px] font-medium text-indigo-300 backdrop-blur-md">
                You Own
              </span>
            )}
          </div>
        </div>

        {/* NFT Metadata */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span className="truncate">{nft.collectionName}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">#{nft.tokenId}</span>
            <span aria-hidden="true">·</span>
            <span className="text-[11px] text-neutral-400">{((nft.royaltyBps || 0) / 100).toFixed(1)}% Royalty</span>
          </div>

          <h3 className="text-base font-semibold text-white tracking-tight group-hover:text-indigo-400 transition-colors truncate">
            {nft.name}
          </h3>
        </div>
      </div>

      {/* Pricing / Bid Action Area */}
      <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
        <div>
          <span className="block text-[11px] text-neutral-400">
            {isAuction ? (listing?.highestBid && listing.highestBid > 0 ? 'Highest Bid' : 'Starting Reserve') : (isActive ? 'Price' : 'Last Value')}
          </span>
          <span className="font-mono text-sm font-bold text-white tabular-nums">
            {isActive
              ? isAuction
                ? listing?.highestBid && listing.highestBid > 0
                  ? `${listing.highestBid.toFixed(3)} ETH`
                  : `${listing?.price.toFixed(3)} ETH`
                : `${listing?.price.toFixed(3)} ETH`
              : 'Not Listed'}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(nft);
          }}
          className="rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-200 group-hover:bg-indigo-600 group-hover:text-white transition-colors"
        >
          {isActive
            ? isAuction
              ? isEnded
                ? 'Settle'
                : 'Bid'
              : 'Buy'
            : isOwner
            ? 'List'
            : 'Details'}
        </button>
      </div>
    </div>
  );
};
