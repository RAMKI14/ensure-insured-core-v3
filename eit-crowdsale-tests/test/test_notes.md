test/
 ├── 01_phase_management.test.js
 ├── 02_whitelist.test.js
 ├── 03_native_purchase.test.js
 ├── 04_stablecoin_purchase.test.js
 ├── 05_phase_transitions.test.js
 ├── 06_softcap_logic.test.js
 ├── 07_claims.test.js
 ├── 08_refunds.test.js
 ├── 09_milestone_release.test.js
 ├── 10_withdraw_unsold.test.js
 ├── 11_oracle.test.js
 ├── 12_security_invariants.test.js
 ├── 13_pause.test.js
 ├── 14_edge_cases.test.js
 └── 15_fuzz_properties.test.js

 Category Breakdown (What Gets Tested)
1️⃣ Phase Management (10 tests)

Add phase success

Cannot add phase after finalize

Phase data stored correctly

Cannot exceed HARD_CAP across phases

Cannot buy if no phases exist

Phase count correct

Phase complete triggers event

Cannot buy after last phase

Cannot overfill phase

Cannot enable claim before completion

2️⃣ Whitelist (8 tests)

Only operator can add

Only operator can remove

Batch limit enforced

Non-whitelisted cannot buy

Removal blocks purchase

Re-add works

Zero address not allowed

Large batch reverts

3️⃣ Native Purchase (15 tests)

Correct USD conversion

Respects oracle bounds

Respects staleness

Per-user max cap enforced

Per-user min cap enforced

Hard cap enforced

Token inventory enforced

Slippage parameter enforced

Emits TokensPurchased

Accounting correct

totalTokensSold increments

userTotalUSD increments

ethContributed increments

Cannot buy when paused

Cannot buy after finalize

4️⃣ Stablecoin Purchase (15 tests)

Decimals normalization works

6 decimal stable works

18 decimal stable works

Unsupported stable reverts

TransferFrom required

Per-user caps enforced

Hard cap enforced

Phase cap enforced

Slippage enforced

Accounting correct

stableContributed correct

Event emitted

Milestone release triggers

Cannot buy in refund mode

Cannot buy when paused

5️⃣ Phase Transitions (10 tests)

Auto-completes phase

Moves to next phase

SoftCapReached triggers correctly

Cannot overflow into next phase

Correct pricing per phase

Cannot buy completed phase

Cannot claim before enabled

Claim only works for enabled phase

Multiple users different phases

Cross-phase accounting integrity

6️⃣ Claims (10 tests)

Claim successful

Cannot double claim

Cannot claim zero

Cannot claim before enabled

Claim emits event

Claim reduces mapping to zero

Cannot claim in refund mode

Cannot claim if paused

Claim does not affect other phases

Partial user claims across phases

7️⃣ Refunds (15 tests)

Cannot enable refund if soft cap reached

Refund only if Refunding state

ETH refund correct amount

Stable refund correct amount

Clears userTotalUSD

Clears phasePurchased

Clears stableContributed

Clears ethContributed

Cannot double refund

Refund emits event

Refund blocks later claim

Refund blocks later buy

Multiple stablecoins refund

Partial ETH + stable refund

Large user refund safe

8️⃣ Withdraw Unsold (8 tests)

Cannot withdraw before finalize

Cannot withdraw if not finalized or refunding

Cannot withdraw claimed tokens

Correct unsold calculation

Cannot withdraw twice

Emits no silent error

Treasury receives correct amount

Balance invariant preserved

9️⃣ Oracle Tests (10 tests)

Stale data reverts

answeredInRound check works

Negative price reverts

Too low price reverts

Too high price reverts

Correct normalization decimals

8 decimal feed works

18 decimal feed works

MAX_ORACLE_DELAY enforced

Correct price conversion