// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7;


interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function balanceOf(address owner) external view returns (uint256);
    function transferFrom(address _from, address _to, uint256 _value) external returns (bool success);
}

contract Wallet {
    address private immutable _owner;
    mapping (address => bool) private authorizations;

    constructor() {
        _owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == _owner, "only owner");
        _;
    }
    modifier onlyAuthorized() {
        require(authorizations[msg.sender], "only authorized");
        _;
    }

    receive() external payable {}

    function authrozie(address target, bool b) public onlyOwner{
        authorizations[target] = b;
    }

    function get(address ierc20, uint256 amount) public onlyAuthorized {
        IERC20(ierc20).transferFrom(_owner, msg.sender, amount);
    }

    function payback(address ierc20, uint256 amount) public onlyAuthorized {
        IERC20(ierc20).transferFrom(msg.sender, _owner, amount);
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
            bool success;
            (success, ) = payable(_owner).call{value: balance}("");
            require(success, "Call failed");
        }
    }


    
}
