# EIT Production Deployment Checklist

This is the end-to-end production checklist for `eit-final-v2` and `eit-admin-v2` after the multisig and Safe-gated admin upgrades.

## 1. Prepare Wallet Roles

Create and confirm these addresses first:
- `ADMIN_SAFE`
- `TREASURY_SAFE`
- `OPS_WALLET`
- `PAUSER_WALLET`
- `VESTING_OWNER`

Recommended final mapping:
- `PROD_ADMIN_SAFE` = Admin Safe
- `PROD_TREASURY_SAFE` = Treasury Safe
- `PROD_OPS_WALLET` = dedicated hot ops wallet
- `PROD_PAUSER_WALLET` = same as ops wallet unless you want a separate emergency signer
- `PROD_RECYCLE_TREASURY` = Treasury Safe
- `PROD_DISTRIBUTOR_OWNER` = Treasury Safe
- `PROD_VESTING_OWNER` = Ops Wallet

Important current-version limitation:
- `pause/unpause` still requires crowdsale admin privileges on this contract version
- if `PAUSER_WALLET` must act instantly, it must retain broader crowdsale authority than ideal

## 2. Update Core Environment File

File:
- [`/Users/ramki/Desktop/eit-final-v2/.env`](/Users/ramki/Desktop/eit-final-v2/.env)

Set these values before production deployment:
- `PROD_ADMIN_SAFE`
- `PROD_TREASURY_SAFE`
- `PROD_OPS_WALLET`
- `PROD_PAUSER_WALLET`
- `PROD_RECYCLE_TREASURY`
- `PROD_DISTRIBUTOR_OWNER`
- `PROD_VESTING_OWNER`

Do not put JS statements in `.env`. Use plain `KEY=value`.

## 3. Keep the Production Config Template Ready

Files:
- [`/Users/ramki/Desktop/eit-final-v2/frontend-config_prod.json`](/Users/ramki/Desktop/eit-final-v2/frontend-config_prod.json)
- [`/Users/ramki/Desktop/eit-admin-v2/frontend-config_prod.json`](/Users/ramki/Desktop/eit-admin-v2/frontend-config_prod.json)

Before production, replace every `PLACEHOLDER_*` value with:
- deployed contract addresses
- production token addresses
- safe / ops / pauser addresses
- explorer base URL
- network label

## 4. Deploy Production Contracts with Multisig-First Script

Files:
- [`/Users/ramki/Desktop/eit-final-v2/scripts/production-multi-sig.js`](/Users/ramki/Desktop/eit-final-v2/scripts/production-multi-sig.js)
- [`/Users/ramki/Desktop/eit-final-v2/production-multi-sig.md`](/Users/ramki/Desktop/eit-final-v2/production-multi-sig.md)

Run:
```bash
cd /Users/ramki/Desktop/eit-final-v2
npx hardhat run scripts/production-multi-sig.js --network <production-network>
```

What this does:
- deploys production contracts
- sets crowdsale treasury to Treasury Safe
- writes config updates to all required frontend/backend config locations

## 5. Run Post-Deploy Handoff

File:
- [`/Users/ramki/Desktop/eit-final-v2/scripts/post_deploy_handoff.js`](/Users/ramki/Desktop/eit-final-v2/scripts/post_deploy_handoff.js)

Run:
```bash
cd /Users/ramki/Desktop/eit-final-v2
npx hardhat run scripts/post_deploy_handoff.js --network <production-network>
```

What this must complete:
- grant safe/ops roles
- transfer distributor ownership
- transfer vesting ownership
- revoke deployer rights where intended

## 6. Verify Frontend Config Files Were Updated Everywhere

