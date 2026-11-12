import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Account,
  Listing,
  MarketplaceEvent,
  NFTItem,
  PendingWithdrawal,
} from '../types/marketplace';
import {
  INITIAL_ACCOUNTS,
  INITIAL_NFTS,
  INITIAL_EVENTS,
} from '../constants/initialData';
import {
  MARKETPLACE_CONTRACT_ADDRESS,
  DEFAULT_NFT_CONTRACT_ADDRESS,
} from '../constants/solidityContract';

interface MarketplaceContextType {
  // Accounts
  accounts: Account[];
  currentAccount: Account;
  setCurrentAccount: (account: Account) => void;
  switchAccountById: (id: string) => void;
  connectWeb3Wallet: () => Promise<void>;
  
  // Market State
  nfts: NFTItem[];
  events: MarketplaceEvent[];
  pendingWithdrawals: Record<string, number>; // address => balance in ETH
  platformFeeBps: number; // 250 = 2.5%
  contractOwnerAddress: string;
  contractEthBalance: number;
  
  // Time Machine & Block State
  currentBlockTimestamp: number; // seconds
  currentBlockNumber: number;
  advanceBlockTime: (seconds: number) => void;
  fastForwardToAuctionEnd: (contractAddress: string, tokenId: number) => void;
  resetBlockTime: () => void;
  
  // Contract Actions (Mirroring Solidity Functions)
  listItem: (
    nftContract: string,
    tokenId: number,
    price: number,
    isAuction: boolean,
    durationSeconds: number
  ) => { success: boolean; error?: string };
  
  buyItem: (
    nftContract: string,
    tokenId: number,
    paymentAmount?: number
  ) => { success: boolean; error?: string };
  
  placeBid: (
    nftContract: string,
    tokenId: number,
    bidAmount: number
  ) => { success: boolean; error?: string };
  
  settleAuction: (
    nftContract: string,
    tokenId: number
  ) => { success: boolean; error?: string };
  
  cancelListing: (
    nftContract: string,
    tokenId: number
  ) => { success: boolean; error?: string };
  
  withdrawProceeds: (
    targetAddress?: string
  ) => { success: boolean; amountWithdrawn?: number; error?: string };
  
  // Auxiliary ERC-721 Management
  setApprovalForMarketplace: (
    nftContract: string,
    tokenId: number,
    approved: boolean
  ) => void;
  
  mintNFT: (
    name: string,
    collectionName: string,
    description: string,
    imageUrl: string,
    royaltyBps: number
  ) => { success: boolean; tokenId: number };

  resetAllState: () => void;
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export const MarketplaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [currentAccount, setCurrentAccount] = useState<Account>(INITIAL_ACCOUNTS[0]); // Alice default
  const [nfts, setNfts] = useState<NFTItem[]>(INITIAL_NFTS);
  const [events, setEvents] = useState<MarketplaceEvent[]>(INITIAL_EVENTS);
  
  // Contract storage mappings
  // pendingWithdrawals: mapping(address => uint256)
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Record<string, number>>({});
  
  const platformFeeBps = 250; // 2.5%
  const contractOwnerAddress = INITIAL_ACCOUNTS[3].address; // Dave (deployer)

  // Block time machine state
  const [currentBlockTimestamp, setCurrentBlockTimestamp] = useState<number>(() => Math.floor(Date.now() / 1000));
  const [currentBlockNumber, setCurrentBlockNumber] = useState<number>(19842125);

