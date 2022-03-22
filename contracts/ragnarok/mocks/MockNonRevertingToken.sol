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

    function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
        if (balanceOf(_msgSender()) < amount) {
            return false;
        }
        _transfer(_msgSender(), recipient, amount);
        return true;
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public virtual override returns (bool) {
        uint256 currentAllowance = allowance(sender, _msgSender());
        if (balanceOf(sender) < amount || currentAllowance < amount) {
            return false;
        }

        _transfer(sender, recipient, amount);
        unchecked {
            _approve(sender, _msgSender(), currentAllowance - amount);
        }

        return true;
    }
}
