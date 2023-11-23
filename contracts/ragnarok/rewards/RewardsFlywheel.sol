// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

abstract contract RewardsFlywheel {
    using SafeCast for uint256;
    using SafeERC20 for IERC20;

    struct RewardsState {
        uint224 index;
        uint32 block;
    }

    uint256 private constant REWARDS_PRECISION_SCALAR = 1e36;

    uint256 public rewardsRatePerBlock;

    RewardsState public rewardsState;

    address public rewardsToken;
    address public rewardsTreasury;

    mapping(address => uint256) public accountRewardsIndex;
    mapping(address => uint256) public accountRewardsAccruement;

    event DistributedRewards(address indexed account, uint256 amount);
    event ClaimedRewards(address indexed account, uint256 amount);

    event RewardsRateChanged(uint256 rewardsRatePerBlock);
    event RewardsTokenChanged(address token);
    event RewardsTreasuryChanged(address treasuryAddress);

    function claimRewards() external {
        RewardsFlywheel(this).claimRewardsFor(msg.sender);
    }

    function claimRewardsFor(address account) external {
        address[] memory accounts = new address[](1);
        accounts[0] = account;

        RewardsFlywheel(this).claimRewardsFor(accounts);
    }

    function claimRewardsFor(address[] calldata accounts) external {
        // Update the flywheel
        updateRewardsFlywheel();
        
        // Distribute rewards for all accounts
        for (uint256 i = 0; i < accounts.length; ++i)
            distributeRewardsFor(accounts[i]);

        // Claim rewards for all accounts
        for (uint256 i = 0; i < accounts.length; ++i) {
            // Get the amount of rewards accrued for the account
            uint256 accrued = accountRewardsAccruement[accounts[i]];

            // Set the amount of rewards accrued for the account to 0 to prevent re-entrancy attacks
            accountRewardsAccruement[accounts[i]] = 0;

            uint256 claimed = processRewardsClaim(accounts[i], accrued);

            if (claimed < accrued) {
                // We didn't have enough to transfer all accrued rewards for the account, so we store the difference
                accountRewardsAccruement[accounts[i]] = accrued - claimed;
            }
        }
    }

    function initializeRewards() internal {
        if (rewardsState.index == 0) {
            // Rewards state uninitialized, so we initialize it
            rewardsState.index = 1;
            rewardsState.block = block.number.toUint32();
        }
    }

    function setRewardsToken(address token) internal {
        if (token != rewardsToken) {
            rewardsToken = token;

            emit RewardsTokenChanged(token);
        }
    }

    function setRewardsTreasury(address treasuryAddress) internal {
        if (treasuryAddress != rewardsTreasury) {
            rewardsTreasury = treasuryAddress;

            emit RewardsTreasuryChanged(treasuryAddress);
        }
    }

    function setRewardsRate(uint256 rewardsRate) internal {
        if (rewardsRate != rewardsRatePerBlock) {
            // Reward rate updated so let's update the flywheel to ensure that
            //  1. Rewards accrued properly for the old rate, and
            //  2. Rewards accrued at the new rate starts after this block.
            updateRewardsFlywheel();

            // Update rewards rate and emit event
            rewardsRatePerBlock = rewardsRate;
            emit RewardsRateChanged(rewardsRate);
        }
    }

    function updateRewardsFlywheel() internal {
        RewardsState storage state = rewardsState;
        uint256 rewardsRate = rewardsRatePerBlock;

        // Calculate change in blocks since last update
        uint256 deltaBlocks = block.number - state.block;

        if (deltaBlocks > 0 && rewardsRate > 0) {
            // Rewards are being distributed, so update
            uint256 tShares = totalRewardShares();
            if (tShares > 0) {
                uint256 rewardsAccrued = deltaBlocks * rewardsRate;

                uint256 accruedPerShare = (rewardsAccrued * REWARDS_PRECISION_SCALAR) / tShares;

                state.index = (state.index + accruedPerShare).toUint224();
                state.block = block.number.toUint32();
            } else
                state.block = block.number.toUint32();
        } else if (deltaBlocks > 0) {
            // Record block number of latest update
            state.block = block.number.toUint32();
        }
    }

    function distributeRewardsFor(address account) internal {
        RewardsState storage state = rewardsState;

        uint256 stateIndex = state.index;
        uint256 accIndex = accountRewardsIndex[account];

        // Update account's index to the current index since we are distributing accrued rewards
        accountRewardsIndex[account] = stateIndex;

        if (accIndex == 0) {
            // No rewards accrued
            return;
        }

        // Calculate change in the cumulative sum of the rewards per share accrued
        uint256 accruedPerShare = stateIndex - accIndex;
        if (accruedPerShare > 0) {
            uint256 accountShares = rewardSharesFor(account);

            if (accountShares > 0) {
                // Calculate rewards accrued for the account
                uint256 rewardsAccrued = (accountShares * accruedPerShare) / REWARDS_PRECISION_SCALAR;

                // Add the accruement for the account
                accountRewardsAccruement[account] += rewardsAccrued;

                emit DistributedRewards(account, rewardsAccrued);
            }
        }
    }

    function totalRewardShares() internal view virtual returns (uint256);

    function rewardSharesFor(address account) internal view virtual returns (uint256);

    function processRewardsClaim(address account, uint256 amount) private returns(uint256) {
        // Don't do anything if we're trying to claim nothing
        if (amount == 0)
            return 0;

        address from = rewardsTreasury;
        if (from == address(0)) {
            // Zero address is an alias for this contract's address
            from = address(this);
        }

        IERC20 token = IERC20(rewardsToken);
        uint256 amountRemaining = token.balanceOf(from);
        
        // If the amount to be claimed is more than the remaining, we try to claim what's left
        if (amount > amountRemaining)
            amount = amountRemaining;

        if (amount > 0) {
            // We have tokens to send, so transfer them
            token.safeTransferFrom(from, account, amount);

            // Note: We could verify that the treasury's balance change matches the amount, but we don't for gas
            // savings. We assume the rewards token doesn't do anything weird with transfers.

            emit ClaimedRewards(account, amount);
        }

        return amount;
    }

    uint256[45] private __gap;
}
