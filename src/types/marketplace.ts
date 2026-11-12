export interface Listing {
  seller: string;
  price: number; // in ETH
  isAuction: boolean;
  endTime: number; // timestamp in seconds (block.timestamp)
  highestBidder: string;
  highestBid: number; // in ETH
  active: boolean;
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

export interface NFTItem {
  contractAddress: string;
  tokenId: number;
  name: string;
  collectionName: string;
  description: string;
  imageUrl: string;
  owner: string; // address of current token owner
  creator: string; // address of original creator (royalty receiver)
  royaltyBps: number; // e.g., 500 = 5.0%, 750 = 7.5%
  isApprovedMarketplace: boolean; // whether approved for NFTMarketplace
  listing: Listing | null;
  attributes: NFTAttribute[];
}

export interface Account {
  id: string;
  name: string;
  role: 'Collector' | 'Bidder' | 'Creator' | 'Deployer & Owner';
  address: string;
  avatar: string;
  ethBalance: number; // in ETH
  isRealWallet?: boolean;
}

export type EventType =
  | 'ItemListed'
  | 'ItemBought'
  | 'BidPlaced'
  | 'AuctionSettled'
  | 'ItemCanceled'
  | 'WithdrawProceeds'
  | 'TokenMinted'
  | 'MarketplaceApproved';

export interface MarketplaceEvent {
  id: string;
  type: EventType;
  nftContract: string;
  tokenId: number;
  txHash: string;
  blockNumber: number;
  timestamp: number; // in seconds
  actor: string;
  priceOrBid?: number;
  details: string;
  gasUsed: number;
  payouts?: {
    sellerProceeds?: number;
    platformFee?: number;
    royaltyAmount?: number;
    royaltyReceiver?: string;
  };
}

export interface PendingWithdrawal {
  address: string;
  accountName?: string;
  amount: number; // in ETH
}
