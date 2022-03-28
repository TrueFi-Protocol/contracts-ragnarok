// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import {ManagedPortfolio} from "../ManagedPortfolio.sol";

contract ManagedPortfolioHarness is ManagedPortfolio {
    function singleToken() external view returns (uint256) {
        return 10**decimals();
    }
}
