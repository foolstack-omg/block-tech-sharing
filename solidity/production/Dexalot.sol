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
library Bytes32Library {

    // utility function to convert bytes32 to string
    function bytes32ToString(bytes32 _bytes32) internal pure returns (string memory) {
        uint8 i = 0;
        while(i < 32 && _bytes32[i] != 0) {
            i++;
        }
        bytes memory bytesArray = new bytes(i);
        for (i = 0; i < 32 && _bytes32[i] != 0; i++) {
            bytesArray[i] = _bytes32[i];
        }
        return string(bytesArray);
    }

}
library StringLibrary {

    // utility function to convert string to bytes32
    function stringToBytes32(string memory _string) internal pure returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(_string);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }
        assembly {
            result := mload(add(_string, 32))
        }
    }

}


interface IERC20 {
    function symbol() external view returns (string memory);
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
    function token0() external view returns (address);
    function token1() external view returns (address);
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;
}


interface IOrderBooks {
    function nextPrice(bytes32 _orderBookID, ITradePairs.Side _side, uint _price) external view returns (uint price);
    function getQuantitiesAtPrice(bytes32 _orderBookID, uint _price) external view returns (uint[] memory);
}
interface ITradePairs {
    struct Order {
        bytes32 id;
        uint price;
        uint totalAmount;
        uint quantity;
        uint quantityFilled;
        uint totalFee;
        address traderaddress;
        Side side;
        Type1 type1;
        Status status;
    }

    function getTradePairs() external view returns (bytes32[] memory);
    function getMinTradeAmount(bytes32 _tradePairId) external view returns (uint);
    function getMaxTradeAmount(bytes32 _tradePairId) external view returns (uint);
    function addOrder(bytes32 _tradePairId, uint _price, uint _quantity, Side _side, Type1 _type1) external;

    enum Side     {BUY, SELL}
    enum Type1    {MARKET, LIMIT, STOP, STOPLIMIT, LIMITFOK}
    enum Status   {NEW, REJECTED, PARTIAL, FILLED, CANCELED, EXPIRED, KILLED}
}

interface IPortfolio {
    function depositToken(address _from, bytes32 _symbol, uint _quantity) external;
    function withdrawToken(address _to, bytes32 _symbol, uint _quantity) external;
    function withdrawNative(address payable _to, uint _quantity) external;
    function getBalance(address _owner, bytes32 _symbol) external view returns (uint, uint, AssetType assetType);

    enum AssetType {NATIVE, ERC20, NONE}

}


/**
 * DEXALOT套利
 * The naming convention for the trade pairs is as follows: BASEASSET/QUOTEASSET.
 * For trade pair AVAX/USDT the order books are LOST/AVAX-BUYBOOK amd LOST/AVAX-SELLBOOK.
 * 最优币价：买 -> OrderBook.first 卖 OrderBook.last 获取币价对应的挂单量 OrderBook.getQuantitiesAtPrice
 */
