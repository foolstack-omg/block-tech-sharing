/**
 * Avax上Aave V2的清算合约(参考官网清算指引：https://docs.aave.com/developers/v/2.0/guides/liquidations)
 * 逻辑：计算Aave借贷用户的健康因子，对少于1的用户调用getLiquidationInfo获取清算信息，bonus奖励大于0的用户进行liquidate清算（另外需自行计算gas费）
 * liquidate将通过aave的flashloan进行闪电贷借入资金进入executeOperation回调帮助被清算用户还款，清算成功后把奖励兑换成借入的资金，闪电贷结束aave会自动从合约中回收借出的资金和利息
 * 代码完整可运行，但目前竞争者较多，对节点要求很高，很卷。
 * 仅供学习参考
 */

// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.7.0;
pragma experimental ABIEncoderV2;

library PercentageMath {
    uint256 constant PERCENTAGE_FACTOR = 1e4; //percentage plus two decimals
    uint256 constant HALF_PERCENT = PERCENTAGE_FACTOR / 2;

    /**
     * @dev Executes a percentage multiplication
     * @param value The value of which the percentage needs to be calculated
     * @param percentage The percentage of the value to be calculated
     * @return The percentage of value
     **/
    function percentMul(uint256 value, uint256 percentage)
        internal
        pure
        returns (uint256)
    {
        if (value == 0 || percentage == 0) {
            return 0;
        }

        require(
            value <= (type(uint256).max - HALF_PERCENT) / percentage,
            Errors.MATH_MULTIPLICATION_OVERFLOW
        );

        return (value * percentage + HALF_PERCENT) / PERCENTAGE_FACTOR;
    }

    /**
     * @dev Executes a percentage division
     * @param value The value of which the percentage needs to be calculated
     * @param percentage The percentage of the value to be calculated
     * @return The value divided the percentage
     **/
    function percentDiv(uint256 value, uint256 percentage)
        internal
        pure
        returns (uint256)
    {
        require(percentage != 0, Errors.MATH_DIVISION_BY_ZERO);
        uint256 halfPercentage = percentage / 2;

        require(
            value <= (type(uint256).max - halfPercentage) / PERCENTAGE_FACTOR,
            Errors.MATH_MULTIPLICATION_OVERFLOW
        );

        return (value * PERCENTAGE_FACTOR + halfPercentage) / percentage;
    }
}

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

library ReserveConfiguration {
    uint256 constant LTV_MASK =                   0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF0000; // prettier-ignore
    uint256 constant LIQUIDATION_THRESHOLD_MASK = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF0000FFFF; // prettier-ignore
    uint256 constant LIQUIDATION_BONUS_MASK =     0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF0000FFFFFFFF; // prettier-ignore
    uint256 constant DECIMALS_MASK =              0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00FFFFFFFFFFFF; // prettier-ignore
    uint256 constant ACTIVE_MASK =                0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFF; // prettier-ignore
    uint256 constant RESERVE_FACTOR_MASK =        0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF0000FFFFFFFFFFFFFFFF; // prettier-ignore

    /// @dev For the LTV, the start bit is 0 (up to 15), hence no bitshifting is needed
    uint256 constant LIQUIDATION_THRESHOLD_START_BIT_POSITION = 16;
    uint256 constant LIQUIDATION_BONUS_START_BIT_POSITION = 32;
    uint256 constant RESERVE_DECIMALS_START_BIT_POSITION = 48;
    uint256 constant RESERVE_FACTOR_START_BIT_POSITION = 64;

    function getLiquidationThreshold(
        DataTypes.ReserveConfigurationMap memory self
    ) internal pure returns (uint256) {
        return
            (self.data & ~LIQUIDATION_THRESHOLD_MASK) >>
            LIQUIDATION_THRESHOLD_START_BIT_POSITION;
    }

    function getLiquidationBonus(DataTypes.ReserveConfigurationMap memory self)
        internal
        pure
        returns (uint256)
    {
        return
            (self.data & ~LIQUIDATION_BONUS_MASK) >>
            LIQUIDATION_BONUS_START_BIT_POSITION;
    }

    function getDecimals(DataTypes.ReserveConfigurationMap memory self)
        internal
        pure
        returns (uint256)
    {
        return
            (self.data & ~DECIMALS_MASK) >> RESERVE_DECIMALS_START_BIT_POSITION;
    }

    function getActive(DataTypes.ReserveConfigurationMap memory self)
        internal
        pure
        returns (bool)
    {
        return (self.data & ~ACTIVE_MASK) != 0;
    }

    function getParams(DataTypes.ReserveConfigurationMap memory self)
        internal
        pure
        returns (
            uint256,
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        uint256 dataLocal = self.data;

        return (
            dataLocal & ~LTV_MASK,
            (dataLocal & ~LIQUIDATION_THRESHOLD_MASK) >>
                LIQUIDATION_THRESHOLD_START_BIT_POSITION,
            (dataLocal & ~LIQUIDATION_BONUS_MASK) >>
                LIQUIDATION_BONUS_START_BIT_POSITION,
            (dataLocal & ~DECIMALS_MASK) >> RESERVE_DECIMALS_START_BIT_POSITION,
            (dataLocal & ~RESERVE_FACTOR_MASK) >>
                RESERVE_FACTOR_START_BIT_POSITION
        );
    }
}

