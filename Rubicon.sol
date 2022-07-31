/**
 * 基于Optimism上的订单簿DEX Rubicon和 Velodrome Dex套利
 * 由于测试几次跑到code = 3前一直报 gas amount exceeds gas limit而未定位到原因，遂放弃
 * 个人评估代码套利逻辑完整度 90%
 * 所以这份代码主要是套利思路上的分享，有经验有能力的可能可以找到问题所在，完成完成套利
 */


// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0;
pragma experimental ABIEncoderV2;


library Babylonian {
    // credit for this implementation goes to
    // https://github.com/abdk-consulting/abdk-libraries-solidity/blob/master/ABDKMath64x64.sol#L687
    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        // this block is equivalent to r = uint256(1) << (BitMath.mostSignificantBit(x) / 2);
        // however that code costs significantly more gas
        uint256 xx = x;
        uint256 r = 1;
        if (xx >= 0x100000000000000000000000000000000) {
            xx >>= 128;
            r <<= 64;
        }
        if (xx >= 0x10000000000000000) {
            xx >>= 64;
            r <<= 32;
        }
        if (xx >= 0x100000000) {
            xx >>= 32;
            r <<= 16;
        }
        if (xx >= 0x10000) {
            xx >>= 16;
            r <<= 8;
        }
        if (xx >= 0x100) {
            xx >>= 8;
            r <<= 4;
        }
        if (xx >= 0x10) {
            xx >>= 4;
            r <<= 2;
        }
        if (xx >= 0x8) {
            r <<= 1;
        }
        r = (r + x / r) >> 1;
        r = (r + x / r) >> 1;
        r = (r + x / r) >> 1;
        r = (r + x / r) >> 1;
        r = (r + x / r) >> 1;
        r = (r + x / r) >> 1;
        r = (r + x / r) >> 1; // Seven iterations should be enough
        uint256 r1 = x / r;
        return (r < r1 ? r : r1);
    }
}
library FullMath {
    function fullMul(uint256 x, uint256 y) internal pure returns (uint256 l, uint256 h) {
        uint256 mm = mulmod(x, y, type(uint).max);
        l = x * y;
        h = mm - l;
        if (mm < l) h -= 1;
    }

    function fullDiv(
        uint256 l,
        uint256 h,
        uint256 d
    ) private pure returns (uint256) {
        uint256 pow2 = d & type(uint).max - d - 1;
        d /= pow2;
        l /= pow2;
        l += h * (( type(uint).max -pow2 + 1) / pow2 + 1);
        uint256 r = 1;
        r *= 2 - d * r;
        r *= 2 - d * r;
        r *= 2 - d * r;
        r *= 2 - d * r;
        r *= 2 - d * r;
        r *= 2 - d * r;
        r *= 2 - d * r;
        r *= 2 - d * r;
        return l * r;
    }

    function mulDiv(
        uint256 x,
        uint256 y,
        uint256 d
    ) internal pure returns (uint256) {
        (uint256 l, uint256 h) = fullMul(x, y);

        uint256 mm = mulmod(x, y, d);
        if (mm > l) h -= 1;
        l -= mm;

        if (h == 0) return l / d;

        require(h < d, 'FullMath: FULLDIV_OVERFLOW');
        return fullDiv(l, h, d);
    }
}
library SafeMath {
    function add(uint x, uint y) internal pure returns (uint z) {
        require((z = x + y) >= x, 'ds-math-add-overflow');
    }

    function sub(uint x, uint y) internal pure returns (uint z) {
        require((z = x - y) <= x, 'ds-math-sub-underflow');
    }

    function mul(uint x, uint y) internal pure returns (uint z) {
        require(y == 0 || (z = x * y) / y == x, 'ds-math-mul-overflow');
    }
}


interface IERC20 {
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function balanceOf(address owner) external view returns (uint);
    function approve(address spender, uint value) external returns (bool);
    function transfer(address to, uint value) external returns (bool);
}

interface IWETH {
    function deposit() external payable;
    function transfer(address to, uint value) external returns (bool);
    function withdraw(uint) external;
}

