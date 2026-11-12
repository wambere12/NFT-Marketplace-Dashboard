export const MARKETPLACE_CONTRACT_ADDRESS = '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318';
export const DEFAULT_NFT_CONTRACT_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

export const SOLIDITY_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTMarketplace is ReentrancyGuard, Ownable {
    struct Listing {
        address seller;
        uint256 price;
        bool isAuction;
        uint256 endTime;
        address highestBidder;
        uint256 highestBid;
        bool active;
    }

    uint256 public platformFeeBps = 250; // 2.5% marketplace fee
    // nftContract => tokenId => Listing
    mapping(address => mapping(uint256 => Listing)) public listings;
    // Pull-payment balances for sellers, creators, and outbid bidders
    mapping(address => uint256) public pendingWithdrawals;

    event ItemListed(address indexed nftContract, uint256 indexed tokenId, address indexed seller, uint256 price, bool isAuction, uint256 endTime);
    event ItemBought(address indexed nftContract, uint256 indexed tokenId, address indexed buyer, uint256 price);
    event BidPlaced(address indexed nftContract, uint256 indexed tokenId, address indexed bidder, uint256 amount);
    event AuctionSettled(address indexed nftContract, uint256 indexed tokenId, address indexed winner, uint256 amount);
    event ItemCanceled(address indexed nftContract, uint256 indexed tokenId, address indexed seller);

    constructor() Ownable(msg.sender) {}

    modifier isOwner(address nftContract, uint256 tokenId, address spender) {
        require(IERC721(nftContract).ownerOf(tokenId) == spender, "Not token owner");
        _;
    }

    /// @notice List an NFT for either Fixed Price or Timed Auction
    function listItem(
        address nftContract,
        uint256 tokenId,
        uint256 price,
        bool isAuction,
        uint256 durationSeconds
    ) external isOwner(nftContract, tokenId, msg.sender) {
        require(price > 0, "Price must be > 0");
        require(!listings[nftContract][tokenId].active, "Already listed");
        require(
            IERC721(nftContract).isApprovedForAll(msg.sender, address(this)) ||
            IERC721(nftContract).getApproved(tokenId) == address(this),
            "Marketplace not approved"
        );

        uint256 endTime = 0;
        if (isAuction) {
            require(durationSeconds >= 5 minutes, "Auction duration too short");
            endTime = block.timestamp + durationSeconds;
        }

        listings[nftContract][tokenId] = Listing({
            seller: msg.sender,
            price: price,
            isAuction: isAuction,
            endTime: endTime,
            highestBidder: address(0),
            highestBid: 0,
            active: true
        });

        emit ItemListed(nftContract, tokenId, msg.sender, price, isAuction, endTime);
    }

    /// @notice Purchase a fixed-price NFT immediately
    function buyItem(address nftContract, uint256 tokenId) external payable nonReentrant {
        Listing storage item = listings[nftContract][tokenId];
        require(item.active && !item.isAuction, "Not available for direct buy");
        require(msg.value >= item.price, "Insufficient ETH sent");

        item.active = false;
        _distributeFunds(nftContract, tokenId, item.seller, item.price);
        IERC721(nftContract).safeTransferFrom(item.seller, msg.sender, tokenId);

        // Refund any overpayment
        if (msg.value > item.price) {
            pendingWithdrawals[msg.sender] += (msg.value - item.price);
        }

        emit ItemBought(nftContract, tokenId, msg.sender, item.price);
    }

    /// @notice Place a bid on an active timed auction
    function placeBid(address nftContract, uint256 tokenId) external payable nonReentrant {
        Listing storage item = listings[nftContract][tokenId];
        require(item.active && item.isAuction, "Not an active auction");
        require(block.timestamp < item.endTime, "Auction ended");
        require(msg.sender != item.seller, "Seller cannot bid");

        uint256 minRequired = item.highestBid == 0 ? item.price : item.highestBid + ((item.highestBid * 5) / 100);
        require(msg.value >= minRequired, "Bid below minimum increment");

        // Credit previous highest bidder for safe withdrawal
        if (item.highestBidder != address(0)) {
            pendingWithdrawals[item.highestBidder] += item.highestBid;
        }

        item.highestBidder = msg.sender;
        item.highestBid = msg.value;

        emit BidPlaced(nftContract, tokenId, msg.sender, msg.value);
    }

    /// @notice Finalize an ended auction and transfer NFT + payouts
    function settleAuction(address nftContract, uint256 tokenId) external nonReentrant {
        Listing storage item = listings[nftContract][tokenId];
        require(item.active && item.isAuction, "Invalid auction");
        require(block.timestamp >= item.endTime, "Auction still active");

        item.active = false;

        if (item.highestBidder != address(0)) {
            _distributeFunds(nftContract, tokenId, item.seller, item.highestBid);
            IERC721(nftContract).safeTransferFrom(item.seller, item.highestBidder, tokenId);
            emit AuctionSettled(nftContract, tokenId, item.highestBidder, item.highestBid);
        } else {
            emit ItemCanceled(nftContract, tokenId, item.seller);
        }
    }

    /// @notice Cancel an active fixed-price listing or an auction with zero bids
    function cancelListing(address nftContract, uint256 tokenId) external isOwner(nftContract, tokenId, msg.sender) {
        Listing storage item = listings[nftContract][tokenId];
        require(item.active, "Not listed");
        if (item.isAuction) {
            require(item.highestBidder == address(0), "Cannot cancel auction with bids");
        }

        item.active = false;
        emit ItemCanceled(nftContract, tokenId, msg.sender);
    }

    /// @notice Pull-over-push withdrawal for sellers, royalty creators, and outbid users
    function withdrawProceeds() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");

        pendingWithdrawals[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "ETH transfer failed");
    }

    /// @dev Calculates platform fees and EIP-2981 creator royalties
    function _distributeFunds(address nftContract, uint256 tokenId, address seller, uint256 salePrice) internal {
        uint256 platformFee = (salePrice * platformFeeBps) / 10000;
        uint256 royaltyAmount = 0;
        address royaltyReceiver = address(0);

        if (IERC165(nftContract).supportsInterface(type(IERC2981).interfaceId)) {
            (royaltyReceiver, royaltyAmount) = IERC2981(nftContract).royaltyInfo(tokenId, salePrice);
        }

        uint256 sellerProceeds = salePrice - platformFee - royaltyAmount;

        pendingWithdrawals[owner()] += platformFee;
        if (royaltyAmount > 0 && royaltyReceiver != address(0)) {
            pendingWithdrawals[royaltyReceiver] += royaltyAmount;
        }
        pendingWithdrawals[seller] += sellerProceeds;
    }
}`;

export const CONTRACT_SECURITY_PATTERNS = [
  {
    title: 'Pull-over-Push Payments',
    description:
      'Prevents Denial of Service (DoS) attacks where a malicious contract rejects ether transfers. Proceeds and outbid refunds are escrowed in pendingWithdrawals.',
    method: 'withdrawProceeds()',
  },
  {
    title: 'EIP-2981 Royalty Standard',
    description:
      'Queries ERC-2981 interface on the NFT contract to automatically calculate and route secondary sale royalties to creators before seller payouts.',
    method: '_distributeFunds()',
  },
  {
    title: '5% Bid Increment Rule',
    description:
      'English auction requires each subsequent bid to exceed the previous highest bid by at least 5% (minRequired = highestBid + 5%), preventing griefing.',
    method: 'placeBid()',
  },
  {
    title: 'Overpayment Protection',
    description:
      'When buyers send more ETH than the fixed listing price, excess funds are safely credited to their pendingWithdrawals balance for withdrawal.',
    method: 'buyItem()',
  },
  {
    title: 'OpenZeppelin ReentrancyGuard',
    description:
      'Protects critical state mutations across buyItem, placeBid, settleAuction, and withdrawProceeds against re-entrant external calls.',
    method: 'nonReentrant',
  },
];
