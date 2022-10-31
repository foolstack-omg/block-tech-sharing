/**
 * Avax上YakSwap的套利合约
 * 逻辑：检测当前合约账户是否有足够的代币，若代币足够使用合约中的资产套利，若代币不足通过aave闪电贷进行套利
 * 代码完整可运行，但目前竞争者较多，盈利需要快速的节点
 * 仅供学习参考
 */

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

struct Trade {
    uint amountIn;
    uint amountOut;
    address[] path;
    address[] adapters;
}

interface IYakRouter {
    function swapNoSplit(
        Trade calldata _trade,
        address _to,
        uint _fee
    ) external;
}

contract Yak {
    using SafeMath for uint256;
    address private immutable _owner;
    address private constant _weth = 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7;
    address private constant _lendingPoolAddressProvider =  0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb;

    constructor() {
        _owner = msg.sender;
        IERC20(_weth).approve(0xC4729E56b831d74bBc18797e0e17A295fA77488c, type(uint).max);
    }

    modifier onlyOwner() {
        require(msg.sender == _owner, "only owner.");
        _;
    }

     function setApproval(address ierc20, address spender) external onlyOwner{
        IERC20(ierc20).approve(spender, type(uint).max);
    }

    receive() external payable {}

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


    function go(Trade memory trade) external onlyOwner {
        if(IERC20(_weth).balanceOf(address(this)) >= trade.amountIn) {
             IYakRouter(0xC4729E56b831d74bBc18797e0e17A295fA77488c).swapNoSplit(trade, address(this), 0);
        } else {
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
                trade.amountIn,
                abi.encode(trade),
                uint16(0)
            );
        }

       
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

        (Trade memory trade) = abi.decode(
            params,
            (Trade)
        );
        uint256 owed = amount.add(premium);
        //
        // This contract now has the funds requested.
        // Your logic goes here.
        //
        // 1. swap. 
        IYakRouter(0xC4729E56b831d74bBc18797e0e17A295fA77488c).swapNoSplit(trade, address(this), 0);
        
        // 2. 检查利润是否足以还款
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
