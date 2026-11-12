import React, { useState } from 'react';
import { useMarketplace } from '../context/MarketplaceContext';
import { Clock, FastForward, Check, Copy, ArrowDownToLine, RefreshCw } from 'lucide-react';
import { MARKETPLACE_CONTRACT_ADDRESS } from '../constants/solidityContract';

export const TimeMachineBar: React.FC = () => {
  const {
    currentBlockTimestamp,
    currentBlockNumber,
    advanceBlockTime,
    resetBlockTime,
    currentAccount,
    pendingWithdrawals,
    withdrawProceeds,
    contractEthBalance,
  } = useMarketplace();

  const [copied, setCopied] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState<string | null>(null);

  const claimableAmount = pendingWithdrawals[currentAccount.address] || 0;

  const handleCopyContract = () => {
    navigator.clipboard.writeText(MARKETPLACE_CONTRACT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWithdraw = () => {
    setWithdrawing(true);
    const res = withdrawProceeds();
    if (res.success) {
      setWithdrawMsg(`Withdrew ${res.amountWithdrawn?.toFixed(4)} ETH to ${currentAccount.name.split(' ')[0]}!`);
      setTimeout(() => setWithdrawMsg(null), 4000);
    } else {
      setWithdrawMsg(res.error || 'Failed to withdraw');
      setTimeout(() => setWithdrawMsg(null), 4000);
    }
    setWithdrawing(false);
  };

  const formattedDate = new Date(currentBlockTimestamp * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="w-full border-b border-neutral-800 bg-neutral-900/60 px-4 py-2.5 sm:px-6 lg:px-8 text-xs">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-y-2 gap-x-6">
        {/* Left: EVM Block State */}
        <div className="flex items-center gap-3 text-neutral-400">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-neutral-300">EVM Sandbox:</span>
            <span className="font-mono text-neutral-400 tabular-nums">Block #{currentBlockNumber}</span>
          </div>

          <span className="text-neutral-600 hidden sm:inline">·</span>

          <div className="flex items-center gap-1.5 text-neutral-400">
            <Clock className="h-3.5 w-3.5 text-neutral-400" />
            <span className="font-mono text-neutral-300 tabular-nums">{formattedDate}</span>
          </div>

          <span className="text-neutral-600 hidden md:inline">·</span>

          <div className="hidden lg:flex items-center gap-1 font-mono text-neutral-400">
            <span>Contract:</span>
            <button
              onClick={handleCopyContract}
              className="flex items-center gap-1 text-neutral-300 hover:text-white transition-colors"
              title="Copy NFTMarketplace address"
            >
              <span>{MARKETPLACE_CONTRACT_ADDRESS.slice(0, 6)}...{MARKETPLACE_CONTRACT_ADDRESS.slice(-4)}</span>
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            </button>
            <span className="text-neutral-600">·</span>
            <span className="text-neutral-300 tabular-nums">Escrow: {contractEthBalance.toFixed(3)} ETH</span>
          </div>
        </div>

        {/* Right: Actions & Pending Withdrawals */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Fast-forward block time controls */}
          <div className="flex items-center gap-1 text-neutral-400">
            <span className="text-[11px] text-neutral-400 mr-1 hidden sm:inline">Fast Forward:</span>
            <button
              onClick={() => advanceBlockTime(300)}
              className="rounded bg-neutral-800/80 px-2 py-1 text-[11px] font-mono text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors"
              title="Fast forward simulated EVM block time by 5 minutes"
            >
              +5m
            </button>
            <button
              onClick={() => advanceBlockTime(1800)}
              className="rounded bg-neutral-800/80 px-2 py-1 text-[11px] font-mono text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors"
              title="Fast forward by 30 minutes"
            >
              +30m
            </button>
            <button
              onClick={() => advanceBlockTime(86400)}
              className="rounded bg-neutral-800/80 px-2 py-1 text-[11px] font-mono text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors"
              title="Fast forward by 24 hours"
            >
              +1d
            </button>
            <button
              onClick={resetBlockTime}
              className="rounded bg-neutral-800/80 p-1 text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
              title="Reset time to now"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>

          {/* Pending Withdrawal Action if user has funds in pendingWithdrawals */}
          {claimableAmount > 0 && (
            <div className="flex items-center gap-2 pl-2 border-l border-neutral-800">
              <span className="font-mono text-amber-400 font-semibold tabular-nums">
                {claimableAmount.toFixed(4)} ETH Pending
              </span>
              <button
                onClick={handleWithdraw}
                disabled={withdrawing}
                className="flex items-center gap-1 rounded bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 text-[11px] font-medium text-amber-300 hover:bg-amber-500/30 transition-colors"
              >
                <ArrowDownToLine className="h-3 w-3" />
                <span>Withdraw</span>
              </button>
            </div>
          )}

          {withdrawMsg && (
            <span className="font-mono text-[11px] text-emerald-400 animate-pulse">
              {withdrawMsg}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
