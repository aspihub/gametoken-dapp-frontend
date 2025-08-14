const { v4: uuidv4 } = require('uuid');
const { createMatch, commitResult } = require('./blockchain');

class Matchmaking {
    constructor(io) {
        this.io = io;
        this.queue = {}; // stake (string) → [ waiting sockets ]
        this.matches = {}; // matchId → { players: [s1, s2], state }
    }

    handleConnection(socket) {
        socket.on('joinQueue', async ({ address, stake }) => {
            if (!this.queue[stake]) this.queue[stake] = [];
            socket.address = address;
            socket.stake = stake;

            if (this.queue[stake].length > 0) {
                // Match found!
                const opponent = this.queue[stake].shift();
                const matchId = uuidv4();
                // Register match on-chain
                await createMatch(matchId, opponent.address, address, stake);
                this.matches[matchId] = {
                    players: [opponent, socket],
                    state: Array(9).fill(null), // for tic-tac-toe
                    next: 0
                };
                opponent.join(matchId);
                socket.join(matchId);

                // Notify both clients
                this.io.to(matchId).emit('matchFound', {
                    matchId,
                    players: [opponent.address, address],
                    stake
                });
            } else {
                this.queue[stake].push(socket);
                socket.emit('waitingForOpponent');
            }
        });
    }

    handleStake(socket, matchId, address) {
        const match = this.matches[matchId];
        if (!match) return;
        if (!match.staked) match.staked = {};
        match.staked[address] = true;

        if (Object.keys(match.staked).length === 2) {
            // Both staked, start game
            this.io.to(matchId).emit('gameReady', { matchId, players: match.players.map(s => s.address) });
        }
    }

    handleGameMove(socket, matchId, move) {
        const match = this.matches[matchId];
        if (!match) return;
        const idx = match.players.findIndex(s => s.id === socket.id);

        if (idx !== match.next) return; // Not this player's turn

        if (match.state[move] != null) return; // Already marked

        match.state[move] = idx === 0 ? 'X' : 'O';
        match.next = 1 - match.next;

        // Broadcast move state to both players
        this.io.to(matchId).emit('moveMade', {
            gameState: match.state,
            nextTurn: match.players[match.next].address
        });

        // Check winner
        const winPatterns = [
            [0,1,2],[3,4,5],[6,7,8],
            [0,3,6],[1,4,7],[2,5,8],
            [0,4,8],[2,4,6]
        ];
        let winner = null;
        for (const pat of winPatterns) {
            if (
                match.state[pat[0]] &&
                match.state[pat[0]] === match.state[pat[1]] &&
                match.state[pat[1]] === match.state[pat[2]]
            ) {
                winner = match.players[ match.state[pat[0]] === 'X' ? 0 : 1 ].address;
                break;
            }
        }
        if (!winner && match.state.every(cell => cell)) {
            // Draw
        }

        if (winner) {
            // Pay winner
            commitResult(matchId, winner)
                .then((tx) => {
                    this.io.to(matchId).emit('gameEnded', {
                        winner,
                        txHash: tx.hash
                    });
                });
        }
    }
}

module.exports = Matchmaking;