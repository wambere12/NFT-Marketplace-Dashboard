import React, { useState } from 'react';
import { NFTItem } from '../types/marketplace';
import { useMarketplace } from '../context/MarketplaceContext';
import { X, Check, AlertCircle, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ListItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedNFT?: NFTItem | null;
}

export const ListItemModal: React.FC<ListItemModalProps> = ({
  isOpen,
  onClose,
  preselectedNFT,
}) => {
  const { nfts, currentAccount, listItem, setApprovalForMarketplace } = useMarketplace();

  // Find NFTs owned by current user that are not currently actively listed
  const ownedNFTs = nfts.filter(
    (n) => n.owner.toLowerCase() === currentAccount.address.toLowerCase() && !n.listing?.active
  );

  const [selectedTokenId, setSelectedTokenId] = useState<number>(() => {
    if (preselectedNFT && preselectedNFT.owner.toLowerCase() === currentAccount.address.toLowerCase()) {
      return preselectedNFT.tokenId;
    }
    return ownedNFTs.length > 0 ? ownedNFTs[0].tokenId : 0;
  });

  const [saleType, setSaleType] = useState<'fixed' | 'auction'>('fixed');
  const [priceInput, setPriceInput] = useState<string>('2.5');
  const [durationSeconds, setDurationSeconds] = useState<number>(3600); // 1 hour default
  const [customMinutes, setCustomMinutes] = useState<string>('60');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentSelectedNFT = nfts.find((n) => n.tokenId === selectedTokenId) || ownedNFTs[0];

  const handleApprove = () => {
    if (!currentSelectedNFT) return;
    setApprovalForMarketplace(currentSelectedNFT.contractAddress, currentSelectedNFT.tokenId, true);
    setStatusMsg({
      type: 'success',
      text: 'ERC-721 approval granted to NFTMarketplace contract!',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSelectedNFT) {
      setStatusMsg({ type: 'error', text: 'Please select an NFT to list.' });
      return;
    }

    const price = parseFloat(priceInput);
    if (isNaN(price) || price <= 0) {
      setStatusMsg({ type: 'error', text: 'Price must be greater than 0.' });
      return;
    }

    const isAuction = saleType === 'auction';
    const finalDuration = isAuction ? durationSeconds : 0;

    setIsSubmitting(true);
    setStatusMsg(null);

    const res = listItem(
      currentSelectedNFT.contractAddress,
      currentSelectedNFT.tokenId,
      price,
      isAuction,
      finalDuration
    );

    setIsSubmitting(false);

    if (res.success) {
      try {
        confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
      } catch (e) {}
      setStatusMsg({
        type: 'success',
        text: `Listed ${currentSelectedNFT.name} successfully on the marketplace contract!`,
      });
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setStatusMsg({ type: 'error', text: res.error || 'Failed to list item.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 p-6 md:p-8 shadow-2xl my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full bg-neutral-800 p-2 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-xl font-bold text-white tracking-tight">List NFT on Marketplace</h3>
        <p className="mt-1 text-xs text-neutral-400">
          Create an active listing on the Solidity NFTMarketplace smart contract.
        </p>

        {statusMsg && (
          <div
            className={`mt-4 p-3 rounded-lg text-xs flex items-start gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                : 'bg-rose-950/60 border border-rose-800 text-rose-300'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <Check className="h-4 w-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            )}
            <div>{statusMsg.text}</div>
          </div>
        )}

        {ownedNFTs.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-neutral-800 p-8 text-center">
            <p className="text-sm text-neutral-400">
              No unlisted NFTs found in {currentAccount.name.split(' ')[0]}&apos;s wallet.
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Switch accounts or mint a new test NFT to test listing!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* Select Token */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                Select NFT from Vault
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                {ownedNFTs.map((n) => (
                  <button
                    key={n.tokenId}
                    type="button"
                    onClick={() => setSelectedTokenId(n.tokenId)}
                    className={`flex items-center gap-2.5 p-2 rounded-lg border text-left transition-all ${
                      selectedTokenId === n.tokenId
                        ? 'border-indigo-500 bg-indigo-950/30'
                        : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
                    }`}
                  >
                    <img
                      src={n.imageUrl}
                      alt={n.name}
                      referrerPolicy="no-referrer"
                      className="h-10 w-10 rounded-md object-cover bg-neutral-900 shrink-0"
                    />
                    <div className="truncate">
                      <div className="text-xs font-medium text-white truncate">{n.name}</div>
                      <div className="text-[10px] text-neutral-500 font-mono">#{n.tokenId}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sale Type Selector (Segmented interactive buttons) */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                Listing Mechanism
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-950 rounded-lg border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setSaleType('fixed')}
                  className={`py-2 px-3 text-xs font-medium rounded-md transition-colors ${
                    saleType === 'fixed'
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Fixed Price (Buy Now)
                </button>
                <button
                  type="button"
                  onClick={() => setSaleType('auction')}
                  className={`py-2 px-3 text-xs font-medium rounded-md transition-colors ${
                    saleType === 'auction'
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Timed English Auction
                </button>
              </div>
            </div>

            {/* Price / Reserve Input */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                {saleType === 'fixed' ? 'Buy Now Price (ETH)' : 'Reserve Starting Price (ETH)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.05"
                  min="0.01"
                  required
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-indigo-500 focus:outline-none font-mono"
                  placeholder="1.50"
                />
                <span className="absolute right-3 top-2.5 text-xs font-mono text-neutral-400">ETH</span>
              </div>
              <span className="mt-1 block text-[11px] text-neutral-500">
                Marketplace deducts 2.5% fee + {(currentSelectedNFT?.royaltyBps || 500) / 100}% creator royalty upon settlement.
              </span>
            </div>

            {/* Auction Duration Config */}
            {saleType === 'auction' && (
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Auction Duration (Min 5 minutes required)
                </label>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setDurationSeconds(300)}
                    className={`py-1.5 px-2 rounded border font-mono text-xs ${
                      durationSeconds === 300
                        ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                    }`}
                  >
                    5 Mins
                  </button>
                  <button
                    type="button"
                    onClick={() => setDurationSeconds(1800)}
                    className={`py-1.5 px-2 rounded border font-mono text-xs ${
                      durationSeconds === 1800
                        ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                    }`}
                  >
                    30 Mins
                  </button>
                  <button
                    type="button"
                    onClick={() => setDurationSeconds(3600)}
                    className={`py-1.5 px-2 rounded border font-mono text-xs ${
                      durationSeconds === 3600
                        ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                    }`}
                  >
                    1 Hour
                  </button>
                  <button
                    type="button"
                    onClick={() => setDurationSeconds(86400)}
                    className={`py-1.5 px-2 rounded border font-mono text-xs ${
                      durationSeconds === 86400
                        ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                    }`}
                  >
                    24 Hours
                  </button>
                </div>
              </div>
            )}

            {/* ERC721 Approval Status & Check */}
            {currentSelectedNFT && !currentSelectedNFT.isApprovedMarketplace && (
              <div className="rounded-xl border border-amber-800/60 bg-amber-950/30 p-3 flex items-center justify-between text-xs">
                <div className="text-amber-300">
                  <span className="font-semibold block">Marketplace not approved</span>
                  <span className="text-[11px] text-amber-400/80">ERC721 approval needed before listing.</span>
                </div>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="rounded-lg bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 font-medium text-amber-200 hover:bg-amber-500/30"
                >
                  Approve Contract
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || (currentSelectedNFT && !currentSelectedNFT.isApprovedMarketplace)}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Submitting to Blockchain...' : 'Confirm Listing (listItem)'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
