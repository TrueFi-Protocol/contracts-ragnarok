// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IFinancialInstrument is IERC721 {
    function principal(uint256 instrumentId) external view returns (uint256);

    function underlyingToken(uint256 instrumentId) external view returns (IERC20);

    function recipient(uint256 instrumentId) external view returns (address);
}
