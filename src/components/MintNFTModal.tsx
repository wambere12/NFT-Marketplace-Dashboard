import React, { useState } from 'react';
import { useMarketplace } from '../context/MarketplaceContext';
import { X, Check, Sparkles, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MintNFTModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_ARTWORKS = [
  {
    name: 'Cyber Monolith',
    url: '/src/assets/images/nft_cyber_monolith_1794466217310.jpg',
    category: 'Architecture',
  },
  {
    name: 'Celestial Voyager',
    url: '/src/assets/images/nft_celestial_voyager_1794466218294.jpg',
    category: 'Cosmic Art',
  },
  {
    name: 'Chrono Relic',
    url: '/src/assets/images/nft_chrono_relic_1794466219559.jpg',
    category: 'Horology',
  },
  {
    name: 'Biomorphic Bloom',
    url: '/src/assets/images/nft_biomorphic_bloom_1794466219781.jpg',
    category: 'Sculpture',
  },
];

export const MintNFTModal: React.FC<MintNFTModalProps> = ({ isOpen, onClose }) => {
  const { mintNFT, currentAccount } = useMarketplace();

  const [name, setName] = useState('');
  const [collection, setCollection] = useState('Genesis Vault');
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState(PRESET_ARTWORKS[0].url);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [royaltyPercentage, setRoyaltyPercentage] = useState<number>(7.5);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setStatusMsg({ type: 'error', text: 'NFT title is required.' });
      return;
    }

    const finalImage = customImageUrl.trim() ? customImageUrl : selectedImage;
    const royaltyBps = Math.round(royaltyPercentage * 100);

    const res = mintNFT(name, collection, description, finalImage, royaltyBps);
    if (res.success) {
      try {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
      } catch (e) {}
      setStatusMsg({
        type: 'success',
        text: `Minted ${name} (Token #${res.tokenId})! Added to your collection.`,
      });
      setTimeout(() => {
        onClose();
      }, 1600);
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

        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-400" />
          <h3 className="text-xl font-bold text-white tracking-tight">Mint ERC-721 NFT</h3>
        </div>
        <p className="mt-1 text-xs text-neutral-400">
          Mint a token with custom EIP-2981 creator royalties to test secondary market splits.
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

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              Artwork Asset
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {PRESET_ARTWORKS.map((art) => (
                <button
                  key={art.name}
                  type="button"
                  onClick={() => {
                    setSelectedImage(art.url);
                    setCustomImageUrl('');
                  }}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === art.url && !customImageUrl
                      ? 'border-indigo-500 scale-102 shadow-md'
                      : 'border-neutral-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={art.url} alt={art.name} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
            <input
              type="text"
              value={customImageUrl}
              onChange={(e) => setCustomImageUrl(e.target.value)}
              placeholder="Or enter custom image URL"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
              Token Title
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Quantum Singularity #09"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                Collection Name
              </label>
              <input
                type="text"
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                placeholder="Genesis Vault"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                EIP-2981 Royalty ({royaltyPercentage}%)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="25"
                value={royaltyPercentage}
                onChange={(e) => setRoyaltyPercentage(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provenance and background lore..."
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none"
            />
          </div>

          <div className="rounded-lg bg-neutral-950 p-2.5 border border-neutral-800 text-[11px] text-neutral-400 font-mono">
            <span>Mint recipient & royalty beneficiary: </span>
            <span className="text-neutral-200">{currentAccount.address.slice(0, 8)}...{currentAccount.address.slice(-6)}</span>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            Mint NFT to Wallet
          </button>
        </form>
      </div>
    </div>
  );
};