library GenericLogic {
    uint256 public constant HEALTH_FACTOR_LIQUIDATION_THRESHOLD = 1 ether;
}

library ValidationLogic {
    using ReserveConfiguration for DataTypes.ReserveConfigurationMap;
    using UserConfiguration for DataTypes.UserConfigurationMap;
    using SafeMath for uint256;

    function validateLiquidationCall(
        DataTypes.ReserveData memory collateralReserve,
        DataTypes.ReserveData memory principalReserve,
        DataTypes.UserConfigurationMap memory userConfig,
        uint256 userHealthFactor,
        uint256 userStableDebt,
        uint256 userVariableDebt
    ) internal pure returns (uint256, string memory) {
        if (
            !collateralReserve.configuration.getActive() ||
            !principalReserve.configuration.getActive()
        ) {
            return (
                uint256(Errors.CollateralManagerErrors.NO_ACTIVE_RESERVE),
                Errors.VL_NO_ACTIVE_RESERVE
            );
        }

        if (
            userHealthFactor >= GenericLogic.HEALTH_FACTOR_LIQUIDATION_THRESHOLD
        ) {
            return (
                uint256(
                    Errors.CollateralManagerErrors.HEALTH_FACTOR_ABOVE_THRESHOLD
                ),
                Errors.LPCM_HEALTH_FACTOR_NOT_BELOW_THRESHOLD
            );
        }

        bool isCollateralEnabled = collateralReserve
            .configuration
            .getLiquidationThreshold() >
            0 &&
            userConfig.isUsingAsCollateral(collateralReserve.id);

        //if collateral isn't enabled as collateral by user, it cannot be liquidated
        if (!isCollateralEnabled) {
            return (
                uint256(
                    Errors
                        .CollateralManagerErrors
                        .COLLATERAL_CANNOT_BE_LIQUIDATED
                ),
                Errors.LPCM_COLLATERAL_CANNOT_BE_LIQUIDATED
            );
        }

        if (userStableDebt == 0 && userVariableDebt == 0) {
            return (
                uint256(Errors.CollateralManagerErrors.CURRRENCY_NOT_BORROWED),
                Errors.LPCM_SPECIFIED_CURRENCY_NOT_BORROWED_BY_USER
            );
        }

        return (
            uint256(Errors.CollateralManagerErrors.NO_ERROR),
            Errors.LPCM_NO_ERRORS
        );
    }
}

