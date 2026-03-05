// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract EITVestingVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;

    struct VestingSchedule {
        bool isRevocable;
        bool isRevoked;
        uint256 totalAmount;
        uint256 amountClaimed;
        uint256 startTime;
        uint256 cliffDuration;
        uint256 vestingDuration;
    }

    mapping(address => VestingSchedule) public vestingSchedules;
    
    event ScheduleCreated(address indexed beneficiary, uint256 amount);
    event TokensClaimed(address indexed beneficiary, uint256 amount);
    event ScheduleRevoked(address indexed beneficiary, uint256 amountReturned);
    event BeneficiaryTransferred(address indexed oldBeneficiary, address indexed newBeneficiary);

    // FIX: Constructor now only takes 1 argument (Token Address)
    // The Owner is automatically set to msg.sender (You)
    constructor(address _token) Ownable(msg.sender) {
        token = IERC20(_token);
    }

    function createVestingSchedule(
        address _beneficiary,
        uint256 _amount,
        uint256 _startTime,
        uint256 _cliffDuration,
        uint256 _vestingDuration,
        bool _isRevocable
    ) external onlyOwner {
        require(vestingSchedules[_beneficiary].totalAmount == 0, "Schedule exists");
        require(token.balanceOf(address(this)) >= _amount, "Insufficient Vault Balance");

        vestingSchedules[_beneficiary] = VestingSchedule({
            isRevocable: _isRevocable,
            isRevoked: false,
            totalAmount: _amount,
            amountClaimed: 0,
            startTime: _startTime,
            cliffDuration: _cliffDuration,
            vestingDuration: _vestingDuration
        });

        emit ScheduleCreated(_beneficiary, _amount);
    }

    function changeBeneficiary(address _old, address _new) external onlyOwner {
        require(_new != address(0), "Invalid New Address");
        require(vestingSchedules[_old].totalAmount > 0, "No schedule");
        require(vestingSchedules[_new].totalAmount == 0, "Target has schedule");
        require(vestingSchedules[_old].isRevocable, "Cannot move Irrevocable Schedule");

        vestingSchedules[_new] = vestingSchedules[_old];
        delete vestingSchedules[_old];

        emit BeneficiaryTransferred(_old, _new);
    }

    function transferMySchedule(address _new) external nonReentrant {
        require(_new != address(0), "Invalid New Address");
        require(vestingSchedules[msg.sender].totalAmount > 0, "No schedule");
        require(vestingSchedules[_new].totalAmount == 0, "Target has schedule");
        
        vestingSchedules[_new] = vestingSchedules[msg.sender];
        delete vestingSchedules[msg.sender];

        emit BeneficiaryTransferred(msg.sender, _new);
    }

    function claim() external nonReentrant {
        VestingSchedule storage schedule = vestingSchedules[msg.sender];
        require(schedule.totalAmount > 0 && !schedule.isRevoked, "Invalid Claim");

        uint256 vested = _calculateVestedAmount(msg.sender);
        uint256 claimable = vested - schedule.amountClaimed;
        require(claimable > 0, "Nothing to claim");

        schedule.amountClaimed += claimable;
        token.safeTransfer(msg.sender, claimable);
        emit TokensClaimed(msg.sender, claimable);
    }

    function revoke(address _beneficiary) external onlyOwner {
        VestingSchedule storage schedule = vestingSchedules[_beneficiary];
        require(schedule.isRevocable && !schedule.isRevoked, "Cannot revoke");

        uint256 vested = _calculateVestedAmount(_beneficiary);
        uint256 claimable = vested - schedule.amountClaimed;
        
        if (claimable > 0) {
            token.safeTransfer(_beneficiary, claimable);
        }

        uint256 remainder = schedule.totalAmount - vested;
        schedule.isRevoked = true;
        
        emit ScheduleRevoked(_beneficiary, remainder);
    }

    function _calculateVestedAmount(address _beneficiary) internal view returns (uint256) {
        VestingSchedule memory s = vestingSchedules[_beneficiary];
        if (block.timestamp < s.startTime + s.cliffDuration) return 0;
        if (block.timestamp >= s.startTime + s.vestingDuration || s.isRevoked) return s.totalAmount;
        
        return (s.totalAmount * (block.timestamp - s.startTime)) / s.vestingDuration;
    }
}