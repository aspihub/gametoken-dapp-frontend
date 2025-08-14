# GameToken Platform – Blockchain 2-Player Matchmaking Dapp

This project is a full-stack blockchain-powered 2-player gaming platform.
Users buy GameToken (GT) using USDT (testnet), get auto-matchmade for a PvP game, stake GT into the match, play in real-time, and the winner receives a blockchain payout (2x stake GT) with proof on testnet explorer.

---

## 🕹️ Game Used

**Game:** Tic-Tac-Toe *(Demo: Easily replaceable with any 2-player web game!)*  
**Source:** Custom logic in `/frontend/game.js`, inspired by public JS implementations.

---

## ⚡ Architecture Overview

- **Smart Contracts (Solidity, Remix):**  
  - `DummyUSDT.sol` (test token, 6 decimals)
  - `GameToken.sol` (ERC20, 18 decimals)
  - `TokenStore.sol` (USDT→GT, onramping)
  - `PlayGame.sol` (match, stake, payout)

- **Backend (Node.js + Express + Socket.IO):**
  - `/backend/server.js` — serves REST API and handles events
  - `/backend/matchmaking.js` — real-time live player matching and basic game logic
  - `/backend/blockchain.js` — ethers.js-based interaction with contracts

- **Frontend (HTML + Vanilla JS):**
  - `index.html` — Connect wallet, buy GT, matchmaking, game UI, status & explorer link
  - `config.js` — Contract addresses & ABIs (edit this for your deployments)
  - `blockchain.js` — On-chain interaction (buy, approve, stake)
  - `socket.js` — Real-time events: match, move, state
  - `game.js` — Game rendering and inputs (Tic-Tac-Toe logic)
  - `style.css` — Modern, dark, responsive look

---

## 🎮 Full System Flow

1. **Connect MetaMask (Sepolia):** UI shows wallet address & token balances
2. **Buy GT:** USDT approve → buy() → GT received, balances update
3. **Find Match:** Enter stake, auto-match with peer via backend queue
4. **Stake:** Both approve/stake GT on-chain. Game unlocks after both stake.
5. **Play Game:** Live Tic-Tac-Toe (or chosen game). Moves synced via Socket.IO.
6. **Result & Payout:** Winner is determined, backend triggers PlayGame.commitResult() and winner receives 2x stake GT.  
7. **Proof & Explorer Links:** UI shows transaction hash/es, with link to Sepolia Etherscan.

---

## 🚀 How to Run Locally

### 1. **Contracts**
- Deploy all contracts in Remix IDE (DummyUSDT, GameToken, TokenStore, PlayGame)
- Save all contract addresses for `.env` and `frontend/config.js`
- Mint DummyUSDT in Remix to both testing wallets (some for each player account).
- Set required contract links (GameToken.setTokenStore, etc).

### 2. **Backend**
```bash
cd backend
npm install
# Edit .env with contract addresses, INFURA_URL, wallet key
node server.js
# → Should show: "Server running on port 4000"