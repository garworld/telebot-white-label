// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BaseITOERC20 is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    IERC20 public baseToken;
    IERC20 public token;
    IERC20 public specialToken;
    bool isAutoList;
    bool public isWhitelist;
    uint256 public presaleRate;
    uint256 public softCap;
    uint256 public hardCap;
    uint256 public minBuy;
    uint256 public maxBuy;
    RefundType public refundType;
    uint256 public specialThreshold;
    uint256 public startTime;
    uint256 public endTime;
    uint256 public specialStartTime;
    uint256 public alreadyRaised;
    uint256 public alreadyClaimed;

    mapping(address => UserInfo) public usersTokenBought;
    mapping(address => bool) public whitelisted;

    struct UserInfo {
        uint256 totalToken;
        uint256 totalSpent;
        uint256 totalSpecialSpent;
    }

    enum RefundType {
        Burn,
        Refund
    }

    struct DataERC20 {
        address baseToken;
        address token;
        address specialToken;
        bool isAutoList;
        bool isWhitelist;
        uint256 presaleRate;
        uint256 softCap;
        uint256 hardCap;
        uint256 minBuy;
        uint256 maxBuy;
        RefundType refundType;
        uint256 specialThreshold;
    }

    modifier onlyActiveWhitelist() {
        require(isWhitelist, "Whitelist system not active");
        _;
    }

    modifier withdrawCheck() {
        require(getHardFilled() || (block.timestamp > endTime && getSoftFilled()), "Can't withdraw");
        _;
    }

    constructor(
        address owner_,
        DataERC20 memory data
    ) Ownable(owner_) {
        require(data.hardCap.mul(25).div(100) < data.softCap && data.hardCap > data.softCap, "Hardcap must greater than softcap 25%");
        baseToken = IERC20(data.baseToken);
        token = IERC20(data.token);
        if (data.specialToken != address(0)) specialToken = IERC20(data.specialToken);
        isAutoList = data.isAutoList;
        isWhitelist = data.isWhitelist;
        presaleRate = data.presaleRate;
        softCap = data.softCap;
        hardCap = data.hardCap;
        minBuy = data.minBuy;
        maxBuy = data.maxBuy;
        refundType = data.refundType;
        specialThreshold = data.specialThreshold;
    }

    function setWhiteList(address whitelisted_)
        public
        onlyOwner
        onlyActiveWhitelist
    {
        require(!whitelisted[whitelisted_], "Already whitelisted");
        whitelisted[whitelisted_] = true;
    }

    function deleteWhiteList(address whitelisted_)
        public
        onlyOwner
        onlyActiveWhitelist
    {
        require(whitelisted[whitelisted_], "Not whitelisted");
        whitelisted[whitelisted_] = false;
    }

    function setRaised(
        uint256 startTime_, uint256 endTime_, uint256 specialStartTime_
    ) public onlyOwner nonReentrant {
        require(startTime_ != 0, "Must set correct time");
        require(specialStartTime_ < startTime_, "Raising has started");
        require(startTime_ > block.timestamp, "Must not yet started");
        require(endTime_ > startTime_, "End time must be greater than start");
        startTime = startTime_;
        endTime = endTime_;
        specialStartTime = specialStartTime_;
        uint256 totalTokenSale_ = hardCap.mul(presaleRate);
        uint256 allowance = token.allowance(msg.sender, address(this));
        uint256 balance = token.balanceOf(msg.sender);
        require(allowance >= totalTokenSale_, "Check the token allowance");
        require(balance >= totalTokenSale_, "Not enough tokens");

        token.transferFrom(msg.sender, address(this), totalTokenSale_);
    }

    function getHardFilled() public view returns (bool) {
        return alreadyRaised >= hardCap;
    }

    function getSoftFilled() public view returns (bool) {
        return alreadyRaised >= softCap;
    }

    function getSellTokenAmount(uint256 amount_)
        internal
        view
        returns (uint256)
    {
        return amount_.mul(presaleRate);
    }

    function buy(uint256 amount) external nonReentrant {
        if (isWhitelist) {
            require(whitelisted[msg.sender] || (specialToken != IERC20(address(0)) && specialToken.balanceOf(msg.sender) > specialThreshold), "Not whitelisted");
        }
        require(block.timestamp != 0, "Raising period not set");
        require(block.timestamp >= startTime, "Raising period not started yet");
        require(block.timestamp < endTime, "Raising period already end");
        require(amount > 0, "Please input value");
        require(getHardFilled() == false, "Raise already fullfilled");

        UserInfo memory userInfo = usersTokenBought[msg.sender];

        require(userInfo.totalSpent.add(amount) >= minBuy, "Less than min buy");
        require(userInfo.totalSpent.add(amount) <= maxBuy, "More than max buy");
        require(
            amount + alreadyRaised <= hardCap,
            "Amount buy more than total hardcap"
        );

        baseToken.approve(address(this), amount);
        baseToken.transferFrom(msg.sender, address(this), amount);
        uint256 tokenSellAmount = getSellTokenAmount(amount);
        userInfo.totalToken = userInfo.totalToken.add(tokenSellAmount);
        userInfo.totalSpent = userInfo.totalSpent.add(amount);
        usersTokenBought[msg.sender] = userInfo;

        alreadyRaised = alreadyRaised.add(amount);
    }

    function claimFailed() external nonReentrant {
        require(block.timestamp > endTime, "Raising not end");
        require(getSoftFilled() == false, "Soft cap already fullfiled");

        uint256 userSpent = usersTokenBought[msg.sender].totalSpent;
        uint256 userSpecialSpent = usersTokenBought[msg.sender].totalSpecialSpent;
        require(userSpent > 0, "Already claimed");

        baseToken.transfer(msg.sender, userSpent.add(userSpecialSpent));

        delete usersTokenBought[msg.sender];
    }

    function claimSuccess()
        external nonReentrant
    {
        if (!getHardFilled()) {
            require(block.timestamp > endTime, "Raising not end");
            require(getSoftFilled(), "Soft cap not fullfiled");
        }      
        UserInfo storage userInfo = usersTokenBought[msg.sender];
        require(userInfo.totalToken > 0, "You can't claim any amount");

        usersTokenBought[msg.sender] = userInfo;
        token.transfer(msg.sender, userInfo.totalToken);
        alreadyClaimed = alreadyClaimed.add(userInfo.totalToken);

        delete usersTokenBought[msg.sender];
    }

    function specialBuy(uint256 amount) external nonReentrant {
        require((specialToken != IERC20(address(0)) && specialToken.balanceOf(msg.sender) > specialThreshold), "Not whitelisted");
        require(specialStartTime != 0, "Raising special period not set");
        require(block.timestamp < startTime, "Special period has ended");
        require(amount > 0, "Please input value");
        require(getHardFilled() == false, "Raise already fullfilled");

        UserInfo memory userInfo = usersTokenBought[msg.sender];

        require(userInfo.totalSpecialSpent.add(amount) >= minBuy.sub(specialThreshold), "Less than min buy");
        require(userInfo.totalSpecialSpent.add(amount) <= maxBuy.add(specialThreshold), "More than max buy");
        require(
            amount + alreadyRaised <= hardCap,
            "Amount buy more than total hardcap"
        );

        baseToken.approve(address(this), amount);
        baseToken.transferFrom(msg.sender, address(this), amount);
        uint256 tokenSellAmount = getSellTokenAmount(amount);
        userInfo.totalToken = userInfo.totalToken.add(tokenSellAmount);
        userInfo.totalSpecialSpent = userInfo.totalSpecialSpent.add(amount);
        usersTokenBought[msg.sender] = userInfo;

        alreadyRaised = alreadyRaised.add(amount);
    }

    function endProcess() public onlyOwner nonReentrant {
        require(alreadyClaimed == alreadyRaised.mul(presaleRate), "Claim not end");
        if (refundType == RefundType.Burn) {
            token.transfer(address(0), hardCap.mul(presaleRate).sub(alreadyClaimed));
            alreadyClaimed = 0;
        } 
        if (refundType == RefundType.Refund) {
            token.transfer(owner(), hardCap.mul(presaleRate).sub(alreadyClaimed));
            alreadyClaimed = 0;
        } 
    }

    function withdrawRaised() public onlyOwner withdrawCheck {
        uint256 balance = baseToken.balanceOf(address(this));
        require(balance > 0, "Does not have any balance");
        baseToken.transfer(msg.sender, balance);
    }

}