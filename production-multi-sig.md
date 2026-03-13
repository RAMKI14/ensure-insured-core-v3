# Production Multi-Sig Deployment

## Goal

Deploy production contracts so custody and critical admin control sit with multisig wallets from day one, while keeping day-to-day ops and HR on faster non-multisig wallets where the current contracts require it.

## Final Model

This is the final model decided for this version:

- `Admin Safe`
  - high-risk governance
  - crowdsale admin
  - platform manager admin
  - token admin
- `Treasury Safe`
  - receives crowdsale milestone releases
  - owns distributor
  - is recycle treasury
- `Ops Wallet`
  - whitelist operations
  - routine crowdsale ops
  - platform manager operator actions
  - HR / vesting operations
- `Pauser Wallet`
  - fast emergency pause wallet
  - recommended to be the same address as `Ops Wallet`
- `Vesting Owner`
  - recommended to be the same address as `Ops Wallet`

## Required Environment Variables

- `PROD_ADMIN_SAFE`
- `PROD_TREASURY_SAFE`
- `PROD_OPS_WALLET`
- `PROD_PAUSER_WALLET`
- `PROD_RECYCLE_TREASURY`
- `PROD_DISTRIBUTOR_OWNER`
- `PROD_VESTING_OWNER`

Recommended defaults:

- `PROD_PAUSER_WALLET = PROD_OPS_WALLET`
- `PROD_RECYCLE_TREASURY = PROD_TREASURY_SAFE`
- `PROD_DISTRIBUTOR_OWNER = PROD_TREASURY_SAFE`
- `PROD_VESTING_OWNER = PROD_OPS_WALLET`

## Deployment Flow

1. Deploy with:

```bash
npx hardhat run scripts/production-multi-sig.js --network sepolia
```

2. Immediately run handoff:

```bash
npx hardhat run scripts/post_deploy_handoff.js --network sepolia
```

3. Verify on-chain:

- Crowdsale treasury equals treasury safe
- Token admin role belongs to admin safe
- Token pauser role belongs to pauser wallet
- Crowdsale default admin belongs to admin safe
- Crowdsale operator belongs to ops wallet
- Crowdsale pause wallet is the dedicated pauser wallet
- Platform manager admin belongs to admin safe
- Platform manager operator belongs to ops wallet
- Distributor owner equals distributor owner safe
- Vesting vault owner equals vesting owner wallet

## Safe-Only Actions

These should require multisig approval in production:

- milestone treasury custody
- withdraw unsold tokens
- enable refunds
- emergency distributor withdrawals
- treasury asset transfers
- role grants and revocations
- update recycle treasury
- ownership transfers
- emergency treasury rescue

## Direct Actions Allowed

These may remain direct:

- dashboard reads
- exports / reports
- search / filters
- off-chain KYC review state changes
- staging operational data before Safe confirmation
- whitelist operations
- revenue settlement execution
- strategic burn execution
- Vesting / HR allocations
- routine crowdsale operator flows
- pause / unpause through the dedicated pauser wallet

## Recommended Role Model

- Treasury Safe:
  - receives milestone releases
  - owns distributor
  - receives recycled treasury balances

- Admin Safe:
  - crowdsale default admin
  - platform manager default admin
  - token default admin
  - role governance
  - refund / unsold / treasury-critical approvals

- Ops Wallet:
  - crowdsale operator
  - platform manager operator
  - whitelist operations
  - burn/recycle execution
  - routine ops

- Pauser Wallet:
  - emergency pause / unpause

- HR Wallet:
  - vesting owner
  - frequent HR allocations

## Important Notes

- Crowdsale treasury is immutable after deployment.
- Distributor and vesting vault are `Ownable`, so handoff is mandatory if deployed by an EOA.
- Token supply currently mints to the deployer during deployment, then roles are handed off.
- In the current crowdsale contract, `pause/unpause` uses `DEFAULT_ADMIN_ROLE`, so giving a fast pauser wallet direct emergency control also gives it other admin powers. This is a contract limitation, not a script issue.
- In the current vesting vault contract, HR control is `onlyOwner`, so the fastest model is to keep vesting ownership on a dedicated HR/ops wallet, not a multisig.

## Recommended .env Mapping

If you are using exactly 2 multisigs plus 1 hot ops wallet, use:

```env
PROD_ADMIN_SAFE=0xAdminSafe...
PROD_TREASURY_SAFE=0xTreasurySafe...
PROD_OPS_WALLET=0xOpsHotWallet...
PROD_PAUSER_WALLET=0xOpsHotWallet...
PROD_RECYCLE_TREASURY=0xTreasurySafe...
PROD_DISTRIBUTOR_OWNER=0xTreasurySafe...
PROD_VESTING_OWNER=0xOpsHotWallet...
```
