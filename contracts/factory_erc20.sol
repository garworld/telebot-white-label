// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./base_erc20.sol";

contract FactoryERC20 {
    event CREATED(address erc20Contract);

    constructor() {}

    function deployNewERC20Token(
        string calldata name_,
        string calldata symbol_,
        uint256 totalSupply_
    ) public {
        BaseERC20 t = new BaseERC20(
            msg.sender,
            name_,
            symbol_,
            totalSupply_
        );
        emit CREATED(address(t));
    }
}