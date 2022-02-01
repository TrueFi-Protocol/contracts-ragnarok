// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import {ILenderVerifier} from "./interfaces/ILenderVerifier.sol";
import {Manageable} from "./access/Manageable.sol";

contract Whitelist is Manageable, ILenderVerifier {
    mapping(address => bool) public isWhitelisted;

    constructor() Manageable(msg.sender) {}

    event WhitelistStatusChanged(address user, bool status);

    function isAllowed(
        address user,
        uint256,
        bytes memory
    ) external view returns (bool) {
        return isWhitelisted[user];
    }

    function setWhitelistStatus(address user, bool status) external onlyManager {
        isWhitelisted[user] = status;
        emit WhitelistStatusChanged(user, status);
    }
}
