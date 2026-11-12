import { Account, NFTItem, MarketplaceEvent } from '../types/marketplace';
import { MARKETPLACE_CONTRACT_ADDRESS, DEFAULT_NFT_CONTRACT_ADDRESS } from './solidityContract';

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'alice',
    name: 'Alice (Collector & Seller)',
    role: 'Collector',
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Alice7099',
    ethBalance: 28.45,
  },
  {
    id: 'bob',
    name: 'Bob (Active Bidder)',
    role: 'Bidder',
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Bob3C44',
    ethBalance: 45.2,
  },
  {
    id: 'carol',
    name: 'Carol (Digital Artist)',
    role: 'Creator',
    address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Carol90F',
    ethBalance: 12.8,
  },
  {
    id: 'dave',
    name: 'Dave (Deployer & Owner)',
    role: 'Deployer & Owner',
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Davef39F',
    ethBalance: 100.0,
  },
];

// Reference the generated images directly
export const INITIAL_NFTS: NFTItem[] = [
  {
    contractAddress: DEFAULT_NFT_CONTRACT_ADDRESS,
    tokenId: 101,
    name: 'Cyber Monolith #01',
    collectionName: 'Synthetic Architecture',
    description:
      'Monolithic obsidian sculpture refracting quantum photonic violet light. Engineered with synthetic titanium lattice structural integrity.',
    imageUrl: '/src/assets/images/nft_cyber_monolith_1794466217310.jpg',
    owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Alice
    creator: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', // Carol
    royaltyBps: 750, // 7.5% EIP-2981 royalty
    isApprovedMarketplace: true,
    listing: {
      seller: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Alice
      price: 2.0, // starting reserve price
      isAuction: true,
      endTime: Math.floor(Date.now() / 1000) + 1200, // 20 minutes remaining
      highestBidder: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Bob
      highestBid: 2.5,
      active: true,
    },
    attributes: [
      { trait_type: 'Material', value: 'Obsidian & Titanium' },
      { trait_type: 'Refraction', value: 'Violet Photonic' },
      { trait_type: 'Epoch', value: 'Genesis 2026' },
      { trait_type: 'Rarity Index', value: '99.4%' },
    ],
  },
  {
    contractAddress: DEFAULT_NFT_CONTRACT_ADDRESS,
    tokenId: 102,
    name: 'Celestial Voyager #07',
    collectionName: 'Cosmic Pantheon',
    description:
      'Cosmic deity woven from galactic stardust filaments and liquid solar gold. Manifested at the edge of the Perseus galactic arm.',
    imageUrl: '/src/assets/images/nft_celestial_voyager_1794466218294.jpg',
    owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Alice
    creator: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', // Carol
    royaltyBps: 500, // 5.0% EIP-2981 royalty
    isApprovedMarketplace: true,
    listing: {
      seller: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Alice
      price: 4.2,
      isAuction: false,
      endTime: 0,
      highestBidder: '0x0000000000000000000000000000000000000000',
      highestBid: 0,
      active: true,
    },
    attributes: [
      { trait_type: 'Constellation', value: 'Perseus Deep Core' },
      { trait_type: 'Aura', value: 'Solar Filament' },
      { trait_type: 'Ascension', value: 'Tier V' },
      { trait_type: 'Edition', value: '1 of 1' },
    ],
  },
  {
    contractAddress: DEFAULT_NFT_CONTRACT_ADDRESS,
    tokenId: 103,
    name: 'Chrono Relic Tourbillon #12',
    collectionName: 'Horological Artefacts',
    description:
      'Sapphire glass skeleton timepiece with three-axis tourbillon escapement and hand-beveled brass mechanics on honed volcanic slate.',
    imageUrl: '/src/assets/images/nft_chrono_relic_1794466219559.jpg',
    owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Alice
    creator: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', // Carol
    royaltyBps: 1000, // 10.0% EIP-2981 royalty
    isApprovedMarketplace: true,
    listing: {
      seller: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Alice
      price: 1.8,
      isAuction: true,
      endTime: Math.floor(Date.now() / 1000) + 3600, // 1 hour remaining
      highestBidder: '0x0000000000000000000000000000000000000000',
      highestBid: 0,
      active: true,
    },
    attributes: [
      { trait_type: 'Escapement', value: 'Tri-Axial Tourbillon' },
      { trait_type: 'Crystal', value: 'Monocrystalline Sapphire' },
      { trait_type: 'Frequency', value: '28,800 vph' },
      { trait_type: 'Finish', value: 'Black Polished Anglage' },
    ],
  },
  {
    contractAddress: DEFAULT_NFT_CONTRACT_ADDRESS,
    tokenId: 104,
    name: 'Biomorphic Bloom #44',
    collectionName: 'Synthetic Organics',
    description:
      'Translucent organic glass formation with internal bioluminescent coral filaments. Unlisted asset resting in user inventory.',
    imageUrl: '/src/assets/images/nft_biomorphic_bloom_1794466219781.jpg',
    owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Alice
    creator: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', // Carol
    royaltyBps: 500, // 5.0% royalty
    isApprovedMarketplace: true,
    listing: null, // Ready to be listed!
    attributes: [
      { trait_type: 'Genus', value: 'Bioluminescent Florae' },
      { trait_type: 'Luminescence', value: '495nm Cyan' },
      { trait_type: 'Glass Purity', value: 'Grade 9 Vitreous' },
      { trait_type: 'State', value: 'Unlisted in Vault' },
    ],
  },
];

