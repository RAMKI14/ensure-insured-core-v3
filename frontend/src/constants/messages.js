export const MESSAGES = {
  // --- UI LABELS ---
  APP_TITLE: "Ensure Insured ICO",
  CONNECT_WALLET: "Connect Wallet",
  CONNECTING: "Connecting...",
  CONNECTED: "Connected",
  DISCONNECT: "Disconnect",
  
  // --- CARD LABELS ---
  CARD_TITLE: "Purchase EIT Tokens",
  LABEL_PAY_AMOUNT: "Amount to Pay",
  LABEL_BALANCE: "Available:",
  LABEL_RECEIVE: "You will receive approximately",
  LABEL_EIT: "EIT",
  BTN_PROCESS: "Processing...",
  BTN_BUY: "BUY WITH", // Will be used like "BUY WITH ETH"
  
  // --- TOOLS ---
  TOOL_SECTION: "Testnet Tools",
  TOOL_MINT: "[Testnet] Mint 1000 Mock USDT",

  // --- WARNINGS & ERRORS ---
  WARN_NETWORK: "⚠️ Please switch wallet to Sepolia Testnet",
  ERR_INSTALL_METAMASK: "MetaMask not found! Please install the extension.",
  ERR_CONNECT_FIRST: "Please Connect Wallet first!",
  ERR_INVALID_AMOUNT: "Please enter a valid amount greater than 0.",
  ERR_INSUFFICIENT_FUNDS: "⚠️ Insufficient Funds", // Short label
  ERR_INSUFFICIENT_DETAILED: (token, bal) => `Insufficient ${token}! You have ${bal}.`, // Function for dynamic text
  ERR_GAS: "Error: Insufficient ETH for Gas Fees.",
  ERR_USER_REJECTED: "Action cancelled by user.",
  ERR_PENDING_REQUEST: "MetaMask is already waiting! Check the extension.",
  ERR_GENERIC: "Transaction Failed: ",
  
  // --- CONTRACT REVERT TRANSLATIONS ---
  ERR_MAX_WALLET_LIMIT: (remaining) => `⚠️ Max Wallet Limit Reached! You can only purchase $${remaining} more.`,
  ERR_SALE_NOT_ACTIVE: "⚠️ The token sale is currently not active or paused.",
  ERR_PHASE_CAP: "⚠️ This sale phase has reached its maximum capacity.",
  ERR_HARD_CAP: "⚠️ The Crowdsale hard cap has been reached.",
  ERR_NOT_WHITELISTED: "⚠️ Your wallet is not whitelisted for this sale.",
  ERR_ZERO_PURCHASE: "⚠️ Purchase amount cannot be zero.",

  // --- STATUS UPDATES (YELLOW) ---
  STATUS_INIT: "Initiating Transaction...",
  STATUS_APPROVE: (token) => `Step 1/2: Approving ${token}...`,
  STATUS_CONFIRM: "Step 2/2: Confirming Purchase...",
  STATUS_WAITING: "Transaction Sent! Waiting for block confirmation...",
  STATUS_MINTING: "Minting Free Mock USDT...",

  // --- SUCCESS MESSAGES (GREEN) ---
  SUCCESS_PURCHASE: (amount) => `✅ SUCCESS! You purchased ${amount} EIT!`,
  SUCCESS_MINT: "✅ Success! 1000 Mock USDT added to your wallet.",
  
  // --- DEFAULTS ---
  READY: "Ready to transact...",
  UNKNOWN_NETWORK: "Unknown Network"
};