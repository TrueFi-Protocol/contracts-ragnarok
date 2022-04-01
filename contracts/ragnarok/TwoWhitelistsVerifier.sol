// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import {ILenderVerifier} from "./interfaces/ILenderVerifier.sol";
import {DSRegistryServiceInterface} from "./interfaces/DSRegistryServiceInterface.sol";
import {GlobalWhitelistLenderVerifier} from "./GlobalWhitelistLenderVerifier.sol";

contract TwoWhitelistsVerifier is ILenderVerifier {
    DSRegistryServiceInterface public registryService;
    GlobalWhitelistLenderVerifier public globalWhitelistService;

    constructor(DSRegistryServiceInterface _registryService, GlobalWhitelistLenderVerifier _globalWhitelistService) {
        registryService = _registryService;
        globalWhitelistService = _globalWhitelistService;
    }

    function isAllowed(
        address lender,
        uint256 amount,
        bytes memory signature
    ) external view returns (bool) {
        return
            registryService.isInvestor(registryService.getInvestor(lender)) ||
            globalWhitelistService.isAllowed(lender, amount, signature);
    }
}