interface IUniswapV2Pair {
    function name() external pure returns (string memory);
    function symbol() external pure returns (string memory);
    function decimals() external pure returns (uint8);
    function balanceOf(address owner) external view returns (uint);
   
    function token0() external view returns (address);
    function token1() external view returns (address);
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;
   
}

interface IRubiconMarket {
    function getBestOffer(address sell_gem, address buy_gem)
        external
        view
        returns (uint256);

    function getOffer(uint256 id)
        external
        view
        returns (
            uint256,
            address,
            uint256,
            address
        );

    function getWorseOffer(uint256 id) external view returns (uint256);

    function sellAllAmount(
        address pay_gem,
        uint256 pay_amt,
        address buy_gem,
        uint256 min_fill_amount
    ) external returns (uint256 fill_amt);

    function getBuyAmount(
        address buy_gem,
        address pay_gem,
        uint256 pay_amt
    ) external view returns (uint256 fill_amt);
}

/**
 * Dex采用 Velodrome 交易费率为固定万2
 * Velodrome
 * OP/USDC(0x47029bc8f5CBe3b464004E87eF9c9419a48018cd)
 * ETH/USDC(0x79c912FEF520be002c2B6e57EC4324e260f38E50)
 * OP/ETH(0xcdd41009E74bD1AE4F7B2EeCF892e4bC718b9302)
 * OP: 0x4200000000000000000000000000000000000042
 * USDC: 0x7F5c764cBc14f9669B88837ca1490cCa17c31607
 * WETH: 0x4200000000000000000000000000000000000006
 * 
 * RubiconMarket: 0x7a512d3609211e719737E82c7bb7271eC05Da70d
 */