  // Auto-advance simulated clock by 1 second every real second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBlockTimestamp((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const switchAccountById = (id: string) => {
    const acc = accounts.find((a) => a.id === id);
    if (acc) setCurrentAccount(acc);
  };

  const connectWeb3Wallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const eth = (window as any).ethereum;
        const requested = await eth.request({ method: 'eth_requestAccounts' });
        if (requested && requested.length > 0) {
          const rawAddress = requested[0];
          const newAcc: Account = {
            id: 'real-wallet',
            name: 'Connected Web3 Wallet',
            role: 'Collector',
            address: rawAddress,
            avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${rawAddress}`,
            ethBalance: 50.0,
            isRealWallet: true,
          };
          setAccounts((prev) => {
            const exists = prev.find((a) => a.address.toLowerCase() === rawAddress.toLowerCase());
            if (exists) return prev;
            return [...prev, newAcc];
          });
          setCurrentAccount(newAcc);
        }
      } catch (err: any) {
        console.error('Wallet connection failed:', err);
      }
    } else {
      alert('MetaMask or Web3 provider not detected in browser. You can seamlessly test with the 4 simulated role accounts (Alice, Bob, Carol, Dave)!');
    }
  };

  const generateTxHash = () => {
    const chars = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  };

  const addEvent = (eventData: Omit<MarketplaceEvent, 'id' | 'blockNumber' | 'timestamp' | 'txHash'>) => {
    const nextBlock = currentBlockNumber + 1;
    setCurrentBlockNumber(nextBlock);
    const newEvent: MarketplaceEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...eventData,
      txHash: generateTxHash(),
      blockNumber: nextBlock,
      timestamp: currentBlockTimestamp,
    };
    setEvents((prev) => [newEvent, ...prev]);
  };

  const advanceBlockTime = (seconds: number) => {
    setCurrentBlockTimestamp((prev) => prev + seconds);
    setCurrentBlockNumber((prev) => prev + Math.max(1, Math.floor(seconds / 12)));
  };

  const fastForwardToAuctionEnd = (contractAddress: string, tokenId: number) => {
    const nft = nfts.find(
      (n) =>
        n.contractAddress.toLowerCase() === contractAddress.toLowerCase() &&
        n.tokenId === tokenId
    );
    if (nft && nft.listing && nft.listing.isAuction && nft.listing.endTime > 0) {
      const targetTime = nft.listing.endTime + 5; // 5 seconds past end
      if (targetTime > currentBlockTimestamp) {
        const delta = targetTime - currentBlockTimestamp;
        advanceBlockTime(delta);
      }
    }
  };

  const resetBlockTime = () => {
    setCurrentBlockTimestamp(Math.floor(Date.now() / 1000));
  };

  // Helper: distributeFunds implementation matching Solidity _distributeFunds
  const _distributeFunds = (
    nft: NFTItem,
    seller: string,
    salePrice: number
  ) => {
    const platformFee = (salePrice * platformFeeBps) / 10000;
    const royaltyAmount = (salePrice * (nft.royaltyBps || 0)) / 10000;
    const sellerProceeds = salePrice - platformFee - royaltyAmount;

    setPendingWithdrawals((prev) => {
      const next = { ...prev };
      // Credit platform fee to contract owner
      next[contractOwnerAddress] = (next[contractOwnerAddress] || 0) + platformFee;
      
      // Credit royalty to creator (if > 0)
      if (royaltyAmount > 0 && nft.creator) {
        next[nft.creator] = (next[nft.creator] || 0) + royaltyAmount;
      }
      
      // Credit seller proceeds
      next[seller] = (next[seller] || 0) + sellerProceeds;
      
      return next;
    });

    return { platformFee, royaltyAmount, sellerProceeds };
  };

  // Contract Function: listItem
  const listItem = (
    nftContract: string,
    tokenId: number,
    price: number,
    isAuction: boolean,
    durationSeconds: number
  ): { success: boolean; error?: string } => {
    const nftIndex = nfts.findIndex(
      (n) =>
        n.contractAddress.toLowerCase() === nftContract.toLowerCase() &&
        n.tokenId === tokenId
    );

    if (nftIndex === -1) {
      return { success: false, error: 'NFT not found on contract' };
    }

    const nft = nfts[nftIndex];

    // modifier isOwner
    if (nft.owner.toLowerCase() !== currentAccount.address.toLowerCase()) {
      return { success: false, error: 'Reverted: Not token owner' };
    }

    // require(price > 0, "Price must be > 0");
    if (price <= 0) {
      return { success: false, error: 'Reverted: Price must be > 0' };
    }

    // require(!listings[nftContract][tokenId].active, "Already listed");
    if (nft.listing && nft.listing.active) {
      return { success: false, error: 'Reverted: Already listed' };
    }

    // require(IERC721(nftContract).isApprovedForAll(...) || ... == address(this), "Marketplace not approved");
    if (!nft.isApprovedMarketplace) {
      return {
        success: false,
        error: 'Reverted: Marketplace not approved. Approve the contract first via ERC721 setApprovalForAll or approve.',
      };
    }

    let endTime = 0;
    if (isAuction) {
      // require(durationSeconds >= 5 minutes, "Auction duration too short");
      if (durationSeconds < 300) {
        return {
          success: false,
          error: 'Reverted: Auction duration too short (minimum 5 minutes / 300s required)',
        };
      }
      endTime = currentBlockTimestamp + durationSeconds;
    }

    const newListing: Listing = {
      seller: currentAccount.address,
      price: price,
      isAuction: isAuction,
      endTime: endTime,
      highestBidder: '0x0000000000000000000000000000000000000000',
      highestBid: 0,
      active: true,
    };

    setNfts((prev) => {
      const copy = [...prev];
      copy[nftIndex] = {
        ...copy[nftIndex],
        listing: newListing,
      };
      return copy;
    });

    addEvent({
      type: 'ItemListed',
      nftContract,
      tokenId,
      actor: currentAccount.address,
      priceOrBid: price,
      details: `${currentAccount.name} listed ${nft.name} for ${
        isAuction ? 'Timed Auction (Reserve ' : 'Fixed Price ('
      }${price.toFixed(3)} ETH)`,
      gasUsed: 114250,
    });

    return { success: true };
  };

  // Contract Function: buyItem
  const buyItem = (
    nftContract: string,
    tokenId: number,
    paymentAmount?: number
  ): { success: boolean; error?: string } => {
    const nftIndex = nfts.findIndex(
      (n) =>
        n.contractAddress.toLowerCase() === nftContract.toLowerCase() &&
        n.tokenId === tokenId
    );

    if (nftIndex === -1) {
      return { success: false, error: 'NFT not found' };
    }

    const nft = nfts[nftIndex];
    const item = nft.listing;

    // require(item.active && !item.isAuction, "Not available for direct buy");
    if (!item || !item.active || item.isAuction) {
      return { success: false, error: 'Reverted: Not available for direct buy' };
    }

    const sentValue = paymentAmount !== undefined ? paymentAmount : item.price;

    // require(msg.value >= item.price, "Insufficient ETH sent");
    if (sentValue < item.price) {
      return { success: false, error: 'Reverted: Insufficient ETH sent' };
    }

    // Check account balance
    if (currentAccount.ethBalance < sentValue) {
      return { success: false, error: 'Insufficient balance in connected wallet' };
    }

    // Check not buying own item
    if (item.seller.toLowerCase() === currentAccount.address.toLowerCase()) {
      return { success: false, error: 'Reverted: Seller cannot buy own item' };
    }

    // Deduct ETH from buyer
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.address.toLowerCase() === currentAccount.address.toLowerCase()
          ? { ...acc, ethBalance: acc.ethBalance - sentValue }
          : acc
      )
    );

    // item.active = false
    // _distributeFunds
    const { platformFee, royaltyAmount, sellerProceeds } = _distributeFunds(
      nft,
      item.seller,
      item.price
    );

    // Overpayment refund: if (msg.value > item.price) pendingWithdrawals[msg.sender] += (msg.value - item.price);
    const overpayment = sentValue - item.price;
    if (overpayment > 0) {
      setPendingWithdrawals((prev) => ({
        ...prev,
        [currentAccount.address]: (prev[currentAccount.address] || 0) + overpayment,
      }));
    }

    // IERC721 safeTransferFrom
    setNfts((prev) => {
      const copy = [...prev];
      copy[nftIndex] = {
        ...copy[nftIndex],
        owner: currentAccount.address,
        listing: {
          ...item,
          active: false,
        },
      };
      return copy;
    });

    addEvent({
      type: 'ItemBought',
      nftContract,
      tokenId,
      actor: currentAccount.address,
      priceOrBid: item.price,
      details: `${currentAccount.name} bought ${nft.name} for ${item.price.toFixed(3)} ETH`,
      gasUsed: 148200,
      payouts: {
        sellerProceeds,
        platformFee,
        royaltyAmount,
        royaltyReceiver: nft.creator,
      },
    });

    return { success: true };
  };

  // Contract Function: placeBid
  const placeBid = (
    nftContract: string,
    tokenId: number,
    bidAmount: number
  ): { success: boolean; error?: string } => {
    const nftIndex = nfts.findIndex(
      (n) =>
        n.contractAddress.toLowerCase() === nftContract.toLowerCase() &&
        n.tokenId === tokenId
    );

    if (nftIndex === -1) {
      return { success: false, error: 'NFT not found' };
    }

    const nft = nfts[nftIndex];
    const item = nft.listing;

    // require(item.active && item.isAuction, "Not an active auction");
    if (!item || !item.active || !item.isAuction) {
      return { success: false, error: 'Reverted: Not an active auction' };
    }

    // require(block.timestamp < item.endTime, "Auction ended");
    if (currentBlockTimestamp >= item.endTime) {
      return { success: false, error: 'Reverted: Auction ended' };
    }

    // require(msg.sender != item.seller, "Seller cannot bid");
    if (currentAccount.address.toLowerCase() === item.seller.toLowerCase()) {
      return { success: false, error: 'Reverted: Seller cannot bid on own auction' };
    }

    // uint256 minRequired = item.highestBid == 0 ? item.price : item.highestBid + ((item.highestBid * 5) / 100);
    const minRequired =
      item.highestBid === 0
        ? item.price
        : item.highestBid + (item.highestBid * 5) / 100;

    // require(msg.value >= minRequired, "Bid below minimum increment");
    if (bidAmount < minRequired - 0.000001) {
      return {
        success: false,
        error: `Reverted: Bid below minimum increment. Min required is ${minRequired.toFixed(3)} ETH (+5% min bump)`,
      };
    }

    // Check account balance
    if (currentAccount.ethBalance < bidAmount) {
      return { success: false, error: 'Insufficient ETH balance to cover bid' };
    }

    // Credit previous highest bidder for safe withdrawal
    if (
      item.highestBidder &&
      item.highestBidder !== '0x0000000000000000000000000000000000000000' &&
      item.highestBid > 0
    ) {
      setPendingWithdrawals((prev) => ({
        ...prev,
        [item.highestBidder]: (prev[item.highestBidder] || 0) + item.highestBid,
      }));
    }

    // Deduct bidAmount from bidder's wallet balance
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.address.toLowerCase() === currentAccount.address.toLowerCase()
          ? { ...acc, ethBalance: acc.ethBalance - bidAmount }
          : acc
      )
    );

    // Update listing state
    setNfts((prev) => {
      const copy = [...prev];
      copy[nftIndex] = {
        ...copy[nftIndex],
        listing: {
          ...item,
          highestBidder: currentAccount.address,
          highestBid: bidAmount,
        },
      };
      return copy;
    });

    addEvent({
      type: 'BidPlaced',
      nftContract,
      tokenId,
      actor: currentAccount.address,
      priceOrBid: bidAmount,
      details: `${currentAccount.name} placed a bid of ${bidAmount.toFixed(3)} ETH on ${nft.name}`,
      gasUsed: 71200,
    });

    return { success: true };
  };

  // Contract Function: settleAuction
  const settleAuction = (
    nftContract: string,
    tokenId: number
  ): { success: boolean; error?: string } => {
    const nftIndex = nfts.findIndex(
      (n) =>
        n.contractAddress.toLowerCase() === nftContract.toLowerCase() &&
        n.tokenId === tokenId
    );

    if (nftIndex === -1) {
      return { success: false, error: 'NFT not found' };
    }

    const nft = nfts[nftIndex];
    const item = nft.listing;

    // require(item.active && item.isAuction, "Invalid auction");
    if (!item || !item.active || !item.isAuction) {
      return { success: false, error: 'Reverted: Invalid auction' };
    }

    // require(block.timestamp >= item.endTime, "Auction still active");
    if (currentBlockTimestamp < item.endTime) {
      const remainingSeconds = item.endTime - currentBlockTimestamp;
      return {
        success: false,
        error: `Reverted: Auction still active (${remainingSeconds}s remaining). Fast forward block time to test settlement.`,
      };
    }

    const hasBids =
      item.highestBidder &&
      item.highestBidder !== '0x0000000000000000000000000000000000000000' &&
      item.highestBid > 0;

    if (hasBids) {
      // _distributeFunds(nftContract, tokenId, item.seller, item.highestBid);
      const { platformFee, royaltyAmount, sellerProceeds } = _distributeFunds(
        nft,
        item.seller,
        item.highestBid
      );

      // IERC721 safeTransferFrom(item.seller, item.highestBidder, tokenId)
      setNfts((prev) => {
        const copy = [...prev];
        copy[nftIndex] = {
          ...copy[nftIndex],
          owner: item.highestBidder,
          listing: {
            ...item,
            active: false,
          },
        };
        return copy;
      });

      addEvent({
        type: 'AuctionSettled',
        nftContract,
        tokenId,
        actor: currentAccount.address,
        priceOrBid: item.highestBid,
        details: `Auction settled for ${nft.name}. Winner: ${item.highestBidder.slice(0, 6)}...${item.highestBidder.slice(-4)} at ${item.highestBid.toFixed(3)} ETH`,
        gasUsed: 165400,
        payouts: {
          sellerProceeds,
          platformFee,
          royaltyAmount,
          royaltyReceiver: nft.creator,
        },
      });
    } else {
      // item.active = false; ItemCanceled
      setNfts((prev) => {
        const copy = [...prev];
        copy[nftIndex] = {
          ...copy[nftIndex],
          listing: {
            ...item,
            active: false,
          },
        };
        return copy;
      });

      addEvent({
        type: 'ItemCanceled',
        nftContract,
        tokenId,
        actor: item.seller,
        details: `Auction for ${nft.name} concluded with zero bids. Item returned to seller.`,
        gasUsed: 52100,
      });
    }

    return { success: true };
  };

  // Contract Function: cancelListing
  const cancelListing = (
    nftContract: string,
    tokenId: number
  ): { success: boolean; error?: string } => {
    const nftIndex = nfts.findIndex(
      (n) =>
        n.contractAddress.toLowerCase() === nftContract.toLowerCase() &&
        n.tokenId === tokenId
    );

    if (nftIndex === -1) {
      return { success: false, error: 'NFT not found' };
    }

    const nft = nfts[nftIndex];
    const item = nft.listing;

    // modifier isOwner
    if (nft.owner.toLowerCase() !== currentAccount.address.toLowerCase()) {
      return { success: false, error: 'Reverted: Not token owner' };
    }

    // require(item.active, "Not listed");
    if (!item || !item.active) {
      return { success: false, error: 'Reverted: Not listed' };
    }

    // if (item.isAuction) { require(item.highestBidder == address(0), "Cannot cancel auction with bids"); }
    if (
      item.isAuction &&
      item.highestBidder &&
      item.highestBidder !== '0x0000000000000000000000000000000000000000' &&
      item.highestBid > 0
    ) {
      return {
        success: false,
        error: 'Reverted: Cannot cancel auction with bids already placed',
      };
    }

    setNfts((prev) => {
      const copy = [...prev];
      copy[nftIndex] = {
        ...copy[nftIndex],
        listing: {
          ...item,
          active: false,
        },
      };
      return copy;
    });

    addEvent({
      type: 'ItemCanceled',
      nftContract,
      tokenId,
      actor: currentAccount.address,
      details: `${currentAccount.name} canceled listing for ${nft.name}`,
      gasUsed: 48900,
    });

    return { success: true };
  };

  // Contract Function: withdrawProceeds
  const withdrawProceeds = (
    targetAddress?: string
  ): { success: boolean; amountWithdrawn?: number; error?: string } => {
    const claimant = targetAddress || currentAccount.address;
    const amount = pendingWithdrawals[claimant] || 0;

    // require(amount > 0, "No funds to withdraw");
    if (amount <= 0) {
      return { success: false, error: 'Reverted: No funds to withdraw' };
    }

    // pendingWithdrawals[msg.sender] = 0;
    setPendingWithdrawals((prev) => {
      const copy = { ...prev };
      delete copy[claimant];
      return copy;
    });

    // Credit ETH to claimant's account
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.address.toLowerCase() === claimant.toLowerCase()
          ? { ...acc, ethBalance: acc.ethBalance + amount }
          : acc
      )
    );

    addEvent({
      type: 'WithdrawProceeds',
      nftContract: MARKETPLACE_CONTRACT_ADDRESS,
      tokenId: 0,
      actor: claimant,
      priceOrBid: amount,
      details: `${claimant.slice(0, 6)}...${claimant.slice(-4)} successfully withdrew ${amount.toFixed(4)} ETH via pull-payment`,
      gasUsed: 31200,
    });

    return { success: true, amountWithdrawn: amount };
  };

  // Auxiliary ERC-721 approval
  const setApprovalForMarketplace = (
    nftContract: string,
    tokenId: number,
    approved: boolean
  ) => {
    setNfts((prev) =>
      prev.map((item) => {
        if (
          item.contractAddress.toLowerCase() === nftContract.toLowerCase() &&
          item.tokenId === tokenId
        ) {
          return { ...item, isApprovedMarketplace: approved };
        }
        return item;
      })
    );

    addEvent({
      type: 'MarketplaceApproved',
      nftContract,
      tokenId,
      actor: currentAccount.address,
      details: `${currentAccount.name} ${approved ? 'approved' : 'revoked approval for'} NFTMarketplace contract on Token #${tokenId}`,
      gasUsed: 44000,
    });
  };

  // Auxiliary: Mint test ERC-721 token
  const mintNFT = (
    name: string,
    collectionName: string,
    description: string,
    imageUrl: string,
    royaltyBps: number
  ) => {
    const nextTokenId = Math.max(...nfts.map((n) => n.tokenId), 100) + 1;
    const newNFT: NFTItem = {
      contractAddress: DEFAULT_NFT_CONTRACT_ADDRESS,
      tokenId: nextTokenId,
      name,
      collectionName: collectionName || 'Genesis Vault',
      description,
      imageUrl: imageUrl || '/src/assets/images/nft_cyber_monolith_1794466217310.jpg',
      owner: currentAccount.address,
      creator: currentAccount.address,
      royaltyBps: royaltyBps || 500,
      isApprovedMarketplace: true,
      listing: null,
      attributes: [
        { trait_type: 'Collection', value: collectionName || 'Genesis' },
        { trait_type: 'Mint Block', value: currentBlockNumber },
        { trait_type: 'Royalty Standard', value: `EIP-2981 (${((royaltyBps || 500) / 100).toFixed(1)}%)` },
      ],
    };

    setNfts((prev) => [newNFT, ...prev]);

    addEvent({
      type: 'TokenMinted',
      nftContract: DEFAULT_NFT_CONTRACT_ADDRESS,
      tokenId: nextTokenId,
      actor: currentAccount.address,
      details: `${currentAccount.name} minted ${name} (Token #${nextTokenId}) with ${(
        royaltyBps / 100
      ).toFixed(1)}% EIP-2981 royalty`,
      gasUsed: 145000,
    });

    return { success: true, tokenId: nextTokenId };
  };

  const resetAllState = () => {
    setAccounts(INITIAL_ACCOUNTS);
    setCurrentAccount(INITIAL_ACCOUNTS[0]);
    setNfts(INITIAL_NFTS);
    setEvents(INITIAL_EVENTS);
    setPendingWithdrawals({});
    setCurrentBlockTimestamp(Math.floor(Date.now() / 1000));
    setCurrentBlockNumber(19842125);
  };

  // Total ETH in contract escrow: pendingWithdrawals sum + active auction highest bids
  const pendingTotal = Object.values(pendingWithdrawals).reduce((a, b) => a + b, 0);
  const activeAuctionBidsTotal = nfts
    .filter((n) => n.listing && n.listing.active && n.listing.isAuction && n.listing.highestBid > 0)
    .reduce((acc, curr) => acc + (curr.listing?.highestBid || 0), 0);
  const contractEthBalance = pendingTotal + activeAuctionBidsTotal;

  return (
    <MarketplaceContext.Provider
      value={{
        accounts,
        currentAccount,
        setCurrentAccount,
        switchAccountById,
        connectWeb3Wallet,
        nfts,
        events,
        pendingWithdrawals,
        platformFeeBps,
        contractOwnerAddress,
        contractEthBalance,
        currentBlockTimestamp,
        currentBlockNumber,
        advanceBlockTime,
        fastForwardToAuctionEnd,
        resetBlockTime,
        listItem,
        buyItem,
        placeBid,
        settleAuction,
        cancelListing,
        withdrawProceeds,
        setApprovalForMarketplace,
        mintNFT,
        resetAllState,
      }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
};

export const useMarketplace = () => {
  const ctx = useContext(MarketplaceContext);
  if (!ctx) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return ctx;
};
