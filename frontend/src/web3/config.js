import { defineChain } from 'viem';
import { http } from 'wagmi';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

export const robinhood = defineChain({
  id: 4663,
  name: 'Robinhood Chain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.mainnet.chain.robinhood.com'] } },
  blockExplorers: { default: { name: 'Blockscout', url: 'https://robinhoodchain.blockscout.com' } },
});

export const wagmiConfig = getDefaultConfig({
  appName: 'Futbot League',
  projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID,
  chains: [robinhood],
  transports: { [robinhood.id]: http(robinhood.rpcUrls.default.http[0]) },
  ssr: false,
});