The final production addresses must be present in all of these files:
- [`/Users/ramki/Desktop/eit-final-v2/frontend-config.json`](/Users/ramki/Desktop/eit-final-v2/frontend-config.json)
- [`/Users/ramki/Desktop/eit-final-v2/eit-backend/frontend-config.json`](/Users/ramki/Desktop/eit-final-v2/eit-backend/frontend-config.json)
- [`/Users/ramki/Desktop/eit-final-v2/frontend/src/frontend-config.json`](/Users/ramki/Desktop/eit-final-v2/frontend/src/frontend-config.json)
- [`/Users/ramki/Desktop/eit-admin-v2/frontend-config.json`](/Users/ramki/Desktop/eit-admin-v2/frontend-config.json)
- [`/Users/ramki/Desktop/eit-admin-v2/src/frontend-config.json`](/Users/ramki/Desktop/eit-admin-v2/src/frontend-config.json)

These keys now matter for production admin behavior:
- `ADMIN_SAFE`
- `TREASURY_SAFE`
- `OPS_WALLET`
- `PAUSER_WALLET`
- `RECYCLE_TREASURY`
- `DISTRIBUTOR_OWNER`
- `VESTING_OWNER`

If these keys are missing in admin config:
- Safe mode will not activate
- treasury/system/referral/ops high-risk actions will remain in direct signer mode

## 7. Update Backend Runtime Config

Backend files to verify:
- [`/Users/ramki/Desktop/eit-final-v2/eit-backend/server.js`](/Users/ramki/Desktop/eit-final-v2/eit-backend/server.js)
- [`/Users/ramki/Desktop/eit-final-v2/eit-backend/frontend-config.json`](/Users/ramki/Desktop/eit-final-v2/eit-backend/frontend-config.json)

Confirm:
- backend points to the final production contract addresses
- KYC/whitelist/referral endpoints reference the production config copy

## 8. Update Frontend/Admin Links and Labels

Files to verify after production address changes:
- [`/Users/ramki/Desktop/eit-final-v2/frontend/src/components/landing/Hero.jsx`](/Users/ramki/Desktop/eit-final-v2/frontend/src/components/landing/Hero.jsx)
- [`/Users/ramki/Desktop/eit-final-v2/frontend/src/App.jsx`](/Users/ramki/Desktop/eit-final-v2/frontend/src/App.jsx)
- [`/Users/ramki/Desktop/eit-admin-v2/src/App.jsx`](/Users/ramki/Desktop/eit-admin-v2/src/App.jsx)

Check:
- contract links use the correct explorer domain for production network
- displayed wallet-role labels match the real configured safe / ops addresses
- KYC provider links and messaging still make sense on the production domain

## 9. Validate What Is Safe-Gated vs Direct

High-risk actions that should now be Safe-gated in admin production mode:
- Treasury transfer
- Unsold token withdraw
- Distributor rescue withdraw
- Global refunds
- Role grant / revoke
- Referral reward distributions
- Revenue settlement / strategic burn
- Crowdsale force finalize / refunds

Direct actions intentionally kept:
- pause / resume
- Vesting / HR
- whitelist operations
- routine crowdsale ops like staging phases and claim enable

## 10. Run Admin Regression Checks

Automated checks:
```bash
cd /Users/ramki/Desktop/eit-admin-v2
npm run build
node test.js
```

Manual production pack:
- [`/Users/ramki/Desktop/eit-admin-v2/eit-admin-functional-testing-prod/test_cases.md`](/Users/ramki/Desktop/eit-admin-v2/eit-admin-functional-testing-prod/test_cases.md)
- [`/Users/ramki/Desktop/eit-admin-v2/eit-admin-functional-testing-prod/expected-results.md`](/Users/ramki/Desktop/eit-admin-v2/eit-admin-functional-testing-prod/expected-results.md)

## 11. Run Core Validation

Recommended checks:
```bash
cd /Users/ramki/Desktop/eit-final-v2
npm run compile
npx hardhat test
```

At minimum, confirm these milestone tests still pass:
- [`/Users/ramki/Desktop/eit-final-v2/eit-crowdsale-tests/test/07_milestone_release.test.js`](/Users/ramki/Desktop/eit-final-v2/eit-crowdsale-tests/test/07_milestone_release.test.js)
- [`/Users/ramki/Desktop/eit-final-v2/eit-crowdsale-tests/test/24_proportional_whale_release.test.js`](/Users/ramki/Desktop/eit-final-v2/eit-crowdsale-tests/test/24_proportional_whale_release.test.js)

