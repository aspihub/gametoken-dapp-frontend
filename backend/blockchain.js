const { ethers } = require("ethers");
require('dotenv').config();


const provider = new ethers.providers.JsonRpcProvider(process.env.INFURA_URL);
const operatorWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// ADD your ABIs in backend folder as JSON:
const playGameAbi = require('./abi/PlayGame.json');
const tokenStoreAbi = require('./abi/TokenStore.json');

const tokenStore = new ethers.Contract(process.env.TOKENSTORE_ADDRESS, tokenStoreAbi, operatorWallet);
const playGame = new ethers.Contract(process.env.PLAYGAME_ADDRESS, playGameAbi, operatorWallet);

async function buyTokens(userAddress, usdtAmount) {
    // Usually frontend signs, backend can relay for users if required
    return tokenStore.buy(usdtAmount, { from: userAddress });
}

async function createMatch(matchId, p1, p2, stakeAmount) {
    return playGame.createMatch(matchId, p1, p2, stakeAmount);
}

async function commitResult(matchId, winner) {
    return playGame.commitResult(matchId, winner);
}

module.exports = { buyTokens, createMatch, commitResult };