let currentMatchId, mySymbol, gameState = Array(9).fill(null);

function startGame(matchId, players) {
  currentMatchId = matchId;
  mySymbol = (players[0] === userAddress) ? "X" : "O";
  gameState = Array(9).fill(null);

  const area = document.getElementById('gameArea');
  area.innerHTML = '<div id="tictactoeInfo" style="margin-bottom:10px;"></div>' +
                   '<div class="board" id="board"></div>' +
                   '<button onclick="location.reload()">Back to Lobby</button>';

  renderBoard();
  document.getElementById('tictactoeInfo').innerText = "Your symbol: " + mySymbol;
}

function renderBoard() {
  const board = document.getElementById('board');
  board.innerHTML = "";
  gameState.forEach((cell, idx) => {
    const el = document.createElement('div');
    el.className = 'cell' + (cell ? ' active' : '');
    el.innerText = cell || '';
    el.onclick = function() { handleMove(idx); };
    board.appendChild(el);
  });
}

function handleMove(idx) {
  if (gameState[idx] || !isMyTurn()) return;
  socket.emit('gameMove', { matchId: currentMatchId, move: idx });
}

function updateGameUI({ gameState: state, nextTurn }) {
  gameState = state;
  renderBoard();
  document.getElementById('tictactoeInfo').innerText = 
    (isMyTurn() ? "Your turn" : "Opponent's turn");
}

function isMyTurn() {
  // You need to define this based on your backend logic
  // In a real implementation, pass down whose turn from server
  return true; // (simple demo - let both click)
}

function showGameResult({ winner, txHash }) {
  document.getElementById('tictactoeInfo').innerHTML = 
    (winner === userAddress ? "🎉 You win!" : "Opponent wins.") +
    `<br><a href="https://sepolia.etherscan.io/tx/${txHash}" target="_blank">View payout Tx</a>`;
}