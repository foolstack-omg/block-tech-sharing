// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7;

library SafeMath {
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return sub(a, b, "SafeMath: subtraction overflow");
    }

    function sub(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        require(b <= a, errorMessage);
        uint256 c = a - b;

        return c;
    }

    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
    }

    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return div(a, b, "SafeMath: division by zero");
    }

    function div(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        // Solidity only automatically asserts when dividing by 0
        require(b > 0, errorMessage);
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }
}

interface IWETH {
    function deposit() external payable;

    function transfer(address to, uint256 value) external returns (bool);

    function withdraw(uint256) external;
}

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);

    function balanceOf(address owner) external view returns (uint256);

    function approve(address spender, uint256 value) external returns (bool);
}

interface IERC721 {
    function setApprovalForAll(address operator, bool _approved) external;
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

interface ILendingPoolAddressesProvider {
    function getPool() external view returns (address);
}

interface ILendingPool {
    function flashLoanSimple(
        address receiverAddress,
        address asset,
        uint256 amount,
        bytes calldata params,
        uint16 referralCode
    ) external;
}

interface IJoepegExchange {
    function matchAskWithTakerBidUsingAVAXAndWAVAX(
        TakerOrder calldata takerBid,
        MakerOrder calldata makerAsk
    ) external payable;

    function matchAskWithTakerBid(
        TakerOrder calldata takerBid,
        MakerOrder calldata makerAsk
    ) external;

    function matchBidWithTakerAsk(
        TakerOrder calldata takerAsk,
        MakerOrder calldata makerBid
    ) external;
}

struct MakerOrder {
    bool isOrderAsk; // true --> ask / false --> bid
    address signer; // signer of the maker order
    address collection; // collection address
    uint256 price; // price (used as )
    uint256 tokenId; // id of the token
    uint256 amount; // amount of tokens to sell/purchase (must be 1 for ERC721, 1+ for ERC1155)
    address strategy; // strategy for trade execution (e.g., DutchAuction, StandardSaleForFixedPrice)
    address currency; // currency (e.g., WAVAX)
    uint256 nonce; // order nonce (must be unique unless new maker order is meant to override existing one e.g., lower ask price)
    uint256 startTime; // startTime in timestamp
    uint256 endTime; // endTime in timestamp
    uint256 minPercentageToAsk; // slippage protection (9000 --> 90% of the final price must return to ask)
    bytes params; // additional parameters
    uint8 v; // v: parameter (27 or 28)
    bytes32 r; // r: parameter
    bytes32 s; // s: parameter
}

struct TakerOrder {
    bool isOrderAsk; // true --> ask / false --> bid
    address taker; // msg.sender
    uint256 price; // final price for the purchase
    uint256 tokenId;
    uint256 minPercentageToAsk; // // slippage protection (9000 --> 90% of the final price must return to ask)
    bytes params; // other params (e.g., tokenId)
}

contract Joepeg {
    using SafeMath for uint256;
    address private immutable _owner;
    address private constant _joepeg = 0xaE079eDA901F7727D0715aff8f82BA8295719977;
    address private constant _weth = 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7;
    address private constant _lendingPoolAddressProvider =  0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb;

    constructor() {
        _owner = msg.sender;
        IERC20(_weth).approve(0xaE079eDA901F7727D0715aff8f82BA8295719977, type(uint).max);
    }

    modifier onlyOwner() {
        require(msg.sender == _owner, "only owner.");
        _;
    }

    receive() external payable {}

    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public virtual returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function withdraw(address[] calldata erc20s) public onlyOwner {
        for (uint256 i = 0; i < erc20s.length; i++) {
            if (IERC20(erc20s[i]).balanceOf(address(this)) > 0) {
                IERC20(erc20s[i]).transfer(
                    _owner,
                    IERC20(erc20s[i]).balanceOf(address(this))
                );
            }
        }
        uint256 balance = address(this).balance;
        if (balance > 0) {
            payable(_owner).transfer(balance);
        }
    }


    function go(MakerOrder memory order, MakerOrder memory offerOrder, uint code) external onlyOwner {
        ILendingPoolAddressesProvider addressProvider = ILendingPoolAddressesProvider(
                _lendingPoolAddressProvider
            );

        ILendingPool lendingPool = ILendingPool(
            addressProvider.getPool()
        );
        // flashLoan `_debtToCover` amount of `_debtAsset`
        lendingPool.flashLoanSimple(
            address(this),
            _weth,
            order.price,
            abi.encode(order, offerOrder, code),
            uint16(0)
        );

        IERC20(_weth).transfer(_owner, IERC20(_weth).balanceOf(address(this)));
    }

    /**
     * 闪电贷回调
     */
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external returns (bool) {
        require(
            initiator == address(this),
            "flashloan executeOperation failed"
        );

        (MakerOrder memory order, MakerOrder memory offerOrder, uint code) = abi.decode(
            params,
            (MakerOrder, MakerOrder, uint)
        );
        uint256 owed = amount.add(premium);
        //
        // This contract now has the funds requested.
        // Your logic goes here.
        //
        // 1. 购买NFT
        TakerOrder memory takerBid;
        takerBid.isOrderAsk = false;
        takerBid.taker = address(this);
        takerBid.price = order.price;
        takerBid.tokenId = order.tokenId;
        takerBid.minPercentageToAsk = 0;
        takerBid.params = new bytes(0);
        IJoepegExchange(_joepeg).matchAskWithTakerBidUsingAVAXAndWAVAX(takerBid, order);
        // 0x16736b117ab4842C825599db1f1F4B0fd32D3751 JoePeg的ERC721管理器 可能会变化
        IERC721(order.collection).setApprovalForAll(0x16736b117ab4842C825599db1f1F4B0fd32D3751, true);
      
        // 2. 接受Offer
        TakerOrder memory takerAsk;
        takerAsk.isOrderAsk = true;
        takerAsk.taker = address(this);
        takerAsk.price = offerOrder.price;
        takerAsk.tokenId = offerOrder.tokenId;
        takerAsk.minPercentageToAsk = 0;
        takerAsk.params = new bytes(0);
        IJoepegExchange(_joepeg).matchBidWithTakerAsk(takerAsk, offerOrder);
        // 3. 检查利润是否足以还款
        require(IERC20(_weth).balanceOf(address(this)) >= owed, "LMAO");
        // At the end of your logic above, this contract owes
        // the flashloaned amounts + premiums.
        // Therefore ensure your contract has enough to repay
        // these amounts.

        // Approve the LendingPool contract allowance to *pull* the owed amount
        IERC20(asset).approve(msg.sender, owed);
        return true;
    }
}
