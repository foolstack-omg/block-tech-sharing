// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.7.0;
interface IWETH {
    function deposit() external payable;
    function withdraw(uint) external;
}
interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function balanceOf(address owner) external view returns (uint);
}

contract NewContract {
    address constant wavax = 0xd00ae08403B9bbb9124bB305C09058E32C39A48c;
    constructor() payable {
        
    }

    function exploit() external {
        IWETH(wavax).deposit{value: address(this).balance / 2}();
        IERC20(wavax).transfer(tx.origin, IERC20(wavax).balanceOf(address(this)));
        selfdestruct(payable(tx.origin));
    }
}

/**
 * 网络: AVAX-C TestNet
 * 一个Tx中实现子合约的创建与合约中进行业务处理后完成销毁的示例
 */
contract CreateNDestruct {
    address constant wavax = 0xd00ae08403B9bbb9124bB305C09058E32C39A48c;
    constructor() payable {
        uint256 remain = msg.value;
        /**
         * 由于这个时候合约还没创建完成, 不能使用address(this), 也就无法使用address(this).balance等地址方法
         */
        for(uint256 i = 0; i < 5; i++) {
            NewContract c = new NewContract{value: msg.value / 10}();
            c.exploit();
            remain -=  msg.value / 10;
        }
        IWETH(wavax).deposit{value: remain}();
        IERC20(wavax).transfer(msg.sender, remain);
        selfdestruct(payable(msg.sender));
    }
}