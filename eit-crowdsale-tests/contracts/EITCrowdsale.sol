// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract EITCrowdsale is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    enum SaleState { Active, SoftCapReached, Finalized, Refunding }
    SaleState public saleState;

    struct Phase {
        uint256 targetUSD;
        uint256 priceUSD;
        uint256 raisedUSD;
        bool isComplete;
    }

    Phase[] public phases;
    uint256 public currentPhase;  

    IERC20 public immutable token;
    AggregatorV3Interface public immutable oracle;
    address public immutable treasury;

    uint256 public totalRaisedUSD;
    uint256 public totalReleasedUSD;
    uint256 public totalTokensSold;

    uint256 public constant HARD_CAP = 100_000_000 * 1e18;
    uint256 public constant SOFT_CAP = 15_000_000 * 1e18;

    uint256 public constant MILESTONE_SIZE_USD = 1_000_000 * 1e18;

    uint256 public constant MIN_CONTRIBUTION = 100 * 1e18;
    uint256 public constant MAX_CONTRIBUTION = 50_000 * 1e18;

    uint256 public constant MAX_ORACLE_DELAY = 15 minutes;
    uint256 public constant MIN_ETH_PRICE = 1000 * 1e18;
    uint256 public constant MAX_ETH_PRICE = 20000 * 1e18;

    mapping(address => bool) public isWhitelisted;
    mapping(address => uint256) public userTotalUSD;

    mapping(uint256 => mapping(address => uint256)) public phasePurchased;
    mapping(uint256 => bool) public phaseClaimEnabled;

    mapping(address => uint256) public ethContributed;

    mapping(address => mapping(address => uint256)) public stableContributed;
    mapping(address => bool) public supportedStable;
    mapping(address => uint8) public stablecoinDecimals;

    address[] public stableList;

    event TokensPurchased(address indexed buyer, uint256 indexed phaseId, uint256 usdAmount, uint256 tokenAmount);
    event PhaseCompleted(uint256 indexed phaseId);
    event PhaseClaimEnabled(uint256 indexed phaseId);
    event TokensClaimed(address indexed user, uint256 indexed phaseId, uint256 amount);
    event RefundClaimed(address indexed user);
    event FundsReleased(uint256 amountUSD);
    event SaleFinalized();
    event WhitelistUpdated(address indexed user, bool status);
    event PhaseAdded(uint256 indexed phaseId, uint256 targetUSD, uint256 priceUSD);

    constructor(
        address _token,
        address _oracle,
        address _treasury,
        address admin
    ) {
        require(_token != address(0));
        require(_oracle != address(0));
        require(_treasury != address(0));
        require(admin != address(0));

        token = IERC20(_token);
        oracle = AggregatorV3Interface(_oracle);
        treasury = _treasury;

        saleState = SaleState.Active;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);
    }

    receive() external payable { revert("Use buyWithNative()"); }
    fallback() external payable { revert("Use buyWithNative()"); }

    modifier onlyWhitelisted() {
        require(isWhitelisted[msg.sender], "Not whitelisted");
        _;
    }

    // ------------------------------------------------
    // PHASE MANAGEMENT
    // ------------------------------------------------

    function addPhase(uint256 targetUSD, uint256 priceUSD)
        external onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(saleState == SaleState.Active);
        require(targetUSD > 0, "Invalid phase target");
        require(priceUSD > 0, "Invalid phase price");

        phases.push(Phase(targetUSD, priceUSD, 0, false));

        emit PhaseAdded(phases.length - 1, targetUSD, priceUSD);
    }

    function addPhasesBatch(uint256[] calldata targetsUSD, uint256[] calldata pricesUSD)
        external onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(saleState == SaleState.Active, "Sale not active");
        require(targetsUSD.length == pricesUSD.length, "Array length mismatch");
        require(targetsUSD.length > 0, "Empty arrays");

        for (uint256 i = 0; i < targetsUSD.length; i++) {
            require(targetsUSD[i] > 0, "Invalid phase target");
            require(pricesUSD[i] > 0, "Invalid phase price");
            phases.push(Phase(targetsUSD[i], pricesUSD[i], 0, false));
            emit PhaseAdded(phases.length - 1, targetsUSD[i], pricesUSD[i]);
        }
    }

    function getPhaseCount() external view returns (uint256) {
        return phases.length;
    }

    // ------------------------------------------------
    // WHITELIST MANAGEMENT
    // ------------------------------------------------

    function addToWhitelist(address[] calldata users)
        external onlyRole(OPERATOR_ROLE)
    {
        require(users.length > 0 && users.length <= 500);

        for (uint256 i; i < users.length; ) {
            isWhitelisted[users[i]] = true;
            emit WhitelistUpdated(users[i], true);
            unchecked { ++i; }
        }
    }

    function removeFromWhitelist(address[] calldata users)
        external onlyRole(OPERATOR_ROLE)
    {
        require(users.length > 0 && users.length <= 500);

        for (uint256 i; i < users.length; ) {
            isWhitelisted[users[i]] = false;
            emit WhitelistUpdated(users[i], false);
            unchecked { ++i; }
        }
    }

    // ------------------------------------------------
    // STABLECOIN SUPPORT
    // ------------------------------------------------

    function addStablecoin(address tokenAddr, uint8 decimals)
        external onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(!supportedStable[tokenAddr]);
        require(decimals <= 18);

        supportedStable[tokenAddr] = true;
        stablecoinDecimals[tokenAddr] = decimals;
        stableList.push(tokenAddr);
    }

    // ------------------------------------------------
    // PURCHASE FUNCTIONS
    // ------------------------------------------------

    function buyWithNative(uint256 minTokensOut)
        external payable nonReentrant whenNotPaused onlyWhitelisted
    {
        require(saleState == SaleState.Active);
        require(currentPhase < phases.length);

        uint256 price = _getOraclePrice();
        uint256 usdValue = (msg.value * price) / 1e18;

        _processPurchase(usdValue, minTokensOut);

        ethContributed[msg.sender] += msg.value;
    }

    function buyWithStablecoin(address stableToken, uint256 amount, uint256 minTokensOut)
        external nonReentrant whenNotPaused onlyWhitelisted
    {
        require(supportedStable[stableToken]);
        require(saleState == SaleState.Active);
        require(currentPhase < phases.length);

        IERC20(stableToken).safeTransferFrom(msg.sender, address(this), amount);

        uint8 dec = stablecoinDecimals[stableToken];
        uint256 usdValue = amount * (10 ** (18 - dec));

        stableContributed[msg.sender][stableToken] += amount;

        _processPurchase(usdValue, minTokensOut);
    }

    function _processPurchase(uint256 usdValue, uint256 minTokensOut) internal {

        require(usdValue > 0, "Zero purchase");
        require(usdValue >= MIN_CONTRIBUTION, "Below minimum contribution");

        require(
            userTotalUSD[msg.sender] + usdValue <= MAX_CONTRIBUTION,
            "User cap exceeded"
        );

        require(
            totalRaisedUSD + usdValue <= HARD_CAP,
            "Hard cap exceeded"
        );

        uint256 phaseId = currentPhase;
        Phase storage p = phases[phaseId];

        require(!p.isComplete, "Phase complete");
        require(p.raisedUSD + usdValue <= p.targetUSD, "Phase cap exceeded");

        uint256 tokens = (usdValue * 1e18) / p.priceUSD;

        require(tokens >= minTokensOut, "Slippage exceeded");

        uint256 tokenBalance = token.balanceOf(address(this));

        require(
            tokenBalance - totalTokensSold >= tokens,
            "Insufficient token inventory"
        );

        userTotalUSD[msg.sender] += usdValue;

        p.raisedUSD += usdValue;
        totalRaisedUSD += usdValue;

        phasePurchased[phaseId][msg.sender] += tokens;
        totalTokensSold += tokens;

        emit TokensPurchased(msg.sender, phaseId, usdValue, tokens);

        if (p.raisedUSD >= p.targetUSD) {

            p.isComplete = true;
            emit PhaseCompleted(phaseId);

            if (totalRaisedUSD >= SOFT_CAP && saleState == SaleState.Active) {
                saleState = SaleState.SoftCapReached;
            }

            currentPhase++;
        }

        _checkMilestoneRelease();
    }

    // ------------------------------------------------
    // CLAIM
    // ------------------------------------------------

    function enablePhaseClaim(uint256 phaseId)
        external onlyRole(OPERATOR_ROLE)
    {
        require(phases[phaseId].isComplete);
        phaseClaimEnabled[phaseId] = true;
        emit PhaseClaimEnabled(phaseId);
    }

    function claimPhase(uint256 phaseId)
        external nonReentrant whenNotPaused
    {
        require(phaseClaimEnabled[phaseId]);

        uint256 amount = phasePurchased[phaseId][msg.sender];
        require(amount > 0);

        phasePurchased[phaseId][msg.sender] = 0;
        token.safeTransfer(msg.sender, amount);

        emit TokensClaimed(msg.sender, phaseId, amount);
    }

    // ------------------------------------------------
    // REFUND
    // ------------------------------------------------

    function enableRefunds()
        external onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(totalRaisedUSD < SOFT_CAP);
        saleState = SaleState.Refunding;
    }

    function claimRefund() external nonReentrant {
        require(saleState == SaleState.Refunding);

        uint256 ethAmount = ethContributed[msg.sender];

        if (ethAmount > 0) {
            ethContributed[msg.sender] = 0;
            (bool ok,) = payable(msg.sender).call{value: ethAmount}("");
            require(ok, "Refund failed");
        }

        uint256 len = stableList.length;

        for (uint256 i; i < len; ) {
            address s = stableList[i];
            uint256 amt = stableContributed[msg.sender][s];

            if (amt > 0) {
                stableContributed[msg.sender][s] = 0;
                IERC20(s).safeTransfer(msg.sender, amt);
            }

            unchecked { ++i; }
        }

        userTotalUSD[msg.sender] = 0;

        uint256 phaseLen = phases.length;

        for (uint256 i; i < phaseLen; ) {
            phasePurchased[i][msg.sender] = 0;
            unchecked { ++i; }
        }

        emit RefundClaimed(msg.sender);
    }

    // ------------------------------------------------
    // FINALIZATION
    // ------------------------------------------------

    function finalizeSale()
        external onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(saleState != SaleState.Refunding);

        saleState = SaleState.Finalized;

        emit SaleFinalized();
    }

    function withdrawUnsoldTokens()
        external onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(
            saleState == SaleState.Finalized ||
            saleState == SaleState.Refunding
        );

        uint256 balance = token.balanceOf(address(this));
        uint256 available = balance > totalTokensSold
            ? balance - totalTokensSold
            : 0;

        require(available > 0);

        token.safeTransfer(treasury, available);
    }

    // ------------------------------------------------
    // TREASURY RELEASE
    // ------------------------------------------------

    function _checkMilestoneRelease() internal {
        while (totalRaisedUSD >= totalReleasedUSD + MILESTONE_SIZE_USD) {

            totalReleasedUSD += MILESTONE_SIZE_USD;

            _releaseFunds();

            emit FundsReleased(MILESTONE_SIZE_USD);
        }
    }

    function _releaseFunds() internal {

    address _treasury = treasury;

    uint256 ethBalance = address(this).balance;

    if (ethBalance > 0) {
        (bool ok,) = _treasury.call{value: ethBalance}("");
        require(ok, "ETH transfer failed");
    }

    uint256 len = stableList.length;

    for (uint256 i; i < len; ) {

        IERC20 s = IERC20(stableList[i]);

        uint256 stableBalance = s.balanceOf(address(this));

        if (stableBalance > 0) {
            s.safeTransfer(_treasury, stableBalance);
        }

        unchecked { ++i; }
    }
}

    // ------------------------------------------------
    // ORACLE
    // ------------------------------------------------

    function _getOraclePrice() internal view returns (uint256) {

        (uint80 roundID, int256 price,, uint256 ts, uint80 answeredInRound) =
            oracle.latestRoundData();

        require(price > 0, "Invalid oracle price");
        require(block.timestamp - ts <= MAX_ORACLE_DELAY, "Oracle price stale");
        require(answeredInRound >= roundID, "Incomplete oracle round");

        uint8 dec = oracle.decimals();

        uint256 normalized = uint256(price) * (10 ** (18 - dec));

        require(normalized >= MIN_ETH_PRICE && normalized <= MAX_ETH_PRICE);

        return normalized;
    }

    // ------------------------------------------------
    // PAUSE
    // ------------------------------------------------

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}