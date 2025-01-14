// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./base_ito_erc20.sol";

contract FactoryITOERC20 {
    event ITOCREATED(address ito);

    struct DataCommon {
        address specialToken;
        bool isAutoList;
        bool isWhitelist;
        uint256 presaleRate;
        uint256 softCap;
        uint256 hardCap;
        uint256 minBuy;
        uint256 maxBuy;
        uint256 specialThreshold;
    }

    constructor() {}
    
    function createERC20ITO(address baseToken, address token, DataCommon calldata data, BaseITOERC20.RefundType refundType) public {
        BaseITOERC20.DataERC20 memory inputData;
        inputData.baseToken = baseToken;
        inputData.token = token;
        inputData.specialToken = data.specialToken;
        inputData.isAutoList = data.isAutoList;
        inputData.isWhitelist = data.isWhitelist;
        inputData.presaleRate = data.presaleRate;
        inputData.softCap = data.softCap;
        inputData.hardCap = data.hardCap;
        inputData.minBuy = data.minBuy;
        inputData.maxBuy = data.maxBuy;
        inputData.specialThreshold = data.specialThreshold;
        inputData.refundType = refundType;
        BaseITOERC20 itoContract_ = new BaseITOERC20(msg.sender, inputData);
        emit ITOCREATED(address(itoContract_));
    }
}