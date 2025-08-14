let provider, signer, userAddress;

async function connectWallet() {
  if (!window.ethereum) return alert('Install MetaMask!');
  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  signer = provider.getSigner();
  userAddress = await signer.getAddress();
  document.getElementById('wallet').innerText = 'Wallet: ' + userAddress.substring(0,6) + "..." + userAddress.slice(-4);
  await showBalances();
}

async function showBalances() {
  const usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, provider);
  const gt = new ethers.Contract(GT_ADDRESS, GT_ABI, provider);
  const usdtBal = await usdt.balanceOf(userAddress);
  const gtBal = await gt.balanceOf(userAddress);
  document.getElementById('balances').innerText = 
    `USDT: ${(usdtBal/1e6).toFixed(2)}, GT: ${(gtBal/1e18).toFixed(2)}`;
}

async function buyGT() {
  const amount = document.getElementById('usdtAmount').value;
  if (!amount || isNaN(amount)) return;
  document.getElementById('status').innerText = 'Approving USDT...';
  const usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);
  const tx1 = await usdt.approve(TOKENSTORE_ADDRESS, ethers.utils.parseUnits(amount,6));
  await tx1.wait();
  document.getElementById('status').innerText = 'Buying GT...';
  const tokenStore = new ethers.Contract(TOKENSTORE_ADDRESS, TOKENSTORE_ABI, signer);
  const tx2 = await tokenStore.buy(ethers.utils.parseUnits(amount,6));
  await tx2.wait();
  document.getElementById('status').innerText = "GT purchased!";
  await showBalances();
}

window.connectWallet = connectWallet;
window.buyGT = buyGT;