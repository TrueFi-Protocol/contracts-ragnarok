// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {Manageable} from "./Manageable.sol";

abstract contract InitializableManageable is UUPSUpgradeable, Manageable, Initializable {
    constructor(address _manager) Manageable(_manager) initializer {}

    function initialize(address _manager) internal initializer {
        _setManager(_manager);
    }

    function _authorizeUpgrade(address) internal override onlyManager {}
}
