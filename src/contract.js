import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./abi";

// Connect to MetaMask and return { provider, signer, address }
export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed. Please install the MetaMask extension.");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []); // asks MetaMask to unlock
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  return { provider, signer, address };
}

// Read-only contract (no wallet needed) — for listing polls and reading votes
export async function getReadContract() {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed.");
  }
  const provider = new ethers.BrowserProvider(window.ethereum);
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

// Write-enabled contract (needs signer) — for createPoll and vote
export async function getWriteContract(signer) {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}