const socket = io();

window.joinQueue = function() {
  const stake = document.getElementById('stakeAmount').value;
  if (!userAddress || !stake) return alert("Connect wallet and enter stake");
  socket.emit('joinQueue', { address: userAddress, stake: ethers.utils.parseUnits(stake,18).toString() });
  document.getElementById('status').className = 'status-waiting';
  document.getElementById('status').innerText = 'Waiting for opponent...';
};

socket.on('waitingForOpponent', () => {
  document.getElementById('status').innerText = "Waiting for an opponent with same stake...";
});

socket.on('matchFound', ({ matchId, players, stake }) => {
  document.getElementById('status').innerText = "Match found! Both must stake GT.";
  promptStake(matchId, stake);
});

function promptStake(matchId, stake) {
  document.getElementById('status').innerText = "Approve and stake GT to start.";
  const gt = new ethers.Contract(GT_ADDRESS, GT_ABI, signer);
  const playGame = new ethers.Contract(PLAYGAME_ADDRESS, PLAYGAME_ABI, signer);
  const stakeAmount = ethers.utils.parseUnits(ethers.utils.formatUnits(stake,18), 18);

  gt.approve(PLAYGAME_ADDRESS, stakeAmount).then(tx => tx.wait()).then(() => {
    document.getElementById('status').innerText = "Staking GT...";
    return playGame.stake(matchId, stakeAmount);
  }).then(tx => tx.wait())
    .then(() => {
      document.getElementById('status').innerText = "Waiting for opponent to stake...";
      socket.emit('staked', { matchId, address: userAddress });
    })
    .catch(e => { document.getElementById('status').innerText = "Error: " + (e.reason || e.message); });
}

socket.on('gameReady', (data) => {
  document.getElementById('lobby').style.display = "none";
  document.getElementById('gameArea').style.display = "block";
  // Start game in gameArea
  startGame(data.matchId, data.players);
});

socket.on('moveMade', updateGameUI);
socket.on('gameEnded', showGameResult);