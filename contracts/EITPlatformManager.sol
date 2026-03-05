// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

using SafeERC20 for IERC20;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IBurnable {
    function burnFrom(address account, uint256 amount) external;
}

/**
 * @title EITPlatformManager (Tier-1 Enterprise V1.3)
 * @author A Blocks Nexus Ltd
 * @notice Operational engine for the 'Burn & Recycle' model. 
 *         Includes Daily Limits, Event Forensics, and Emergency Pause.
 */
contract EITPlatformManager is AccessControl, Pausable {
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    IERC20 public immutable token;
    address public recycleTreasury;

    // --- SAFETY CONTROLS ---
    uint256 public maxDailyLimit;       
    uint256 public currentDayProcessed; 
    uint256 public lastResetTime;       
    
    // Minimum limit to prevent accidental freezing (e.g. 100 EIT)
    uint256 private constant MIN_DAILY_LIMIT = 100 * 1e18;

    // --- EVENTS ---
    event BatchProcessed(
        string indexed regionCode, 
        string batchRef,           
        uint256 totalEITConsumed,  
        uint256 burnedAmount,      
        uint256 recycledAmount     
    );
    
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury, address indexed admin);
    event DailyLimitUpdated(uint256 oldLimit, uint256 newLimit, address indexed admin);

    constructor(address _token, address _recycleTreasury, address _admin) {
        // Fix #3: Constructor Sanity
        require(_token != address(0), "Invalid Token");
        require(_recycleTreasury != address(0), "Invalid Treasury");
        require(_admin != address(0), "Invalid Admin");
        
        token = IERC20(_token);
        recycleTreasury = _recycleTreasury;
        
        // Default Limit: 1 Million EIT per day
        maxDailyLimit = 1_000_000 * 1e18;
        lastResetTime = block.timestamp;
        
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(OPERATOR_ROLE, _admin);
    }

    /**
     * @dev Process revenue batch. Burns 25%, Recycles 75%.
     */
    function processRevenueBatch(uint256 amount, string calldata regionCode, string calldata batchRef) 
        external 
        onlyRole(OPERATOR_ROLE) 
        whenNotPaused 
    {
        require(amount > 0, "Amount must be > 0");
        
        // --- CIRCUIT BREAKER ---
        if (block.timestamp >= lastResetTime + 1 days) {
            currentDayProcessed = 0;
            lastResetTime = block.timestamp;
        }
        
        require(currentDayProcessed + amount <= maxDailyLimit, "Daily Limit Exceeded");
        currentDayProcessed += amount;
        // -----------------------
        
        uint256 burnAmt = (amount * 25) / 100;
        uint256 recycleAmt = amount - burnAmt;

        // Execute Burn
        IBurnable(address(token)).burnFrom(msg.sender, burnAmt);

        // Execute Recycle
        if (recycleAmt > 0) {
            token.safeTransferFrom(msg.sender, recycleTreasury, recycleAmt);
        }

        emit BatchProcessed(regionCode, batchRef, amount, burnAmt, recycleAmt);
    }

    // --- VIEW HELPERS ---
    
    function getRemainingDailyLimit() external view returns (uint256) {
        if (block.timestamp >= lastResetTime + 1 days) {
            return maxDailyLimit;
        }
        if (currentDayProcessed >= maxDailyLimit) {
            return 0;
        }
        return maxDailyLimit - currentDayProcessed;
    }

    // --- ADMIN SETTERS ---

    function updateTreasury(address _newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newTreasury != address(0), "Invalid Address");
        emit TreasuryUpdated(recycleTreasury, _newTreasury, msg.sender);
        recycleTreasury = _newTreasury;
    }

    function setDailyLimit(uint256 _newLimit) external onlyRole(DEFAULT_ADMIN_ROLE) {
        // Fix #2: Lower Bound Safety
        require(_newLimit >= MIN_DAILY_LIMIT, "Limit too low (Min 100 EIT)");
        emit DailyLimitUpdated(maxDailyLimit, _newLimit, msg.sender);
        maxDailyLimit = _newLimit;
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}