library Errors {
    string public constant VL_NO_ACTIVE_RESERVE = "2"; // 'Action requires an active reserve'
    string public constant LPCM_HEALTH_FACTOR_NOT_BELOW_THRESHOLD = "42"; // 'Health factor is not below the threshold'
    string public constant LPCM_COLLATERAL_CANNOT_BE_LIQUIDATED = "43"; // 'The collateral chosen cannot be liquidated'
    string public constant LPCM_SPECIFIED_CURRENCY_NOT_BORROWED_BY_USER = "44"; // 'User did not borrow the specified currency'
    string public constant LPCM_NOT_ENOUGH_LIQUIDITY_TO_LIQUIDATE = "45"; // "There isn't enough liquidity available to liquidate"
    string public constant LPCM_NO_ERRORS = "46"; // 'No errors'
    string public constant MATH_MULTIPLICATION_OVERFLOW = "48";
    string public constant MATH_DIVISION_BY_ZERO = "50";

    enum CollateralManagerErrors {
        NO_ERROR,
        NO_COLLATERAL_AVAILABLE,
        COLLATERAL_CANNOT_BE_LIQUIDATED,
        CURRRENCY_NOT_BORROWED,
        HEALTH_FACTOR_ABOVE_THRESHOLD,
        NOT_ENOUGH_LIQUIDITY,
        NO_ACTIVE_RESERVE,
        HEALTH_FACTOR_LOWER_THAN_LIQUIDATION_THRESHOLD,
        INVALID_EQUAL_ASSETS_TO_SWAP,
        FROZEN_RESERVE
    }
}

library Helpers {
    /**
     * @dev Fetches the user current stable and variable debt balances
     * @param user The user address
     * @param reserve The reserve data object
     * @return The stable and variable debt balance
     **/
    function getUserCurrentDebt(
        address user,
        DataTypes.ReserveData memory reserve
    ) internal view returns (uint256, uint256) {
        return (
            IERC20(reserve.stableDebtTokenAddress).balanceOf(user),
            IERC20(reserve.variableDebtTokenAddress).balanceOf(user)
        );
    }
}

library WadRayMath {
    uint256 internal constant WAD = 1e18;
}

library DataTypes {
    // refer to the whitepaper, section 1.1 basic concepts for a formal description of these properties.
    struct ReserveData {
        //stores the reserve configuration
        ReserveConfigurationMap configuration;
        //the liquidity index. Expressed in ray
        uint128 liquidityIndex;
        //variable borrow index. Expressed in ray
        uint128 variableBorrowIndex;
        //the current supply rate. Expressed in ray
        uint128 currentLiquidityRate;
        //the current variable borrow rate. Expressed in ray
        uint128 currentVariableBorrowRate;
        //the current stable borrow rate. Expressed in ray
        uint128 currentStableBorrowRate;
        uint40 lastUpdateTimestamp;
        //tokens addresses
        address aTokenAddress;
        address stableDebtTokenAddress;
        address variableDebtTokenAddress;
        //address of the interest rate strategy
        address interestRateStrategyAddress;
        //the id of the reserve. Represents the position in the list of the active reserves
        uint8 id;
    }

    struct ReserveConfigurationMap {
        //bit 0-15: LTV
        //bit 16-31: Liq. threshold
        //bit 32-47: Liq. bonus
        //bit 48-55: Decimals
        //bit 56: Reserve is active
        //bit 57: reserve is frozen
        //bit 58: borrowing is enabled
        //bit 59: stable rate borrowing enabled
        //bit 60-63: reserved
        //bit 64-79: reserve factor
        uint256 data;
    }

    struct UserConfigurationMap {
        uint256 data;
    }

    enum InterestRateMode {
        NONE,
        STABLE,
        VARIABLE
    }
}
interface IWETH {
    function deposit() external payable;
    function transfer(address to, uint value) external returns (bool);
    function withdraw(uint) external;
}

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function balanceOf(address owner) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
}

interface IAToken is IERC20 {}

interface ILendingPoolAddressesProvider {
    function getLendingPool() external view returns (address);

    function getPriceOracle() external view returns (address);

    function getAddress(bytes32 id) external view returns (address);
}

interface ILendingPool {
    function liquidationCall(
        address collateralAsset,
        address debtAsset,
        address user,
        uint256 debtToCover,
        bool receiveAToken
    ) external;

    function flashLoan(
        address receiverAddress,
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata modes,
        address onBehalfOf,
        bytes calldata params,
        uint16 referralCode
    ) external;

    function getUserAccountData(address user)
        external
        view
        returns (
            uint256 totalCollateralETH,
            uint256 totalDebtETH,
            uint256 availableBorrowsETH,
            uint256 currentLiquidationThreshold,
            uint256 ltv,
            uint256 healthFactor
        );

