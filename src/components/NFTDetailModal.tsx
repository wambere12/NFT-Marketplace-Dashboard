import React, { useState } from 'react';
import { NFTItem } from '../types/marketplace';
import { useMarketplace } from '../context/MarketplaceContext';
import {
  X,
  Clock,
  Tag,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Coins,
  FastForward,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface NFTDetailModalProps {
  nft: NFTItem | null;
  onClose: () => void;
  onOpenListModalForNFT: (nft: NFTItem) => void;
}

export const NFTDetailModal: React.FC<NFTDetailModalProps> = ({
  nft,
  onClose,
  onOpenListModalForNFT,
}) => {
  const {
    currentAccount,
    currentBlockTimestamp,
    buyItem,
    placeBid,
    settleAuction,
    cancelListing,
    setApprovalForMarketplace,
    fastForwardToAuctionEnd,
    platformFeeBps,
  } = useMarketplace();

  const [bidInput, setBidInput] = useState<string>('');
  const [customPayInput, setCustomPayInput] = useState<string>('');
  const [showOverpaymentInput, setShowOverpaymentInput] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!nft) return null;

  const listing = nft.listing;
  const isAuction = listing?.isAuction;
  const isActive = listing?.active;
  const isSeller = listing?.seller.toLowerCase() === currentAccount.address.toLowerCase();
  const isOwner = nft.owner.toLowerCase() === currentAccount.address.toLowerCase();

  // Auction details & min bid calculation
  const highestBid = listing?.highestBid || 0;
  const reservePrice = listing?.price || 0;
  const minRequiredBid = highestBid === 0 ? reservePrice : highestBid + (highestBid * 5) / 100;
  const hasBids = highestBid > 0;

  // Auction countdown
  let isEnded = false;
  let timeRemainingText = '';
  if (isAuction && listing && listing.endTime > 0) {
    const diff = listing.endTime - currentBlockTimestamp;
    if (diff <= 0) {
      isEnded = true;
      timeRemainingText = 'Auction Ended';
    } else {
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;
      timeRemainingText = `${hours}h ${minutes}m ${seconds}s remaining`;
    }
  }

  // Distribution calculations
  const samplePrice = isAuction ? (highestBid > 0 ? highestBid : reservePrice) : (listing?.price || 1.0);
  const platformFee = (samplePrice * platformFeeBps) / 10000;
  const creatorRoyalty = (samplePrice * (nft.royaltyBps || 0)) / 10000;
  const sellerNet = samplePrice - platformFee - creatorRoyalty;

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (e) {
      // ignore
    }
  };

  const handleBuy = async () => {
    setIsSubmitting(true);
    setStatusMsg(null);
    const payVal = showOverpaymentInput && customPayInput ? parseFloat(customPayInput) : undefined;
    const res = buyItem(nft.contractAddress, nft.tokenId, payVal);
    setIsSubmitting(false);

    if (res.success) {
      triggerConfetti();
      setStatusMsg({
        type: 'success',
        text: `Transaction Confirmed! You are now the verified owner of ${nft.name}.`,
      });
    } else {
      setStatusMsg({ type: 'error', text: res.error || 'Transaction reverted.' });
    }
  };

  const handlePlaceBid = async () => {
    const bidAmount = parseFloat(bidInput);
    if (isNaN(bidAmount) || bidAmount <= 0) {
      setStatusMsg({ type: 'error', text: 'Enter a valid positive bid amount.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);
    const res = placeBid(nft.contractAddress, nft.tokenId, bidAmount);
    setIsSubmitting(false);

    if (res.success) {
      triggerConfetti();
      setStatusMsg({
        type: 'success',
        text: `Bid of ${bidAmount.toFixed(3)} ETH placed successfully! You are now the highest bidder.`,
      });
      setBidInput('');
    } else {
      setStatusMsg({ type: 'error', text: res.error || 'Transaction reverted.' });
    }
  };

  const handleSettle = async () => {
    setIsSubmitting(true);
    setStatusMsg(null);
    const res = settleAuction(nft.contractAddress, nft.tokenId);
    setIsSubmitting(false);

    if (res.success) {
      triggerConfetti();
      setStatusMsg({
        type: 'success',
        text: 'Auction Settled! NFT transferred to the winner and payouts dispatched to pendingWithdrawals.',
      });
    } else {
      setStatusMsg({ type: 'error', text: res.error || 'Settlement reverted.' });
    }
  };

  const handleCancel = async () => {
    setIsSubmitting(true);
    setStatusMsg(null);
    const res = cancelListing(nft.contractAddress, nft.tokenId);
    setIsSubmitting(false);

    if (res.success) {
      setStatusMsg({
        type: 'success',
        text: 'Listing canceled successfully on the smart contract.',
      });
    } else {
      setStatusMsg({ type: 'error', text: res.error || 'Cancellation reverted.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl my-8 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-full bg-neutral-800/80 p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: High-Res Visual Presentation */}
          <div className="p-6 md:p-8 bg-neutral-950/70 border-b md:border-b-0 md:border-r border-neutral-800 flex flex-col justify-between">
            <div>
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800/80">
                <img
                  src={nft.imageUrl}
                  alt={nft.name}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Attributes / Traits */}
              <div className="mt-5">
                <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2.5">
                  Verified Traits & Metadata
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {nft.attributes.map((attr, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-2 text-left"
                    >
                      <span className="block text-[10px] text-neutral-500 uppercase">{attr.trait_type}</span>
                      <span className="font-medium text-xs text-neutral-200 truncate block">{attr.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Smart Contract Proof Details */}
            <div className="mt-6 pt-4 border-t border-neutral-800 text-xs text-neutral-400 space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-neutral-500">Contract:</span>
                <span className="text-neutral-300">
                  {nft.contractAddress.slice(0, 8)}...{nft.contractAddress.slice(-6)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Token ID:</span>
                <span className="text-neutral-300">#{nft.tokenId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Standard:</span>
                <span className="text-neutral-300">ERC-721 + EIP-2981</span>
              </div>
            </div>
          </div>

          {/* Right: Contiguous Purchase / Bidding Module */}
          <div className="p-6 md:p-8 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <span>{nft.collectionName}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">Token #{nft.tokenId}</span>
              </div>

              <h2 className="mt-1 text-2xl font-bold text-white tracking-tight">{nft.name}</h2>
              <p className="mt-2 text-sm text-neutral-400 leading-relaxed">{nft.description}</p>

              {/* Owner / Creator Attribution */}
              <div className="mt-4 flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-neutral-950/60 border border-neutral-800">
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase">Current Owner</span>
                  <span className="font-mono text-neutral-200">
                    {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}
                    {isOwner && ' (You)'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-neutral-500 block text-[10px] uppercase">Creator Royalty</span>
                  <span className="font-mono text-indigo-400 font-medium">
                    {((nft.royaltyBps || 0) / 100).toFixed(1)}% EIP-2981
                  </span>
                </div>
              </div>

              {/* Feedback Alert */}
              {statusMsg && (
                <div
                  className={`mt-4 p-3 rounded-lg text-xs flex items-start gap-2 ${
                    statusMsg.type === 'success'
                      ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                      : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                  }`}
                >
                  {statusMsg.type === 'success' ? (
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  )}
                  <div className="leading-snug">{statusMsg.text}</div>
                </div>
              )}

              {/* ACTIVE AUCTION MODULE */}
              {isActive && isAuction && listing && (
                <div className="mt-5 rounded-xl border border-neutral-800 bg-neutral-950/80 p-4 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400 flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-indigo-400" />
                      <span>Auction Status:</span>
                      <strong className={isEnded ? 'text-amber-400' : 'text-emerald-400'}>
                        {isEnded ? 'Ended' : 'Live'}
                      </strong>
                    </span>
                    <span className="font-mono text-neutral-300 tabular-nums">{timeRemainingText}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-800/80">
                    <div>
                      <span className="block text-[11px] text-neutral-500">Current Highest Bid</span>
                      <span className="font-mono text-lg font-bold text-white tabular-nums">
                        {listing.highestBid > 0 ? `${listing.highestBid.toFixed(3)} ETH` : 'No Bids Yet'}
                      </span>
                      {listing.highestBidder !== '0x0000000000000000000000000000000000000000' && (
                        <span className="block text-[11px] font-mono text-neutral-400">
                          by {listing.highestBidder.slice(0, 6)}...{listing.highestBidder.slice(-4)}
                          {listing.highestBidder.toLowerCase() === currentAccount.address.toLowerCase() && ' (You)'}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="block text-[11px] text-neutral-500">Starting Reserve</span>
                      <span className="font-mono text-lg font-medium text-neutral-300 tabular-nums">
                        {listing.price.toFixed(3)} ETH
                      </span>
                      <span className="block text-[11px] text-neutral-500">Min +5% step rule</span>
                    </div>
                  </div>

                  {/* If Auction has ended, show Settle Button */}
                  {isEnded ? (
                    <div className="space-y-2 pt-2">
                      <button
                        onClick={handleSettle}
                        disabled={isSubmitting}
                        className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors shadow-lg"
                      >
                        {isSubmitting ? 'Settling...' : 'Settle Auction (settleAuction)'}
                      </button>
                      <p className="text-[11px] text-neutral-400 text-center">
                        Finalizes sale, safely transfers NFT to highest bidder, and routes payouts.
                      </p>
                    </div>
                  ) : (
                    /* Auction Active: Place Bid Form */
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between text-xs text-neutral-400">
                        <span>Place Bid (Min: {minRequiredBid.toFixed(3)} ETH)</span>
                        <button
                          onClick={() => fastForwardToAuctionEnd(nft.contractAddress, nft.tokenId)}
                          className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300"
                          title="Fast forward simulated time to test auction conclusion"
                        >
                          <FastForward className="h-3 w-3" />
                          <span>Fast forward to end</span>
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            step="0.01"
                            value={bidInput}
                            onChange={(e) => setBidInput(e.target.value)}
                            placeholder={minRequiredBid.toFixed(3)}
                            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-indigo-500 focus:outline-none font-mono"
                          />
                          <span className="absolute right-3 top-2.5 text-xs font-mono text-neutral-400">ETH</span>
                        </div>
                        <button
                          onClick={handlePlaceBid}
                          disabled={isSubmitting}
                          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors whitespace-nowrap"
                        >
                          {isSubmitting ? 'Bidding...' : 'Place Bid'}
                        </button>
                      </div>

                      {/* Quick Bid Preset Buttons */}
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-neutral-500 text-[11px]">Presets:</span>
                        <button
                          onClick={() => setBidInput(minRequiredBid.toFixed(3))}
                          className="rounded bg-neutral-800 px-2 py-1 text-[11px] font-mono text-neutral-300 hover:bg-neutral-700"
                        >
                          Min ({minRequiredBid.toFixed(2)})
                        </button>
                        <button
                          onClick={() => setBidInput((minRequiredBid * 1.1).toFixed(3))}
                          className="rounded bg-neutral-800 px-2 py-1 text-[11px] font-mono text-neutral-300 hover:bg-neutral-700"
                        >
                          +10%
                        </button>
                        <button
                          onClick={() => setBidInput((minRequiredBid * 1.25).toFixed(3))}
                          className="rounded bg-neutral-800 px-2 py-1 text-[11px] font-mono text-neutral-300 hover:bg-neutral-700"
                        >
                          +25%
                        </button>
                      </div>

                      <p className="text-[11px] text-neutral-500 leading-tight">
                        Pull-Payment Escrow: If someone outbids you, your funds are immediately credited to
                        your pending withdrawals balance for 1-click withdrawal.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ACTIVE FIXED PRICE BUY MODULE */}
              {isActive && !isAuction && listing && (
                <div className="mt-5 rounded-xl border border-neutral-800 bg-neutral-950/80 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-xs text-neutral-500">Buy Now Price</span>
                      <span className="font-mono text-2xl font-bold text-white tabular-nums">
                        {listing.price.toFixed(3)} ETH
                      </span>
                    </div>
                    <span className="rounded-md bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 text-xs text-emerald-300 font-mono">
                      Direct Purchase
                    </span>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={handleBuy}
                      disabled={isSubmitting || isSeller}
                      className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                    >
                      {isSeller ? 'You are the seller' : isSubmitting ? 'Processing...' : 'Buy Now (buyItem)'}
                    </button>

                    {/* Overpayment test toggle */}
                    <div className="pt-2">
                      <button
                        onClick={() => setShowOverpaymentInput(!showOverpaymentInput)}
                        className="text-[11px] text-neutral-400 hover:text-neutral-300 underline"
                      >
                        {showOverpaymentInput ? 'Hide overpayment test' : 'Test Solidity overpayment pull-payment refund'}
                      </button>

                      {showOverpaymentInput && (
                        <div className="mt-2 flex gap-2">
                          <input
                            type="number"
                            step="0.1"
                            value={customPayInput}
                            onChange={(e) => setCustomPayInput(e.target.value)}
                            placeholder={`e.g. ${(listing.price + 0.5).toFixed(2)}`}
                            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none font-mono"
                          />
                          <button
                            onClick={handleBuy}
                            className="rounded-lg bg-neutral-800 px-3 py-1.5 text-xs text-neutral-200 hover:bg-neutral-700"
                          >
                            Send Overpayment
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* UNLISTED STATUS */}
              {!isActive && (
                <div className="mt-5 rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 text-center space-y-3">
                  <span className="text-xs text-neutral-400 block">This NFT is currently unlisted.</span>
                  {isOwner ? (
                    <button
                      onClick={() => onOpenListModalForNFT(nft)}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
                    >
                      List for Sale or Timed Auction
                    </button>
                  ) : (
                    <span className="text-xs text-neutral-500 italic">
                      Held by {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}
                    </span>
                  )}
                </div>
              )}

              {/* EIP-2981 & PLATFORM FEE TRANSPARENCY VISUALIZER */}
              <div className="mt-5 rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-3 text-xs space-y-2">
                <div className="flex items-center justify-between text-neutral-400 font-medium">
                  <span>Smart Contract Settlement Split</span>
                  <span className="font-mono text-neutral-300">{samplePrice.toFixed(2)} ETH</span>
                </div>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between text-neutral-400">
                    <span>Seller Net Proceeds:</span>
                    <span className="text-neutral-200 tabular-nums">
                      {sellerNet.toFixed(4)} ETH ({(((sellerNet) / samplePrice) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Creator Royalty (EIP-2981):</span>
                    <span className="text-indigo-400 tabular-nums">
                      {creatorRoyalty.toFixed(4)} ETH ({((nft.royaltyBps || 0) / 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Marketplace Platform Fee:</span>
                    <span className="text-emerald-400 tabular-nums">
                      {platformFee.toFixed(4)} ETH ({(platformFeeBps / 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Seller Controls: Cancel Listing / Approval Toggle */}
            {isSeller && isActive && (
              <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-neutral-500 block">Owner Control</span>
                  {isAuction && hasBids && (
                    <span className="text-[10px] text-amber-400">
                      Cannot cancel: bids have already been placed
                    </span>
                  )}
                </div>
                <button
                  onClick={handleCancel}
                  disabled={isSubmitting || (isAuction && hasBids)}
                  className="rounded-lg border border-rose-800/50 bg-rose-950/30 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel Listing (cancelListing)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
