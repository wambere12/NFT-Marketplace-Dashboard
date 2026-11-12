import React, { useState } from 'react';
import { useMarketplace } from '../context/MarketplaceContext';
import {
  SOLIDITY_CODE,
  MARKETPLACE_CONTRACT_ADDRESS,
  CONTRACT_SECURITY_PATTERNS,
} from '../constants/solidityContract';
import {
  Copy,
  Check,
  ArrowDownToLine,
  Filter,
  FileCode,
  Shield,
  Layers,
  Activity,
  Coins,
} from 'lucide-react';
import { EventType } from '../types/marketplace';

export const ContractTerminal: React.FC = () => {
  const {
    nfts,
    events,
    pendingWithdrawals,
    platformFeeBps,
    contractOwnerAddress,
    contractEthBalance,
    currentBlockNumber,
    currentAccount,
    withdrawProceeds,
    accounts,
  } = useMarketplace();

  const [activeTab, setActiveTab] = useState<'escrow' | 'events' | 'code' | 'security'>('escrow');
  const [copiedCode, setCopiedCode] = useState(false);
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [withdrawingAddress, setWithdrawingAddress] = useState<string | null>(null);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(SOLIDITY_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleWithdrawFor = (address: string) => {
    setWithdrawingAddress(address);
    withdrawProceeds(address);
    setTimeout(() => setWithdrawingAddress(null), 500);
  };

  const activeListingsCount = nfts.filter((n) => n.listing && n.listing.active).length;

  const filteredEvents = events.filter((e) => {
    if (eventFilter === 'all') return true;
    return e.type.toLowerCase() === eventFilter.toLowerCase();
  });

  // Build escrow list from pendingWithdrawals
  const withdrawalEntries = Object.entries(pendingWithdrawals).filter(([_, amt]) => amt > 0);

  const getAccountLabel = (addr: string) => {
    const acc = accounts.find((a) => a.address.toLowerCase() === addr.toLowerCase());
    if (acc) return `${acc.name}`;
    if (addr.toLowerCase() === contractOwnerAddress.toLowerCase()) return 'Contract Deployer & Owner';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Overview Stat Strip (Single-elevation, clean typographic tabular-nums) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <span className="block text-xs text-neutral-400 uppercase tracking-wider font-medium">
            Contract Escrow Balance
          </span>
          <span className="mt-1 block font-mono text-2xl font-bold text-white tabular-nums">
            {contractEthBalance.toFixed(4)} ETH
          </span>
          <span className="mt-1 block text-[11px] text-neutral-500">
            Escrowed bids + claimable pull-payments
          </span>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <span className="block text-xs text-neutral-400 uppercase tracking-wider font-medium">
            Platform Protocol Fee
          </span>
          <span className="mt-1 block font-mono text-2xl font-bold text-indigo-400 tabular-nums">
            {(platformFeeBps / 100).toFixed(2)}%
          </span>
          <span className="mt-1 block text-[11px] text-neutral-500">
            250 bps routed to contract owner
          </span>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <span className="block text-xs text-neutral-400 uppercase tracking-wider font-medium">
            Active Listings
          </span>
          <span className="mt-1 block font-mono text-2xl font-bold text-emerald-400 tabular-nums">
            {activeListingsCount}
          </span>
          <span className="mt-1 block text-[11px] text-neutral-500">
            {nfts.filter((n) => n.listing?.active && n.listing.isAuction).length} auctions ·{' '}
            {nfts.filter((n) => n.listing?.active && !n.listing.isAuction).length} fixed price
          </span>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <span className="block text-xs text-neutral-400 uppercase tracking-wider font-medium">
            Current Block Height
          </span>
          <span className="mt-1 block font-mono text-2xl font-bold text-white tabular-nums">
            #{currentBlockNumber}
          </span>
          <span className="mt-1 block text-[11px] text-neutral-500 font-mono">
            {events.length} ledger events indexed
          </span>
        </div>
      </div>

      {/* Main Terminal Tabs */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 overflow-hidden">
        {/* Navigation Tab Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-950/60 px-4 md:px-6 py-3">
          <div className="flex items-center gap-1.5 p-1 bg-neutral-900 rounded-lg border border-neutral-800/80 text-xs">
            <button
              onClick={() => setActiveTab('escrow')}
              className={`flex items-center gap-2 px-3 py-1.5 font-medium rounded-md transition-colors ${
                activeTab === 'escrow'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Coins className="h-3.5 w-3.5" />
              <span>Pending Escrow Withdrawals ({withdrawalEntries.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`flex items-center gap-2 px-3 py-1.5 font-medium rounded-md transition-colors ${
                activeTab === 'events'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Event Log Stream ({events.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-3 py-1.5 font-medium rounded-md transition-colors ${
                activeTab === 'code'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>Solidity Source</span>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 px-3 py-1.5 font-medium rounded-md transition-colors ${
                activeTab === 'security'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Security Patterns</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-neutral-400">
            <span>Marketplace:</span>
            <span className="text-neutral-200">
              {MARKETPLACE_CONTRACT_ADDRESS.slice(0, 6)}...{MARKETPLACE_CONTRACT_ADDRESS.slice(-4)}
            </span>
          </div>
        </div>

        {/* TAB 1: PENDING WITHDRAWALS (PULL-PAYMENT ESCROW) */}
        {activeTab === 'escrow' && (
          <div className="p-4 md:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-white">
                  Pull-Payment Escrow Ledger (pendingWithdrawals)
                </h3>
                <p className="text-xs text-neutral-400">
                  Instead of pushing ETH automatically during bids or sales (which risks reentrancy and DoS), funds
                  are recorded in the <code className="text-indigo-400">pendingWithdrawals</code> mapping for safe pull withdrawal.
                </p>
              </div>

              {pendingWithdrawals[currentAccount.address] > 0 && (
                <button
                  onClick={() => handleWithdrawFor(currentAccount.address)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-500/50 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 transition-colors whitespace-nowrap self-start"
                >
                  <ArrowDownToLine className="h-3.5 w-3.5" />
                  <span>Withdraw Your {pendingWithdrawals[currentAccount.address].toFixed(4)} ETH</span>
                </button>
              )}
            </div>

            {withdrawalEntries.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-800 py-12 text-center">
                <Coins className="mx-auto h-8 w-8 text-neutral-600 mb-2" />
                <p className="text-sm text-neutral-400 font-medium">All pending withdrawals are currently zero.</p>
                <p className="mt-1 text-xs text-neutral-500">
                  Execute a sale, an outbid, or an overpayment to see funds escrowed in this ledger.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/60">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-neutral-800 bg-neutral-900/80 text-neutral-400 uppercase font-mono text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Account / Beneficiary</th>
                      <th className="px-4 py-3">Ethereum Address</th>
                      <th className="px-4 py-3 text-right">Pending Amount</th>
                      <th className="px-4 py-3 text-right">Contract Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/80">
                    {withdrawalEntries.map(([addr, amount]) => {
                      const isCurrent = addr.toLowerCase() === currentAccount.address.toLowerCase();
                      return (
                        <tr key={addr} className="hover:bg-neutral-900/40 transition-colors">
                          <td className="px-4 py-3 font-medium text-white">
                            <div className="flex items-center gap-2">
                              <span>{getAccountLabel(addr)}</span>
                              {isCurrent && (
                                <span className="rounded bg-indigo-950 border border-indigo-800/60 px-1.5 py-0.5 text-[10px] text-indigo-300">
                                  You
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-neutral-400">
                            {addr}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-amber-400 text-right tabular-nums">
                            {amount.toFixed(4)} ETH
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleWithdrawFor(addr)}
                              disabled={withdrawingAddress === addr}
                              className="rounded-lg bg-neutral-800 hover:bg-neutral-700 px-3 py-1 font-mono text-[11px] text-neutral-200 transition-colors"
                            >
                              {withdrawingAddress === addr ? 'Withdrawing...' : 'withdrawProceeds()'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LIVE EVENT LOG STREAM */}
        {activeTab === 'events' && (
          <div className="p-4 md:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-white">Solidity Event Log Stream</h3>
                <p className="text-xs text-neutral-400">
                  Indexed events emitted by the smart contract during listing, bidding, buying, and settlement.
                </p>
              </div>

              {/* Event Type Filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-neutral-400" />
                <select
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                  className="rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-xs text-neutral-200 focus:outline-none font-mono"
                >
                  <option value="all">All Events</option>
                  <option value="ItemListed">ItemListed</option>
                  <option value="ItemBought">ItemBought</option>
                  <option value="BidPlaced">BidPlaced</option>
                  <option value="AuctionSettled">AuctionSettled</option>
                  <option value="ItemCanceled">ItemCanceled</option>
                  <option value="WithdrawProceeds">WithdrawProceeds</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/60">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-neutral-800 bg-neutral-900/80 text-neutral-400 uppercase font-mono text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Event Signature</th>
                    <th className="px-4 py-3">Block / Time</th>
                    <th className="px-4 py-3">Actor</th>
                    <th className="px-4 py-3">Description & Arguments</th>
                    <th className="px-4 py-3 text-right">Gas Used</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80 font-mono text-neutral-300">
                  {filteredEvents.map((evt) => (
                    <tr key={evt.id} className="hover:bg-neutral-900/40 transition-colors">
                      <td className="px-4 py-3">
                        <span
                          className={`font-semibold ${
                            evt.type === 'ItemBought' || evt.type === 'AuctionSettled'
                              ? 'text-emerald-400'
                              : evt.type === 'BidPlaced'
                              ? 'text-indigo-400'
                              : evt.type === 'ItemCanceled'
                              ? 'text-rose-400'
                              : evt.type === 'WithdrawProceeds'
                              ? 'text-amber-400'
                              : 'text-neutral-300'
                          }`}
                        >
                          {evt.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-400 text-[11px]">
                        <div>Block #{evt.blockNumber}</div>
                        <div className="text-neutral-500">
                          {new Date(evt.timestamp * 1000).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[11px]">
                        <span className="text-neutral-300">{evt.actor.slice(0, 6)}...{evt.actor.slice(-4)}</span>
                      </td>
                      <td className="px-4 py-3 font-sans text-xs text-neutral-300">
                        {evt.details}
                        {evt.payouts && (
                          <div className="mt-1 font-mono text-[10px] text-neutral-400 flex gap-3">
                            <span>Seller: +{evt.payouts.sellerProceeds?.toFixed(3)} ETH</span>
                            <span>Fee: +{evt.payouts.platformFee?.toFixed(3)} ETH</span>
                            {evt.payouts.royaltyAmount && evt.payouts.royaltyAmount > 0 ? (
                              <span>Royalty: +{evt.payouts.royaltyAmount?.toFixed(3)} ETH</span>
                            ) : null}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-500 tabular-nums text-[11px]">
                        {evt.gasUsed.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SOLIDITY CODE VIEWER */}
        {activeTab === 'code' && (
          <div className="p-4 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">NFTMarketplace.sol</h3>
                <p className="text-xs text-neutral-400">
                  Target Solidity ^0.8.24 implementation running on this application.
                </p>
              </div>

              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors"
              >
                {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>

            <pre className="max-h-[500px] overflow-auto rounded-xl border border-neutral-800 bg-neutral-950 p-4 font-mono text-xs text-neutral-300 leading-relaxed">
              <code>{SOLIDITY_CODE}</code>
            </pre>
          </div>
        )}

        {/* TAB 4: CONTRACT SECURITY PATTERNS */}
        {activeTab === 'security' && (
          <div className="p-4 md:p-6 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-white">Architectural & Security Highlights</h3>
              <p className="text-xs text-neutral-400">
                Key Web3 smart-contract security patterns implemented in NFTMarketplace.sol.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CONTRACT_SECURITY_PATTERNS.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                    <span className="font-mono text-[11px] text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-800/40">
                      {item.method}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
