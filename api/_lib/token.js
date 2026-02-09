import { ethers } from 'ethers';

const MOLTSPACE_TOKEN = '0x4F6dd8500e1d148D275926e3324a536e88f11dBB';
const BASE_RPC = 'https://mainnet.base.org';
const ERC20_ABI = ['function balanceOf(address) view returns (uint256)'];

let provider;

function getProvider() {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(BASE_RPC);
  }
  return provider;
}

export async function checkTokenBalance(walletAddress) {
  if (!walletAddress || !walletAddress.startsWith('0x') || walletAddress.length !== 42) {
    return 0n;
  }
  const p = getProvider();
  const token = new ethers.Contract(MOLTSPACE_TOKEN, ERC20_ABI, p);
  const balance = await token.balanceOf(walletAddress);
  return balance;
}

export function formatTokenBalance(balance) {
  return ethers.formatEther(balance);
}

export const MOLTSPACE_ADDRESS = MOLTSPACE_TOKEN;
