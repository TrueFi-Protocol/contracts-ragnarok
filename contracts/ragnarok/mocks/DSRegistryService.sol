// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import {DSRegistryServiceInterface} from "../interfaces/DSRegistryServiceInterface.sol";

contract DSRegistryService is DSRegistryServiceInterface {
    mapping(address => bool) public isWhitelisted;

    function setWhitelistStatus(address user, bool status) external {
        isWhitelisted[user] = status;
    }

    function getInvestor(address _address) external view returns (string memory) {
        if (isWhitelisted[_address]) {
            return "valid_investor_id";
        }
        return "invalid_investor_id";
    }

    function isInvestor(string memory _id) external pure returns (bool) {
        return _compareStrings(_id, "valid_investor_id");
    }

    function _compareStrings(string memory a, string memory b) private pure returns (bool) {
        return keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b)));
    }
}
