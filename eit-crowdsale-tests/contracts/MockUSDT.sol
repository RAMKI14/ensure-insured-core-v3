// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * ⚠️ SECURITY WARNING ⚠️
 * THIS IS A MOCK CONTRACT FOR TESTING PURPOSES ONLY.
 * DO NOT DEPLOY TO MAINNET.
 */
contract MockUSDT is ERC20 {
    
    // 1. We still initialize the ERC20 name and symbol here
    constructor() ERC20("Mock USDT", "USDT") {
        
        // 2. SAFETY LOCK: Allow ONLY Localhost (31337) or Sepolia (11155111)
        // This prevents you from accidentally deploying a Fake USDT to Polygon/Ethereum
        uint256 cid = block.chainid;
        require(
            cid == 31337 || cid == 11155111, 
            "SECURITY: Mocks allowed on Testnets (Local/Sepolia) ONLY"
        );
        
        // 3. Mint Initial Supply to Admin (1 Billion)
        _mint(msg.sender, 1_000_000_000 * 10**6); 
    }

    // 4. Force 6 Decimals (To match real USDT)
    function decimals() public view virtual override returns (uint8) { 
        return 6; 
    }

    // 5. Test Faucet
    function faucet() external { 
        _mint(msg.sender, 1000 * 10**6); 
    }
}