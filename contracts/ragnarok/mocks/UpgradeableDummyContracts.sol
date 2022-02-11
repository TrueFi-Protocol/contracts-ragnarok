// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import {InitializableManageable} from "../access/InitializableManageable.sol";
import {Manageable} from "../access/Manageable.sol";

contract DummyV1 is InitializableManageable {
    uint256 public a;

    constructor() InitializableManageable(msg.sender) {}

    function initialize() external initializer {
        InitializableManageable.initialize(msg.sender);
    }

    function setA(uint256 _a) public {
        a = _a;
    }
}

contract DummyV2 is InitializableManageable {
    uint256 public a;
    address public b;

    constructor() InitializableManageable(msg.sender) {}

    function setA(uint256 _a) public {
        a = _a;
    }

    function setB(address _b) public {
        b = _b;
    }
}

contract DummyV3 is InitializableManageable {
    address public b;
    uint256 public a;

    constructor() InitializableManageable(msg.sender) {}

    function setA(uint256 _a) public {
        a = _a;
    }

    function setB(address _b) public {
        b = _b;
    }
}

contract DummyV4 is Manageable {
    uint256 public a;

    constructor() Manageable(msg.sender) {}

    function setA(uint256 _a) public {
        a = _a;
    }
}
