// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    constructor() ERC20("MockToken", "MT") {}

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    function singleToken() external view returns (uint256) {
        return 10**decimals();
    }

    function mint(address receiver, uint256 amount) external {
        _mint(receiver, amount);
    }
}
