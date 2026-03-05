# EIT Crowdsale Security Model

## Overview

The EIT Crowdsale system is designed with a **defense-in-depth security model** combining:

- Strict access control
- Economic invariant enforcement
- Oracle safety checks
- Multi-layer testing
- External security analysis

The architecture separates responsibilities across multiple contracts:

```
EnsureInsuredToken
EITCrowdsale
EITDistributor
EITVestingVault
EITPlatformManager
```

This modular design reduces systemic risk and limits the impact of vulnerabilities.

---

# Threat Model

The system assumes potential attackers may attempt to:

1. Manipulate oracle price feeds
2. Bypass contribution caps
3. Exceed phase or hard caps
4. Exploit refund logic
5. Perform reentrancy attacks
6. Trigger milestone releases multiple times
7. Abuse claim or refund flows
8. Drain token balances
9. Exploit phase transitions

The smart contracts include protections against these threats.

---

# Trust Assumptions

The following components are trusted.

## Chainlink Oracle

ETH/USD price feed must be reliable and resistant to manipulation.

Protection mechanisms include:

```
MAX_ORACLE_DELAY
MIN_ETH_PRICE
MAX_ETH_PRICE
answeredInRound validation
```

## Administrative Roles

The system assumes trusted administrators manage:

```
DEFAULT_ADMIN_ROLE
OPERATOR_ROLE
```

Admin responsibilities include:

- Adding phases
- Managing stablecoins
- Enabling refunds
- Finalizing the sale

Operational roles manage:

- Whitelist management
- Phase claim activation

---

# Economic Invariants

The system enforces several core invariants.

## Hard Cap

```
totalRaisedUSD <= HARD_CAP
```

Ensures the total funds raised never exceed the maximum allowed.

## Phase Accounting

```
Σ phaseRaisedUSD == totalRaisedUSD
```

Ensures accounting consistency across phases.

## User Contribution Limit

```
userTotalUSD[user] <= MAX_CONTRIBUTION
```

Prevents individual investors from exceeding contribution limits.

## Token Solvency

```
token.balanceOf(crowdsale) >= totalTokensSold
```

Guarantees the crowdsale contract always holds enough tokens.

---

# Security Mechanisms

## Access Control

Administrative functions are protected using **AccessControl**.

Example roles:

```
DEFAULT_ADMIN_ROLE
OPERATOR_ROLE
```

## Reentrancy Protection

Critical functions are protected using **ReentrancyGuard**.

Protected functions include:

```
buyWithNative()
buyWithStablecoin()
claimPhase()
claimRefund()
```

## Oracle Safety

Oracle data is validated using multiple checks:

- Price must be positive
- Timestamp must be recent
- Round data must be valid
- Price must fall within allowed bounds

## Pause Mechanism

Emergency pause functionality allows administrators to stop:

- Token purchases
- Token claims

during abnormal conditions.

---

# Testing Strategy

The project includes extensive automated testing.

```
Total Tests: 235
Passing: 233
Pending: 2
```

Testing methodologies include:

- Unit tests
- Invariant testing
- Fuzz testing
- Stress testing
- Attack simulations

---

# Security Tooling

The contracts were analyzed using multiple security tools.

| Tool | Purpose |
|-----|--------|
| Slither | Static analysis |
| Mythril | Symbolic execution |
| Echidna | Property fuzzing |

No critical vulnerabilities were detected.

---

# Known Limitations

Two tests remain pending due to impractical execution scenarios:

1. Full $100M hard cap simulation
2. Complex claim/refund state interaction

Both scenarios are validated through invariants and attack simulations.

---

# Audit Readiness

The EIT Crowdsale system is considered **ready for professional security audit**.

The project includes:

- Comprehensive automated testing
- Adversarial attack simulations
- Static and symbolic analysis
- Extensive documentation

---

# Final Notes

Security is an ongoing process. Even after audit completion, the project plans to implement:

- Bug bounty programs
- Continuous monitoring
- Responsible disclosure policies
