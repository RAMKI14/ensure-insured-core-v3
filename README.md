# Ensure Insured Token Ecosystem

## ⚠️ Security Notes

### Mock Contracts
The `contracts/MockUSDT.sol` and `contracts/MockOracle.sol` files contain a cryptographic **Chain ID Lock**. 
*   They **cannot** be deployed to Mainnet (Ethereum, Polygon, BSC). 
*   They will revert if `block.chainid` is not `31337` (Localhost) or `11155111` (Sepolia).
*   **Action:** For Mainnet deployment, the script automatically switches to using real Chainlink and Tether addresses.

## 1. Overview
This repository contains the smart contracts for the EIT Token Sale and Operational Platform.

## 2. Contracts
- **Token:** `EnsureInsuredToken.sol` (Fixed 50B Supply, Burnable (25% Burn, 75% Recycle))
- **Sales:** `EITCrowdsale.sol` (Multi-currency, Oracle-based pricing)
- **Vault:** `EITVestingVault.sol` (Revocable vesting for team, Irrevocable for founder)
- **Engine:** `EITPlatformManager.sol` (Deflationary 25% Burn / 75% Recycle logic)

## 3. Allocation Strategy
- **15 Billion:** Public Sale (Crowdsale Contract)
- **15 Billion:** Company Inventory (Admin Wallet)
- **20 Billion:** Locked Team/Founders (Vesting Vault)

## 4. How to Deploy
1. Install dependencies: `npm install`
2. Setup `.env` with Private Key & RPC.
3. Run: `npm run deploy:sepolia`

## 5. Testing
Run `npx hardhat test` to execute the full security suite.