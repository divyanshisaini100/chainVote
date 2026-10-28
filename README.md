# ChainVote

## Overview
ChainVote is a decentralized, full-stack polling application built on the Ethereum Sepolia testnet. It allows users to create polls and cast votes directly from their crypto wallets. Unlike traditional polling apps that rely on a centralized backend database (which can be tampered with), ChainVote stores every vote as an immutable transaction on the blockchain. 

The core philosophy is simple: **Votes you can audit, not just trust.**

## Features
* **Wallet Authentication:** Passwordless login using MetaMask.
* **Create Polls:** Users can create custom polls with multiple options and set a specific duration (in minutes) for how long voting remains open.
* **One Wallet, One Vote:** Smart contract logic strictly enforces that a single wallet address can only vote once per poll, preventing spam and duplicate voting.
* **Live Results:** Real-time visual progress bars show the percentage of votes for each option.
* **On-Chain Audit Tool:** A built-in audit feature that queries the blockchain logs (events), recalculates the votes in the browser, and verifies that the displayed results match the actual on-chain data perfectly.
* **Privacy & Transparency:** No backend server is required. The file never touches a centralized database, and anyone can verify the contract directly on Etherscan.

## Demo
* **Live Application:** [(https://chainvote-frontend.vercel.app/)]
* **Smart Contract (Sepolia):** [`0xa1C6c0CC5E49e3284e674015E5d82f050fa3848C`](https://sepolia.etherscan.io/address/0xa1C6c0CC5E49e3284e674015E5d82f050fa3848C)

## Demo Video
* **Watch the 2-minute walkthrough here:** [(https://drive.google.com/file/d/1vmyubmnd8pzHVjdVhwy4K7bpLaFvy0BR/view?usp=sharing)]
*(The video demonstrates wallet connection, poll creation, the double-vote prevention mechanism, and the on-chain audit feature).*

## Tech Stack
**Frontend:**
* React.js (via Vite)
* Ethers.js (v6) for blockchain interaction
* Vanilla CSS (custom styling, responsive design)

**Blockchain / Backend:**
* Solidity (v0.8.28) for the Smart Contract
* Hardhat (development environment, testing, and deployment)
* Sepolia Testnet (Ethereum)

## Architecture
ChainVote operates on a serverless architecture. The blockchain acts as the database, and the smart contract acts as the backend logic.

1. **User** interacts with the **React Frontend**.
2. The frontend uses **Ethers.js** to request a signature from **MetaMask**.
3. MetaMask broadcasts the transaction to the **Sepolia Network**.
4. The **Smart Contract** validates the transaction (e.g., checking if the user already voted), executes the logic, and emits an event.
5. The frontend queries the contract directly to read the updated state and renders the results.

## Project Structure
```text
chainVote/ (Hardhat Project)
├── contracts/
│   └── ChainVote.sol       # The Solidity smart contract
├── scripts/
│   └── deploy.js           # Script to deploy to Sepolia
├── .env                    # Stores RPC URL and Private Key (Ignored in Git)
└── hardhat.config.js       # Hardhat configuration

chainvote-frontend/ (React Project)
├── src/
│   ├── abi.js              # Contract Address and ABI
│   ├── contract.js         # Ethers.js connection logic
│   ├── App.jsx             # Main React UI
│   ├── App.css             # Styling
│   └── main.jsx            # React entry point
└── package.json