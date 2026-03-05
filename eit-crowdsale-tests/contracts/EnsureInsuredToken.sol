// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol"; // <--- Audit: Permit is here

/**
 * @title Ensure Insured Token (EIT)
 * @author A Blocks Nexus Ltd
 * @notice Fixed Supply 50B. No Minting capability after deployment.
 */
contract EnsureInsuredToken is ERC20, ERC20Burnable, ERC20Pausable, AccessControl, ERC20Permit {
    
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Audit Fix: Explicitly define MAX_SUPPLY for verification tools
    uint256 public constant MAX_SUPPLY = 50_000_000_000 * 10**18;

    constructor(address defaultAdmin, address pauser)
        ERC20("Ensure Insured Token", "EIT")
        ERC20Permit("Ensure Insured Token")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, pauser);

        // Mint Full Supply ONCE. No function exists to mint again.
        _mint(defaultAdmin, MAX_SUPPLY);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // Required overrides
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
    {
        super._update(from, to, value);
    }
}