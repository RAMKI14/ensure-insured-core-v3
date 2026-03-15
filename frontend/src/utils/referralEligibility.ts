import { ethers } from 'ethers';

export async function getReferralHoldingValue(account, provider, addresses, tokenAbi, crowdsaleAbi) {
  const tokenContract = new ethers.Contract(addresses.EIT, tokenAbi.abi, provider);
  const crowdsale = new ethers.Contract(addresses.CROWDSALE, crowdsaleAbi.abi, provider);

  const [walletBalanceWei, phaseCountRaw, currentPhaseRaw] = await Promise.all([
    tokenContract.balanceOf(account),
    crowdsale.getPhaseCount(),
    crowdsale.currentPhase(),
  ]);

  const phaseCount = Number(phaseCountRaw);
  const currentPhase = Number(currentPhaseRaw);

  let pendingBalanceWei = 0n;
  for (let i = 0; i < phaseCount; i += 1) {
    const purchased = await crowdsale.phasePurchased(i, account);
    pendingBalanceWei += purchased;
  }

  const totalEligibleBalance = walletBalanceWei + pendingBalanceWei;

  if (phaseCount === 0) {
    return {
      valueUsd: 0,
      tokenBalance: parseFloat(ethers.formatEther(totalEligibleBalance)),
      pendingBalance: parseFloat(ethers.formatEther(pendingBalanceWei)),
      priceUsd: 0,
    };
  }

  const phaseIndex = Math.min(currentPhase, phaseCount - 1);
  const phase = await crowdsale.phases(phaseIndex);
  const priceUsd = parseFloat(ethers.formatEther(phase.priceUSD));
  const tokenBalance = parseFloat(ethers.formatEther(totalEligibleBalance));

  return {
    valueUsd: tokenBalance * priceUsd,
    tokenBalance,
    pendingBalance: parseFloat(ethers.formatEther(pendingBalanceWei)),
    priceUsd,
  };
}