contract Rubicon {
    using SafeMath for uint256;

    address private constant WETH = 0x4200000000000000000000000000000000000006;
    address private constant OP = 0x4200000000000000000000000000000000000042;
    address private constant USDC = 0x7F5c764cBc14f9669B88837ca1490cCa17c31607;

    address private constant OPUSDC = 0x47029bc8f5CBe3b464004E87eF9c9419a48018cd;
    address private constant ETHUSDC = 0x79c912FEF520be002c2B6e57EC4324e260f38E50;
    address private constant OPETH = 0xcdd41009E74bD1AE4F7B2EeCF892e4bC718b9302;

    
    struct Gem{
        address pay;
        address buy;
    }

    address public immutable _owner;
    IRubiconMarket iRubiconMarket;

    constructor() {
        _owner = msg.sender;
        iRubiconMarket = IRubiconMarket(0x7a512d3609211e719737E82c7bb7271eC05Da70d);

        // 是否需要Approve存疑
        IERC20(WETH).approve(address(iRubiconMarket), type(uint).max);
        IERC20(OP).approve(address(iRubiconMarket), type(uint).max);
        IERC20(USDC).approve(address(iRubiconMarket), type(uint).max);
    }

    modifier onlyOwner {
        require(msg.sender == _owner, "only self can do.");
        _;
    }

    function setApproval(address ierc20, address spender) external onlyOwner{
        IERC20(ierc20).approve(spender, type(uint).max);
    }


    receive() external payable {}

    function withdraw(address[] calldata erc20s) external onlyOwner {
        for(uint i = 0; i < erc20s.length; i++) {
            if(IERC20(erc20s[i]).balanceOf(address(this)) > 0) {
                IERC20(erc20s[i]).transfer(_owner, IERC20(erc20s[i]).balanceOf(address(this)));
            }
        }
        uint balance = address(this).balance;
        if(balance > 0) {
            payable(_owner).transfer(balance);
        }
    }

    fallback(bytes calldata _input) external returns (bytes memory) {
        if (_input.length > 0) {
            (address sender, uint256 amount0, uint256 amount1, bytes memory data) = abi.decode(_input[4:], (address, uint256, uint256, bytes));
            callback(sender, amount0, amount1, data);
        }
    }

    function callback(address _sender, uint256 _amount0, uint256 _amount1, bytes memory _data) private {
        (Gem memory gem, uint256 maxTradeAmt, uint256 amountIn, uint256 code) = abi.decode(_data, (Gem, uint256, uint256, uint256));
        // 这里rubiconMarket会把pay代币转过去，已提前approve
        require(iRubiconMarket.sellAllAmount(gem.pay, maxTradeAmt, gem.buy, 0) > amountIn, "Not Enough Fill Amt");
         require(code != 5, "5");
        // 判断是否把利润转换成WETH
        if(gem.buy != WETH) {
            if(gem.buy == OP) {
                uint256 balance = IERC20(OP).balanceOf(address(this));
                IERC20(OP).transfer(OPETH, balance);
                uint256 amountEthOut = getAmountOut(OPETH, OP, balance);
                require(code != 6, "6");
                IUniswapV2Pair(OPETH).swap(amountEthOut, 0, address(this), new bytes(0));
            }
            if(gem.buy == USDC) {
                uint256 balance = IERC20(USDC).balanceOf(address(this));
                IERC20(USDC).transfer(OPUSDC, balance);
                uint256 amountEthOut = getAmountOut(ETHUSDC, USDC, balance);
                require(code != 7, "7");
                IUniswapV2Pair(ETHUSDC).swap(amountEthOut, 0, address(this), new bytes(0));
            }
        }
        require(code != 8, "8");

        // 还款
        IWETH(gem.buy).transfer(msg.sender, amountIn);
         require(code != 9, "9");
    }


    /**
     * 开始套利
     */
    function go(address pair, Gem memory gem, uint256 gasAmount, uint256 code) external onlyOwner {
        // 1. 通过getBestOffer和getWorseOffer获取到offer_id，通过getOffer取得信息，计算最大交易额 max_trade_amt
        uint256 reserveA;
        uint256 reserveB;
        {
            (uint256 reserve0, uint256 reserve1, ) = IUniswapV2Pair(pair).getReserves();
            (reserveA, reserveB) = IUniswapV2Pair(pair).token0() == gem.pay ? (reserve0, reserve1) : (reserve1, reserve0);
        }

        uint256 maxTradeAmt = 0;
       
        require(code != 1, "1");
        {
            uint256 offerId = iRubiconMarket.getBestOffer(gem.buy, gem.pay);
            require(offerId != 0, "No Offer");

            // 这里pay_amt是别人提供的offer表示出售的数量, buy_amt表示别人要交换的数量
            // AVAX USDC
            (uint256 offerPayAmt, , uint256 offerBuyAmt, ) = iRubiconMarket.getOffer(offerId);
            
            
            (bool atob, uint amountIn) = computeProfitMaximizingTrade(offerBuyAmt, offerPayAmt, reserveA, reserveB);

            require(code != 100, toString(amountIn));
            require(code != 101, toString(offerBuyAmt));
            require(code != 102, toString(offerPayAmt));

            // USDC AVAX
            // B to A = AVAX => USDC
            if(amountIn == 0 || atob) {
                revert("computeProfitMaximizingTrade Failed");
            }
            // offerPayAmt和amountIn中取最小值
            maxTradeAmt = maxTradeAmt + (amountIn > offerPayAmt ? offerBuyAmt  : amountIn * offerBuyAmt / offerPayAmt);
            // while(true) {
            //     (bool atob, uint amountIn) = computeProfitMaximizingTrade(10**18, offerBuyAmt * 10**18 / offerPayAmt, reserveA, reserveB);
            //     if(!(atob && amountIn > 0)) {
            //         break;
            //     }
            //     // offerPayAmt和amountIn中取最小值

            //     maxTradeAmt = maxTradeAmt + (amountIn > offerPayAmt ? offerPayAmt : amountIn);
            //     offerId = iRubiconMarket.getWorseOffer(offerId);
            //     if(offerId == 0) {
            //         break;
            //     }
            //     (offerPayAmt, , offerBuyAmt, ) = iRubiconMarket.getOffer(offerId);
            // }
        }
        require(code != 2, "2");
        
        require(maxTradeAmt > 0, "maxTradeAmt == 0");
        uint256 swapAmountOut;
        uint256 swapAmountIn;
        {
            require(code != 10, toString(maxTradeAmt));

            uint256 totalBuyAmt = iRubiconMarket.getBuyAmount(gem.buy, gem.pay, maxTradeAmt);
            // 2. borrow_amt(amountOut) = max_trade_amt * 20 /10000 + max_trade_amt, 后面需要将borrow_amt发送至market合约地址, max_trade_amt即sell_amt
            swapAmountOut = maxTradeAmt * 20 / 10000 + maxTradeAmt;

            require(code != 11, "11");
            swapAmountIn = getAmountIn(swapAmountOut, reserveA, reserveB);
            require(totalBuyAmt > swapAmountIn, "swapAmountIn >= totalBuyAmt");
             require(code != 12, "12");
            // 3. 计算max_trade_amt换取的 buy_amt - amountIn的利润 换算成eth后，是否大于gasAmount
            if(gem.buy == WETH) {
                require(totalBuyAmt > swapAmountIn + gasAmount, "No Profit");
            }
            if(gem.buy == OP) {
                require(code != 13, "13");
                require(getAmountOut(OPETH, OP, totalBuyAmt - swapAmountIn) > gasAmount, "No Profit");
            }
            if(gem.buy == USDC) {
                 require(code != 14, "14");
                require(getAmountOut(ETHUSDC, USDC, totalBuyAmt - swapAmountIn) > gasAmount, "No Profit");
            }
        }
        
        require(code != 3, "3");
        (uint256 amount0Out, uint256 amount1Out) = IUniswapV2Pair(pair).token0() == gem.pay ? (swapAmountOut, uint256(0)) : (uint256(0), swapAmountOut);
        // 4. 如果有利润可以执行，则swap，回调callback函数，sellAllAmount，把利润换成WETH=
        IUniswapV2Pair(pair).swap(amount0Out, amount1Out, address(this), abi.encode(gem, maxTradeAmt, swapAmountIn, code));
    }

    
    // function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) internal pure returns (uint amountOut) {
    //     uint amountInWithFee = amountIn.mul(9998);
    //     uint numerator = amountInWithFee.mul(reserveOut);
    //     uint denominator = reserveIn.mul(10000).add(amountInWithFee);
    //     amountOut = numerator / denominator;
    // }
    function getAmountOut(address pair, address tokenIn, uint amountIn) internal view returns (uint amountOut) {
        IUniswapV2Pair iPair = IUniswapV2Pair(pair);
      
        (uint reserve0, uint reserve1,) = iPair.getReserves();
        (uint reserveA, uint reserveB) = (tokenIn == iPair.token0() ? (reserve0, reserve1) : (reserve1, reserve0));

        uint amountInWithFee = amountIn * 9998;
        uint numerator = amountInWithFee * reserveB;
        uint denominator = reserveA * 10000 + amountInWithFee;
        amountOut = numerator / denominator;
    }

   
    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) internal pure returns (uint amountIn) {
        uint numerator = reserveIn.mul(amountOut).mul(10000);
        uint denominator = reserveOut.sub(amountOut).mul(9998);
        amountIn = (numerator / denominator).add(1);
    }

    function computeProfitMaximizingTrade(
        uint256 truePriceTokenA,
        uint256 truePriceTokenB,
        uint256 reserveA,
        uint256 reserveB
    ) pure internal returns (bool aToB, uint256 amountIn) {
        aToB = FullMath.mulDiv(reserveA, truePriceTokenB, reserveB) < truePriceTokenA;

        uint256 invariant = reserveA.mul(reserveB);

        uint256 leftSide = Babylonian.sqrt(
            FullMath.mulDiv(
                invariant.mul(10000),
                aToB ? truePriceTokenA : truePriceTokenB,
                (aToB ? truePriceTokenB : truePriceTokenA).mul(9998)
            )
        );
        uint256 rightSide = (aToB ? reserveA.mul(1000) : reserveB.mul(10000)) / 9998;

        if (leftSide < rightSide) return (false, 0);

        // compute the amount that must be sent to move the price to the profit-maximizing price
        amountIn = leftSide.sub(rightSide);
    }

    function toString(uint256 value) internal pure returns (string memory) {
        // Inspired by OraclizeAPI's implementation - MIT licence
        // https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol

        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}

