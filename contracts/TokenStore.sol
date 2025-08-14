// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IGameToken {
    function mint(address to, uint256 amount) external;
}

contract TokenStore is ReentrancyGuard {
    IERC20 public usdt;
    IGameToken public gameToken;
    uint256 public gtPerUsdt;
    address public owner;

    event Purchase(address indexed buyer, uint256 usdtAmount, uint256 gtOut);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _usdt, address _gameToken, uint256 _gtPerUsdt) {
        require(_usdt != address(0) && _gameToken != address(0), "Zero address");
        owner = msg.sender;
        usdt = IERC20(_usdt);
        gameToken = IGameToken(_gameToken);
        gtPerUsdt = _gtPerUsdt;
    }

    function buy(uint256 usdtAmount) external nonReentrant {
        require(usdtAmount > 0, "Amount zero");
        require(usdt.allowance(msg.sender, address(this)) >= usdtAmount, "Approve USDT first");

        bool succ = usdt.transferFrom(msg.sender, address(this), usdtAmount);
        require(succ, "USDT transfer failed");

        uint256 gtOut = (usdtAmount * gtPerUsdt) / 1e6;
        gameToken.mint(msg.sender, gtOut);
        emit Purchase(msg.sender, usdtAmount, gtOut);
    }

    function withdrawUSDT(address to, uint256 amount) external onlyOwner nonReentrant {
        require(usdt.transfer(to, amount), "Withdraw failed");
    }
}