export const INITIAL_EVENTS: MarketplaceEvent[] = [
  {
    id: 'evt-1',
    type: 'ItemListed',
    nftContract: DEFAULT_NFT_CONTRACT_ADDRESS,
    tokenId: 101,
    txHash: '0x4f12ab7830b5993de012c8901e8284fa9348e30b1820468087261a8f9024c081',
    blockNumber: 19842100,
    timestamp: Math.floor(Date.now() / 1000) - 2400,
    actor: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    priceOrBid: 2.0,
    details: 'Alice listed Cyber Monolith #01 for Timed Auction (Reserve 2.0 ETH)',
    gasUsed: 114250,
  },
  {
    id: 'evt-2',
    type: 'BidPlaced',
    nftContract: DEFAULT_NFT_CONTRACT_ADDRESS,
    tokenId: 101,
    txHash: '0x9d54c1200fa88bb3e85e13d922a904128f993bc1e0503024849102484bc91024',
    blockNumber: 19842104,
    timestamp: Math.floor(Date.now() / 1000) - 1800,
    actor: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    priceOrBid: 2.5,
    details: 'Bob placed bid of 2.50 ETH on Cyber Monolith #01',
    gasUsed: 62890,
  },
  {
    id: 'evt-3',
    type: 'ItemListed',
    nftContract: DEFAULT_NFT_CONTRACT_ADDRESS,
    tokenId: 102,
    txHash: '0x12a849f10928a38c92b490d1829bb3010488f2910e40291048b1049281a94021',
    blockNumber: 19842110,
    timestamp: Math.floor(Date.now() / 1000) - 1200,
    actor: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    priceOrBid: 4.2,
    details: 'Alice listed Celestial Voyager #07 for Fixed Price Buy (4.20 ETH)',
    gasUsed: 98400,
  },
  {
    id: 'evt-4',
    type: 'ItemListed',
    nftContract: DEFAULT_NFT_CONTRACT_ADDRESS,
    tokenId: 103,
    txHash: '0x88f29c10e40291048b1049281a9402112a849f10928a38c92b490d1829bb3010',
    blockNumber: 19842118,
    timestamp: Math.floor(Date.now() / 1000) - 600,
    actor: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    priceOrBid: 1.8,
    details: 'Alice listed Chrono Relic #12 for Timed Auction (Reserve 1.8 ETH)',
    gasUsed: 114250,
  },
];
