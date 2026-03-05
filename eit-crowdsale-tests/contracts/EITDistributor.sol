// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title EITDistributor
 * @notice Admin-controlled Batch Sender for Referral/Staking Rewards.
 * @dev Protected by ReentrancyGuard and Owner Access Control.
 */
contract EITDistributor is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Safety: Prevent running out of gas
    uint256 public constant MAX_BATCH_SIZE = 200;

    event RewardsDistributed(address indexed token, uint256 totalAmount, uint256 recipientCount);
    event EmergencyWithdrawal(address indexed token, uint256 amount);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Batch send tokens from contract balance.
     * @param tokenAddress The EIT token address
     * @param recipients Array of wallets
     * @param amounts Array of amounts
     */
    function distribute(
        address tokenAddress, 
        address[] calldata recipients, 
        uint256[] calldata amounts
    ) external nonReentrant onlyOwner {
        require(recipients.length == amounts.length, "Length mismatch");
        require(recipients.length > 0, "No recipients");
        require(recipients.length <= MAX_BATCH_SIZE, "Batch too large (Max 200)");

        IERC20 token = IERC20(tokenAddress);
        uint256 totalNeeded = 0;

        // 1. Calculate Total & Verify Balance
        for (uint256 i = 0; i < amounts.length; i++) {
            totalNeeded += amounts[i];
        }
        require(token.balanceOf(address(this)) >= totalNeeded, "Insufficient Reward Balance");

        // 2. Loop and Send
        for (uint256 i = 0; i < recipients.length; i++) {
            if (amounts[i] > 0) {
                token.safeTransfer(recipients[i], amounts[i]);
            }
        }

        emit RewardsDistributed(tokenAddress, totalNeeded, recipients.length);
    }

    /**
     * @dev Emergency function to recover tokens if contract is deprecated.
     */
    function withdrawEmergency(address tokenAddress) external onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "Nothing to withdraw");
        
        token.safeTransfer(msg.sender, balance);
        emit EmergencyWithdrawal(tokenAddress, balance);
    }
}