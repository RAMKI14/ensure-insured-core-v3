import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia, polygon } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Ensure Insured ICO',
  // Get a free ID at https://cloud.walletconnect.com for production. 
  // Using a placeholder works for localhost but might show limits.
  projectId: '8baa0b37a77dd7a0ed72ab1fe9489f1d', 
  chains: [sepolia, polygon],
  ssr: false, // We are a Single Page App (SPA)
});