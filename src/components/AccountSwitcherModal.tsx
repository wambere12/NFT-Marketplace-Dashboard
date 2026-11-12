import React from 'react';
import { useMarketplace } from '../context/MarketplaceContext';
import { X, Check, Wallet, ArrowDownToLine, Globe } from 'lucide-react';

interface AccountSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountSwitcherModal: React.FC<AccountSwitcherModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    accounts,
    currentAccount,
    switchAccountById,
    connectWeb3Wallet,
    pendingWithdrawals,
    withdrawProceeds,
  } = useMarketplace();

  if (!isOpen) return null;

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
          <Wallet className="h-5 w-5 text-indigo-400" />
          <h3 className="text-xl font-bold text-white tracking-tight">Active Actor / Wallet</h3>
        </div>
        <p className="mt-1 text-xs text-neutral-400">
          Switch test accounts to simulate multi-user bidding, creator royalties, and owner fee withdrawals.
        </p>

        <div className="mt-6 space-y-3">
          {accounts.map((acc) => {
            const isSelected = acc.id === currentAccount.id;
            const claimable = pendingWithdrawals[acc.address] || 0;

            return (
              <div
                key={acc.id}
                onClick={() => {
                  switchAccountById(acc.id);
                  onClose();
                }}
                className={`cursor-pointer rounded-xl border p-3.5 transition-all flex items-center justify-between ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-950/30'
                    : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={acc.avatar}
                    alt={acc.name}
                    className="h-10 w-10 rounded-full bg-neutral-800 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{acc.name}</span>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        ({acc.role})
                      </span>
                    </div>
                    <div className="font-mono text-xs text-neutral-400">
                      {acc.address.slice(0, 8)}...{acc.address.slice(-6)}
                    </div>
                  </div>
                </div>

                <div className="text-right flex items-center gap-3">
                  <div>
                    <div className="font-mono text-sm font-bold text-white tabular-nums">
                      {acc.ethBalance.toFixed(2)} ETH
                    </div>
                    {claimable > 0 && (
                      <div className="text-[11px] font-mono text-amber-400 font-medium">
                        +{claimable.toFixed(3)} claimable
                      </div>
                    )}
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-indigo-400 shrink-0" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Real Web3 Wallet connect option */}
        <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between">
          <div className="text-xs text-neutral-400">
            <span className="block font-medium text-neutral-300">Browser Web3 Provider</span>
            <span className="text-[11px] text-neutral-500">Connect MetaMask or injected wallet</span>
          </div>
          <button
            onClick={() => {
              connectWeb3Wallet();
              onClose();
            }}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors"
          >
            <Globe className="h-3.5 w-3.5 text-indigo-400" />
            <span>Connect Web3</span>
          </button>
        </div>
      </div>
    </div>
  );
};