contract DexalotA_AVAX_V3 {
    using SafeMath for uint256;
    using StringLibrary for string;
    using Bytes32Library for bytes32;

    IOrderBooks orderBooks;
    IPortfolio portfolio;
    ITradePairs tradePairs;
    address private immutable wavax = 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7;
    address private immutable _owner;

    struct Info {
        uint256 tokenAPrice;
        uint256 maxTokenAQuantity;
        uint256 maxTokenAInTokenB;
    }

    constructor() {
        orderBooks = IOrderBooks(0x3Ece76F7AdD934Fb8a35c9C371C4D545e299669A);
        portfolio = IPortfolio(0x6F8205cf222dD4C6615991C7F604F366526B5C6E);
        tradePairs = ITradePairs(0x1D34b421A5eDE3e300d3b8BCF3BE5c6f45971E20);
        _owner = msg.sender;
        IERC20(0x449674B82F05d498E126Dd6615a1057A9c088f2C).approve(address(portfolio), type(uint).max); // LOST
        IERC20(0x093783055F9047C2BfF99c4e414501F8A147bC69).approve(address(portfolio), type(uint).max); // ALOT
        IERC20(0x5a15Bdcf9a3A8e799fa4381E666466a516F2d9C8).approve(address(portfolio), type(uint).max); // SLIME
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
        (uint256 action, address tokenA, uint256 price, uint256 quantity, uint256 amountIn) = abi.decode(_data, (uint256, address, uint256, uint256, uint256));

        IERC20 iTokenA = IERC20(tokenA);
        string memory tokenASymbol = iTokenA.symbol();
        bytes32 tokenASymbolBytes32 = tokenASymbol.stringToBytes32();
        if(action == 0) {
            // Buy 赚 AVAX
            // 质押资产
            uint256 outAmount = _amount0 > 0 ? _amount0 : _amount1;
            IWETH(wavax).withdraw(outAmount);
            // 这里由于portfolio的receive方法有操作，不能使用transfer有2300gas的限制
            (bool success, ) = payable(address(portfolio)).call{value: amountIn}('');
            require(success, "transfer fail.");
            // 下单
            tradePairs.addOrder(string(abi.encodePacked(tokenASymbol, "/", "AVAX")).stringToBytes32(), price, quantity, ITradePairs.Side.BUY, ITradePairs.Type1.LIMIT);
          
            // 提取购买的TokenA
            (, uint256 availableTokenA, ) = portfolio.getBalance(address(this), tokenASymbolBytes32);
            // require(availableTokenA >= amountIn, "Sell Action: Cant Payback");
            portfolio.withdrawToken(address(this), tokenASymbolBytes32, availableTokenA);
            // 归还TokenA
            iTokenA.transfer(msg.sender, availableTokenA);
            // 盈利 = outAmount - amountIn (Avax)
        }
        if(action == 1) {
            // Sell 赚 AVAX
            // 质押资产
            uint256 outAmount = _amount0 > 0 ? _amount0 : _amount1;
            // depositToken中使用到transferFrom，确保合约层面此Token已提前Approve无限大
            portfolio.depositToken(address(this), tokenASymbolBytes32, outAmount);
            // 下单
            tradePairs.addOrder(string(abi.encodePacked(tokenASymbol, "/", "AVAX")).stringToBytes32(), price, quantity, ITradePairs.Side.SELL, ITradePairs.Type1.LIMIT);
            // 提取购买的AVAX
            (, uint256 availableAVAX, ) = portfolio.getBalance(address(this), string("AVAX").stringToBytes32());
            // require(availableAVAX >= amountIn, "Buy Action: Cant Payback");
            portfolio.withdrawNative(payable(this), availableAVAX);
             // 归还WAVAX
            IWETH(wavax).deposit{value: availableAVAX}();
            IWETH(wavax).transfer(msg.sender, amountIn);
            // 盈利 =  availableAVAX - amountIn
        }
    }

    function getBuyInfo(string calldata tokenASymbol, uint reserveA, uint reserveB) view external returns(Info memory info) {
        string memory tradePairId  = string(abi.encodePacked(tokenASymbol, "/", "AVAX"));
        bytes32 _sellBookId = string(abi.encodePacked(tradePairId, "-SELLBOOK")).stringToBytes32();
        // 计算交易量是否在合适范围内
        uint256 minTradeAmount = tradePairs.getMinTradeAmount(tradePairId.stringToBytes32());
        uint256 maxTradeAmount = tradePairs.getMaxTradeAmount(tradePairId.stringToBytes32());
       
        // uint262 minTradeAmount = ITradePair().getMinTradeAmount(tradePairId);
        while((info.maxTokenAQuantity * info.tokenAPrice) / 10**18 < minTradeAmount) {
            info.tokenAPrice = orderBooks.nextPrice(_sellBookId, ITradePairs.Side.SELL, info.tokenAPrice);
            uint256[] memory maxTokenABuyQuantities = orderBooks.getQuantitiesAtPrice(_sellBookId, info.tokenAPrice);
            uint256 tempQuantity;
            for(uint256 i = 0; i < maxTokenABuyQuantities.length; i++) {
                tempQuantity += maxTokenABuyQuantities[i];
            }

             // 计算利润最大的交易量
            (bool atob, uint amountIn) = computeProfitMaximizingTrade(10**18, info.tokenAPrice, reserveA, reserveB);
            require(atob && amountIn > 0, "computeProfitMaximizingTrade Failed");
            uint256 maxAmountAOut = amountIn;
            // DecimalOK处理
            maxAmountAOut = maxAmountAOut - (maxAmountAOut % 10**16);
            if((maxAmountAOut > info.maxTokenAQuantity)) {
                if((maxAmountAOut - info.maxTokenAQuantity) < tempQuantity) {
                    tempQuantity = maxAmountAOut - info.maxTokenAQuantity;
                }
            } else {
                tempQuantity = 0;
                revert("Revert No Profit");
            }

            uint256 curTradeAmount = ((info.maxTokenAQuantity + tempQuantity) * info.tokenAPrice) / 10**18;
         
            if(curTradeAmount > maxTradeAmount) {
                tempQuantity = (maxTradeAmount * 10**18 / info.tokenAPrice ) - info.maxTokenAQuantity;
                info.maxTokenAQuantity = maxTradeAmount * 10**18 / info.tokenAPrice ;
            } else {
                info.maxTokenAQuantity += tempQuantity;
            }
            info.maxTokenAInTokenB += tempQuantity.mul(info.tokenAPrice) / 10**18;
           
        }
    }

    function buyTokenA(address _pair, address tokenA, uint256 gasAmount, uint256 rate, uint tokenAPrice, uint maxTokenAQuantity, uint maxTokenAInTokenB) external onlyOwner{
        IUniswapV2Pair pair = IUniswapV2Pair(_pair);
        uint256 amount0Out;
        uint256 amount1Out;
        // Info memory info;
        {
        address token1 = pair.token1();
        // maxTokenABuyQuantity 需要扣除taker fee 0.20%，才是最后到账的金额
        uint256 maxAvaxOut = getAmountOutOfPair(pair, tokenA, token1, maxTokenAQuantity * rate / 10000);
        require(maxAvaxOut > maxTokenAInTokenB + gasAmount, "No Profit");
        // profit = maxTokenAOut - maxTokenAAmountIn + minProfit;
        (amount0Out, amount1Out) = token1 == tokenA ? (maxAvaxOut, uint256(0)) : (uint256(0), maxAvaxOut);
        }
        pair.swap(amount0Out, amount1Out, address(this), abi.encode(0, tokenA, tokenAPrice, maxTokenAQuantity, maxTokenAInTokenB));

        // 把avax转到owner
        payable(_owner).transfer(address(this).balance);
    }
    
    function getSellInfo(string calldata tokenASymbol, uint reserveA, uint reserveB) view external returns (Info memory info) {
        string memory tradePairId  = string(abi.encodePacked(tokenASymbol, "/", "AVAX"));
        bytes32 _buyBookId = string(abi.encodePacked(tradePairId, "-BUYBOOK")).stringToBytes32();

        uint256 minTradeAmount = tradePairs.getMinTradeAmount(tradePairId.stringToBytes32());
        uint256 maxTradeAmount = tradePairs.getMaxTradeAmount(tradePairId.stringToBytes32());

        while((info.maxTokenAQuantity * info.tokenAPrice) / 10**18 < minTradeAmount) {
            info.tokenAPrice = orderBooks.nextPrice(_buyBookId, ITradePairs.Side.BUY, info.tokenAPrice);
            uint256[] memory maxTokenASellQuantities = orderBooks.getQuantitiesAtPrice(_buyBookId, info.tokenAPrice);
            uint256 tempQuantity;
            for(uint256 i = 0; i < maxTokenASellQuantities.length; i++) {
                tempQuantity += maxTokenASellQuantities[i];
            }
           
            // 计算利润最大的交易量
            (bool atob, uint amountIn) = computeProfitMaximizingTrade(10**18, info.tokenAPrice, reserveA, reserveB);
            require(!atob && amountIn > 0, "computeProfitMaximizingTrade Failed");
            uint256 maxAmountAOut = getAmountOut(amountIn, reserveB, reserveA);
            // DecimalOK处理
            maxAmountAOut = maxAmountAOut - (maxAmountAOut % 10**16);
            if((maxAmountAOut > info.maxTokenAQuantity)) {
                if((maxAmountAOut - info.maxTokenAQuantity) < tempQuantity) {
                    tempQuantity = maxAmountAOut - info.maxTokenAQuantity;
                }
            } else {
                tempQuantity = 0;
                revert("Revert No Profit");
            }

            uint256 curTradeAmount = ((info.maxTokenAQuantity + tempQuantity) * info.tokenAPrice) / 10**18;
           
            if(curTradeAmount > maxTradeAmount) {
                tempQuantity = (maxTradeAmount * 10**18 / info.tokenAPrice ) - info.maxTokenAQuantity;
                info.maxTokenAQuantity = maxTradeAmount * 10**18 / info.tokenAPrice ;
            } else {
                info.maxTokenAQuantity += tempQuantity;
            }
            info.maxTokenAInTokenB += tempQuantity.mul(info.tokenAPrice) / 10**18;
           
        }
    }

    function sellTokenA(address _pair, address tokenA, uint256 gasAmount, uint256 rate, uint tokenAPrice, uint maxTokenAQuantity, uint maxTokenAInTokenB) external onlyOwner{
        IUniswapV2Pair pair = IUniswapV2Pair(_pair);
        uint256 amount0Out;
        uint256 amount1Out;
        uint256 maxTokenBAmountIn;
        {
        address token1 = pair.token1();
        // maxTokenAInTokenB 需要扣除taker fee 0.20%，才是最后到账的金额
        maxTokenAInTokenB = maxTokenAInTokenB * rate / 10000;
        maxTokenBAmountIn = getAmountInOfPair(pair, tokenA, token1, maxTokenAQuantity);
        require(maxTokenAInTokenB > maxTokenBAmountIn + gasAmount, "No Profit");
        (amount0Out, amount1Out) = token1 == tokenA ? (uint256(0), maxTokenAQuantity) : (maxTokenAQuantity, uint256(0));
        }
        pair.swap(amount0Out, amount1Out, address(this), abi.encode(1, tokenA, tokenAPrice, maxTokenAQuantity, maxTokenBAmountIn));
        IERC20(wavax).transfer(_owner, IERC20(wavax).balanceOf(address(this)));
    }

    function getAmountOutOfPair(IUniswapV2Pair pair, address tokenA, address token1, uint amountIn) internal view returns (uint amountOut) {
         (uint reserveIn, uint reserveOut, ) = pair.getReserves();
        (reserveIn, reserveOut) = token1 == tokenA ? (reserveOut, reserveIn) : (reserveIn, reserveOut);

        uint amountInWithFee = amountIn.mul(997);
        uint numerator = amountInWithFee.mul(reserveOut);
        uint denominator = reserveIn.mul(1000).add(amountInWithFee);
        amountOut = numerator / denominator;
    }
    
    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) internal pure returns (uint amountOut) {
        uint amountInWithFee = amountIn.mul(997);
        uint numerator = amountInWithFee.mul(reserveOut);
        uint denominator = reserveIn.mul(1000).add(amountInWithFee);
        amountOut = numerator / denominator;
    }

   
    function getAmountInOfPair(IUniswapV2Pair pair, address tokenA, address token1, uint amountOut) internal view returns (uint amountIn) {

        (uint reserveIn, uint reserveOut, ) = pair.getReserves();
        (reserveIn, reserveOut) = token1 == tokenA ? (reserveIn, reserveOut) : (reserveOut, reserveIn);

        uint numerator = reserveIn.mul(amountOut).mul(1000);
        uint denominator = reserveOut.sub(amountOut).mul(997);
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
                invariant.mul(1000),
                aToB ? truePriceTokenA : truePriceTokenB,
                (aToB ? truePriceTokenB : truePriceTokenA).mul(997)
            )
        );
        uint256 rightSide = (aToB ? reserveA.mul(1000) : reserveB.mul(1000)) / 997;

        if (leftSide < rightSide) return (false, 0);

        // compute the amount that must be sent to move the price to the profit-maximizing price
        amountIn = leftSide.sub(rightSide);
    }
}