    function getConfiguration(address asset)
        external
        view
        returns (DataTypes.ReserveConfigurationMap memory);

    function getUserConfiguration(address user)
        external
        view
        returns (DataTypes.UserConfigurationMap memory);

    function getReservesList() external view returns (address[] memory);

    function getReserveData(address asset)
        external
        view
        returns (DataTypes.ReserveData memory);
}

library UserConfiguration {
    function isUsingAsCollateral(
        DataTypes.UserConfigurationMap memory self,
        uint256 reserveIndex
    ) internal pure returns (bool) {
        require(reserveIndex < 128, "Errors.UL_INVALID_INDEX");
        return (self.data >> (reserveIndex * 2 + 1)) & 1 != 0;
    }

    function isBorrowing(
        DataTypes.UserConfigurationMap memory self,
        uint256 reserveIndex
    ) internal pure returns (bool) {
        require(reserveIndex < 128, "Errors.UL_INVALID_INDEX");
        return (self.data >> (reserveIndex * 2)) & 1 != 0;
    }
}

interface IPriceOracleGetter {
    function getAssetPrice(address asset) external view returns (uint256);
}

interface IUniswapV2Pair {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
}

contract AaveV2Liquidator{
    using ReserveConfiguration for DataTypes.ReserveConfigurationMap;
    using UserConfiguration for DataTypes.UserConfigurationMap;
    using SafeMath for uint256;
    using PercentageMath for uint256;

    address private immutable _owner;
    address private constant _lendingPoolAddressProvider = 0xb6A86025F0FE1862B372cb0ca18CE3EDe02A318f;
    address private constant _weth = 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7;
    address private constant _router = 0x60aE616a2155Ee3d9A68541Ba4544862310933d4;
    uint256 private constant LIQUIDATION_CLOSE_FACTOR_PERCENT = 5000;

    struct LiquidationCallLocalVars {
        uint256 userCollateralBalance;
        uint256 userStableDebt;
        uint256 userVariableDebt;
        uint256 maxLiquidatableDebt;
        uint256 actualDebtToLiquidate;
        uint256 liquidationRatio;
        uint256 maxAmountCollateralToLiquidate;
        uint256 userStableRate;
        uint256 maxCollateralToLiquidate;
        uint256 debtAmountNeeded;
        uint256 healthFactor;
        uint256 liquidatorPreviousATokenBalance;
        IAToken collateralAtoken;
        bool isCollateralEnabled;
        DataTypes.InterestRateMode borrowRateMode;
        uint256 errorCode;
        string errorMsg;
    }

    struct AvailableCollateralToLiquidateLocalVars {
        uint256 userCompoundedBorrowBalance;
        uint256 liquidationBonus;
        uint256 collateralPrice;
        uint256 debtAssetPrice;
        uint256 maxAmountCollateralToLiquidate;
        uint256 debtAssetDecimals;
        uint256 collateralDecimals;
    }

    struct CalcLiquidationBonusVars {
        address collateralAsset;
        address debtAsset;
        address user;
        uint256 debtToCover;
        bool receiveAToken;
        DataTypes.ReserveData collateralReserve;
        DataTypes.ReserveData debtReserve;
        DataTypes.UserConfigurationMap userConfig;
        address priceOracle;
        uint256 healthFactor;
    }

    constructor() {
        _owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == _owner, "only owner.");
        _;
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

    /**
     * 计算用户的清算信息
     */
    function getLiquidationInfo(address user)
        public
        view
        returns (
            address collateralAsset,
            address debtAsset,
            uint256 debtToCover,
            uint256 bonus
        )
    {
        address lendingPool = ILendingPoolAddressesProvider(
            _lendingPoolAddressProvider
        ).getLendingPool();
        address priceOracle = ILendingPoolAddressesProvider(
            _lendingPoolAddressProvider
        ).getPriceOracle();
        (, , , , , uint256 healthFactor) = ILendingPool(lendingPool)
            .getUserAccountData(user);
        address[] memory reservesList = ILendingPool(lendingPool)
            .getReservesList();
        DataTypes.UserConfigurationMap memory userConfiguration = ILendingPool(
            lendingPool
        ).getUserConfiguration(user);

        for (uint256 i; i < reservesList.length; i++) {
            for (uint256 j; j < reservesList.length; j++) {
                if (
                    UserConfiguration.isBorrowing(userConfiguration, i) &&
                    UserConfiguration.isUsingAsCollateral(userConfiguration, j)
                ) {
                    CalcLiquidationBonusVars memory vars;
                    vars.collateralAsset = reservesList[j];
                    vars.debtAsset = reservesList[i];
                    vars.user = user;
                    vars.debtToCover = type(uint256).max;
                    vars.receiveAToken = false;
                    vars.collateralReserve = ILendingPool(lendingPool)
                        .getReserveData(reservesList[j]);
                    vars.debtReserve = ILendingPool(lendingPool).getReserveData(
                        reservesList[i]
                    );
                    vars.userConfig = userConfiguration;
                    vars.priceOracle = priceOracle;
                    vars.healthFactor = healthFactor;
                    // 计算清算哪个组合利润最高
                    (
                        uint256 _errorCode,
                        ,
                        uint256 _bonus,
                        uint256 _debtToCover
                    ) = calcLiquidationBonus(vars);
                    if (
                        _errorCode ==
                        uint256(Errors.CollateralManagerErrors.NO_ERROR) &&
                        _bonus > bonus
                    ) {
                        bonus = _bonus;
                        collateralAsset = reservesList[j];
                        debtAsset = reservesList[i];
                        debtToCover = _debtToCover;
                    }
                }
            }
        }
    }

    function liquidate(
        address _collateralAsset,
        address _debtAsset,
        address _user,
        uint256 _debtToCover,
        uint256 _profit
    ) external onlyOwner{
        ILendingPoolAddressesProvider addressProvider = ILendingPoolAddressesProvider(
                _lendingPoolAddressProvider
            );

        ILendingPool lendingPool = ILendingPool(
            addressProvider.getLendingPool()
        );

        require(
            IERC20(_debtAsset).approve(address(lendingPool), type(uint256).max),
            "Approval error"
        );

        // flashLoan `_debtToCover` amount of `_debtAsset`
        address[] memory assets = new address[](1);
        assets[0] = _debtAsset;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = _debtToCover;
        uint256[] memory modes = new uint256[](1);
        modes[0] = 0;
        bytes memory params = abi.encode(_collateralAsset, _user);
        uint16 referralCode = 0;

        lendingPool.flashLoan(
            address(this),
            assets,
            amounts,
            modes,
            address(this),
            params,
            referralCode
        );
        // 计算wavax的量是否达到利润要求
        uint amountAvax = IERC20(_weth).balanceOf(address(this));
        require(amountAvax > _profit, "No Profit");
        // WAVAX转AVAX
        IWETH(_weth).withdraw(amountAvax);
    }

    struct LiqudationVars {
        address collateralAsset;
        address user;
        uint profit;
    }
    /**
     * 闪电贷回调
     */
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external returns (bool) {
        require(
            initiator == address(this),
            "flashloan executeOperation failed"
        );
        
        (address _collateralAsset, address _user) = abi.decode(
            params,
            (address, address)
        );
        uint owed = amounts[0].add(premiums[0]);
        //
        // This contract now has the funds requested.
        // Your logic goes here.
        //
        {
            ILendingPool(msg.sender).liquidationCall(
                _collateralAsset,
                assets[0],
                _user,
                amounts[0],
                false // 不接受AToken
            );
        }
        // At the end of your logic above, this contract owes
        // the flashloaned amounts + premiums.
        // Therefore ensure your contract has enough to repay
        // these amounts.
        {
            // 如质押资产不是WAVAX，全部换成WAVAX
            uint amountOfCollateral = IERC20(_collateralAsset).balanceOf(address(this));
            
            if (_collateralAsset != _weth) {
                // 把_collateralAsset兑换成wavax
                IUniswapV2Pair pair = IUniswapV2Pair(pairFor(_weth, _collateralAsset));
                IERC20(_collateralAsset).transfer(address(pair), amountOfCollateral);
                pair.swap(pair.token0() == _weth ? getAmountOut(address(pair), _collateralAsset, amountOfCollateral) : 0, pair.token1() == _weth ? getAmountOut(address(pair), _collateralAsset, amountOfCollateral) : 0, address(this), new bytes(0));
            }
        }
        {
            // 如借款资产不是WAVAX，把等量的WAVAX换成借款资产加手续费还款
            if(_weth != assets[0]) {
                IUniswapV2Pair pairToDebtAsset = IUniswapV2Pair(pairFor(_weth, assets[0]));
                 // wavax 兑换 amounts + premiums 的 _debtAsset
                IERC20(_weth).transfer(address(pairToDebtAsset), getAmountIn(address(pairToDebtAsset), _weth, owed));
                pairToDebtAsset.swap(pairToDebtAsset.token0() == _weth ? 0 : owed, pairToDebtAsset.token1() == _weth ? 0 : owed, address(this), new bytes(0));
                
            }
        }

        // Approve the LendingPool contract allowance to *pull* the owed amount
        IERC20(assets[0]).approve(msg.sender, owed);
        return true;
    }

    /**
     * 计算清算奖励
     */
    function calcLiquidationBonus(CalcLiquidationBonusVars memory calcVars)
        internal
        view
        returns (
            uint256,
            string memory,
            uint256,
            uint256
        )
    {
        uint256 bonus = 0;

        LiquidationCallLocalVars memory vars;
        vars.healthFactor = calcVars.healthFactor;
        (vars.userStableDebt, vars.userVariableDebt) = Helpers
            .getUserCurrentDebt(calcVars.user, calcVars.debtReserve);

        (vars.errorCode, vars.errorMsg) = ValidationLogic
            .validateLiquidationCall(
                calcVars.collateralReserve,
                calcVars.debtReserve,
                calcVars.userConfig,
                vars.healthFactor,
                vars.userStableDebt,
                vars.userVariableDebt
            );

        if (
            Errors.CollateralManagerErrors(vars.errorCode) !=
            Errors.CollateralManagerErrors.NO_ERROR
        ) {
            return (vars.errorCode, vars.errorMsg, bonus, 0);
        }

        vars.collateralAtoken = IAToken(
            calcVars.collateralReserve.aTokenAddress
        );

        vars.userCollateralBalance = vars.collateralAtoken.balanceOf(
            calcVars.user
        );

        vars.maxLiquidatableDebt = vars
            .userStableDebt
            .add(vars.userVariableDebt)
            .percentMul(LIQUIDATION_CLOSE_FACTOR_PERCENT);

        vars.actualDebtToLiquidate = calcVars.debtToCover >
            vars.maxLiquidatableDebt
            ? vars.maxLiquidatableDebt
            : calcVars.debtToCover;

        (
            vars.maxCollateralToLiquidate,
            vars.debtAmountNeeded,
            bonus
        ) = _calculateAvailableCollateralToLiquidate(
            calcVars.collateralReserve,
            calcVars.debtReserve,
            calcVars.collateralAsset,
            calcVars.debtAsset,
            vars.actualDebtToLiquidate,
            vars.userCollateralBalance,
            calcVars.priceOracle
        );

        if (!calcVars.receiveAToken) {
            uint256 currentAvailableCollateral = IERC20(
                calcVars.collateralAsset
            ).balanceOf(address(vars.collateralAtoken));
            if (currentAvailableCollateral < vars.maxCollateralToLiquidate) {
                return (
                    uint256(
                        Errors.CollateralManagerErrors.NOT_ENOUGH_LIQUIDITY
                    ),
                    Errors.LPCM_NOT_ENOUGH_LIQUIDITY_TO_LIQUIDATE,
                    bonus,
                    0
                );
            }
        }
        return (
            uint256(Errors.CollateralManagerErrors.NO_ERROR),
            Errors.LPCM_NO_ERRORS,
            bonus,
            vars.debtAmountNeeded
        );
    }

    /**
     * 计算可清算的抵押品数量
     */
    function _calculateAvailableCollateralToLiquidate(
        DataTypes.ReserveData memory collateralReserve,
        DataTypes.ReserveData memory debtReserve,
        address collateralAsset,
        address debtAsset,
        uint256 debtToCover,
        uint256 userCollateralBalance,
        address priceOracle
    )
        internal
        view
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        IPriceOracleGetter oracle = IPriceOracleGetter(priceOracle);

        AvailableCollateralToLiquidateLocalVars memory vars;

        vars.collateralPrice = oracle.getAssetPrice(collateralAsset);
        vars.debtAssetPrice = oracle.getAssetPrice(debtAsset);

        (
            ,
            ,
            vars.liquidationBonus,
            vars.collateralDecimals,

        ) = collateralReserve.configuration.getParams();
        vars.debtAssetDecimals = debtReserve.configuration.getDecimals();

        // This is the maximum possible amount of the selected collateral that can be liquidated, given the
        // max amount of liquidatable debt
        vars.maxAmountCollateralToLiquidate = vars
            .debtAssetPrice
            .mul(debtToCover)
            .mul(10**vars.collateralDecimals)
            .percentMul(vars.liquidationBonus)
            .div(vars.collateralPrice.mul(10**vars.debtAssetDecimals));
        {
            uint256 collateralAmount = 0;
            uint256 debtAmountNeeded = 0;
            if (vars.maxAmountCollateralToLiquidate > userCollateralBalance) {
                collateralAmount = userCollateralBalance;
                debtAmountNeeded = vars
                    .collateralPrice
                    .mul(collateralAmount)
                    .mul(10**vars.debtAssetDecimals)
                    .div(vars.debtAssetPrice.mul(10**vars.collateralDecimals))
                    .percentDiv(vars.liquidationBonus);
            } else {
                collateralAmount = vars.maxAmountCollateralToLiquidate;
                debtAmountNeeded = debtToCover;
            }
            // The maximum collateral bonus you can receive will be the collateral balance (2) multiplied by the liquidation bonus (1) multiplied by the collateral asset's price in ETH (3). Note that for assets such as USDC, the number of decimals are different from other assets
            uint256 bonus = collateralAmount
                .mul(vars.collateralPrice)
                .div(10**vars.collateralDecimals).sub(
                    debtAmountNeeded.mul(vars.debtAssetPrice).div(10**vars.debtAssetDecimals)
                );
            return (collateralAmount, debtAmountNeeded, bonus);
        }
    }

    function getAmountIn(address pair, address tokenIn, uint amountOut) internal view returns (uint amountIn) {

        IUniswapV2Pair iPair = IUniswapV2Pair(pair);
      
        (uint reserve0, uint reserve1,) = iPair.getReserves();
        (uint reserveA, uint reserveB) = (tokenIn == iPair.token0() ? (reserve0, reserve1) : (reserve1, reserve0));

        uint numerator = reserveA.mul(amountOut).mul(1000);
        uint denominator = reserveB.sub(amountOut).mul(997);
        amountIn = (numerator / denominator).add(1);
    }
    
    function getAmountOut(address pair, address tokenIn, uint amountIn) internal view returns (uint amountOut) {
        IUniswapV2Pair iPair = IUniswapV2Pair(pair);
      
        (uint reserve0, uint reserve1,) = iPair.getReserves();
        (uint reserveA, uint reserveB) = (tokenIn == iPair.token0() ? (reserve0, reserve1) : (reserve1, reserve0));

        uint amountInWithFee = amountIn * 997;
        uint numerator = amountInWithFee * reserveB;
        uint denominator = reserveA * 10000 + amountInWithFee;
        amountOut = numerator / denominator;
    }

    function pairFor(
        address tokenA,
        address tokenB
    ) internal pure returns (address pair) {
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        pair = address(
            uint160(uint256(
                keccak256(
                    abi.encodePacked(
                        hex"ff",
                        0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10, // factory
                        keccak256(abi.encodePacked(token0, token1)),
                        hex"0bbca9af0511ad1a1da383135cf3a8d2ac620e549ef9f6ae3a4c33c2fed0af91"
                    )
                )
            ))
        );
    }
    
}
