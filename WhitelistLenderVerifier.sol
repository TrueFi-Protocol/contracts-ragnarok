// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import {ILenderVerifier} from "./interfaces/ILenderVerifier.sol";
import {IManageable} from "./access/interfaces/IManageable.sol";

contract WhitelistLenderVerifier is ILenderVerifier {
    mapping(IManageable => mapping(address => bool)) public isWhitelisted;

    event WhitelistStatusChanged(IManageable portfolio, address lender, bool status);

    function isAllowed(
        address lender,
        uint256,
        bytes memory
    ) external view returns (bool) {
        return isWhitelisted[IManageable(msg.sender)][lender];
    }

    function setLenderWhitelistStatus(
        IManageable portfolio,
        address lender,
        bool status
    ) external {
        require(msg.sender == portfolio.manager(), "WhitelistLenderVerifier: Only portfolio manager can modify whitelist");
        isWhitelisted[portfolio][lender] = status;
        emit WhitelistStatusChanged(portfolio, lender, status);
    }
}
