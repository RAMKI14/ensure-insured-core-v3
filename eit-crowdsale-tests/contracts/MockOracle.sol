// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/**
 * ⚠️ SECURITY WARNING ⚠️
 * THIS IS A MOCK CONTRACT FOR TESTING PURPOSES ONLY.
 * DO NOT DEPLOY TO MAINNET.
 * DO NOT USE FOR REAL VALUE.
 */

/**
 * @title Mock Chainlink Oracle
 * @author A Blocks Nexus Ltd (Testnet)
 * @notice Simulates a Chainlink Price Feed returning a fixed price of $2000/ETH.
 */

contract MockOracle is AggregatorV3Interface {
    
    // --- SAFETY LOCK ---
    constructor() {
        uint256 cid = block.chainid;
        require(
            cid == 31337 || cid == 11155111, 
            "SECURITY: Mocks allowed on Testnets (Local/Sepolia) ONLY"
        );
    }

    // --- MOCK DATA FUNCTIONS ---

    function decimals() external pure override returns (uint8) { 
        return 8; 
    }

    function description() external pure override returns (string memory) { 
        return "Mock Price Feed"; 
    }

    function version() external pure override returns (uint256) { 
        return 1; 
    }

    function getRoundData(uint80) external view override returns (uint80, int256, uint256, uint256, uint80) {
        // Returns Fixed Price: $2000 (8 decimals)
        return (1, 2000 * 10**8, block.timestamp, block.timestamp, 1);
    }

    function latestRoundData() external view override returns (uint80, int256, uint256, uint256, uint80) {
        // Returns Fixed Price: $2000 (8 decimals)
        // Uses block.timestamp to pass "Stale Data" checks
        return (1, 2000 * 10**8, block.timestamp, block.timestamp, 1);
    }
}