## 12. Final Go-Live Verification

Before public access:
1. verify treasury release destination equals Treasury Safe on-chain
2. verify distributor owner equals Treasury Safe on-chain
3. verify vesting owner equals Ops Wallet on-chain
4. verify crowdsale admin/ops assignments match intended model
5. verify admin config contains safe keys so Safe mode is active
6. verify pause wallet can act instantly
7. verify one Safe proposal can be built from each gated admin panel
8. verify one direct action still works for pause and Vesting / HR

## 13. Do Not Forget These File Groups

Core deploy/config:
- [`/Users/ramki/Desktop/eit-final-v2/.env`](/Users/ramki/Desktop/eit-final-v2/.env)
- [`/Users/ramki/Desktop/eit-final-v2/frontend-config_prod.json`](/Users/ramki/Desktop/eit-final-v2/frontend-config_prod.json)
- [`/Users/ramki/Desktop/eit-final-v2/frontend-config.json`](/Users/ramki/Desktop/eit-final-v2/frontend-config.json)
- [`/Users/ramki/Desktop/eit-final-v2/scripts/production-multi-sig.js`](/Users/ramki/Desktop/eit-final-v2/scripts/production-multi-sig.js)
- [`/Users/ramki/Desktop/eit-final-v2/scripts/post_deploy_handoff.js`](/Users/ramki/Desktop/eit-final-v2/scripts/post_deploy_handoff.js)

Core distributed config copies:
- [`/Users/ramki/Desktop/eit-final-v2/eit-backend/frontend-config.json`](/Users/ramki/Desktop/eit-final-v2/eit-backend/frontend-config.json)
- [`/Users/ramki/Desktop/eit-final-v2/frontend/src/frontend-config.json`](/Users/ramki/Desktop/eit-final-v2/frontend/src/frontend-config.json)

Admin config and Safe-mode files:
- [`/Users/ramki/Desktop/eit-admin-v2/frontend-config_prod.json`](/Users/ramki/Desktop/eit-admin-v2/frontend-config_prod.json)
- [`/Users/ramki/Desktop/eit-admin-v2/frontend-config.json`](/Users/ramki/Desktop/eit-admin-v2/frontend-config.json)
- [`/Users/ramki/Desktop/eit-admin-v2/src/frontend-config.json`](/Users/ramki/Desktop/eit-admin-v2/src/frontend-config.json)
- [`/Users/ramki/Desktop/eit-admin-v2/src/utils/safeExecution.js`](/Users/ramki/Desktop/eit-admin-v2/src/utils/safeExecution.js)
- [`/Users/ramki/Desktop/eit-admin-v2/src/components/SafeProposalModal.jsx`](/Users/ramki/Desktop/eit-admin-v2/src/components/SafeProposalModal.jsx)
- [`/Users/ramki/Desktop/eit-admin-v2/src/components/TreasuryPanel.jsx`](/Users/ramki/Desktop/eit-admin-v2/src/components/TreasuryPanel.jsx)
- [`/Users/ramki/Desktop/eit-admin-v2/src/components/SystemControlsPanel.jsx`](/Users/ramki/Desktop/eit-admin-v2/src/components/SystemControlsPanel.jsx)
- [`/Users/ramki/Desktop/eit-admin-v2/src/components/ReferralPanel.jsx`](/Users/ramki/Desktop/eit-admin-v2/src/components/ReferralPanel.jsx)
- [`/Users/ramki/Desktop/eit-admin-v2/src/components/OpsPanel.jsx`](/Users/ramki/Desktop/eit-admin-v2/src/components/OpsPanel.jsx)
- [`/Users/ramki/Desktop/eit-admin-v2/src/components/CrowdsalePanel.jsx`](/Users/ramki/Desktop/eit-admin-v2/src/components/CrowdsalePanel.jsx)

If you update every file group above in the stated order, production deployment should be smooth and repeatable.
