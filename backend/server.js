const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const { buyTokens, createMatch, commitResult } = require('./blockchain');
const Matchmaking = require('./matchmaking');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('../frontend'));

const matchmaking = new Matchmaking(io);

// ===== REST API ENDPOINTS =====

// Purchase GT using buy() (should be called by backend-admin only if acting as relayer, else handled on frontend)
app.post('/purchase', async (req, res) => {
    const { userAddress, usdtAmount } = req.body;
    try {
        const tx = await buyTokens(userAddress, usdtAmount);
        res.json({ txHash: tx.hash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Commit result from game server/operator
app.post('/match/result', async (req, res) => {
    const { matchId, winner } = req.body;
    try {
        const tx = await commitResult(matchId, winner);
        res.json({ txHash: tx.hash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== SOCKET.IO EVENTS =====
io.on('connection', (socket) => {
    matchmaking.handleConnection(socket);

    // Receive player game move from frontend
    socket.on('gameMove', ({ matchId, move }) => {
        matchmaking.handleGameMove(socket, matchId, move);
    });

    // Handle staked event after player stakes (if you want server confirmation)
    socket.on('staked', ({ matchId, address }) => {
        matchmaking.handleStake(socket, matchId, address);
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});