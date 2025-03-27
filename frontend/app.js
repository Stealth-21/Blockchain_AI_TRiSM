window.addEventListener('load', async function() {
  const navTransaction = document.getElementById('navTransaction');
  const navCurrency = document.getElementById('navCurrency');
  const transactionContainer = document.getElementById('transactionContainer');
  const currencyContainer = document.getElementById('currencyContainer');

  navTransaction.addEventListener('click', () => {
    navTransaction.classList.add('active');
    navCurrency.classList.remove('active');
    transactionContainer.style.display = 'block';
    currencyContainer.style.display = 'none';
  });

  navCurrency.addEventListener('click', () => {
    navCurrency.classList.add('active');
    navTransaction.classList.remove('active');
    transactionContainer.style.display = 'none';
    currencyContainer.style.display = 'block';
    fetchLiveRates();
  });

  if(typeof window.ethereum === 'undefined'){
    alert('MetaMask is not installed.');
    return;
  }
  let provider = new ethers.BrowserProvider(window.ethereum);
  let signer = await provider.getSigner();
  // MANUAL: Insert deployed contract address below
  let contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
  let contractABI = [
    {"inputs":[],"stateMutability":"nonpayable","type":"constructor"},
    {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"TransactionExecuted","type":"event"},
    {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Deposit","type":"event"},
    {"inputs":[{"internalType":"address payable","name":"recipient","type":"address"}],"name":"sendINR","outputs":[],"stateMutability":"payable","type":"function"},
    {"inputs":[],"name":"deposit","outputs":[],"stateMutability":"payable","type":"function"},
    {"inputs":[],"name":"getBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"address payable[]","name":"recipients","type":"address[]"},{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"name":"batchSendINR","outputs":[],"stateMutability":"payable","type":"function"}
  ];
  let contract = new ethers.Contract(contractAddress, contractABI, signer);

  document.getElementById('connectButton').addEventListener('click', async function() {
    await provider.send("eth_requestAccounts", []);
    let userAddress = await signer.getAddress();
    document.getElementById('walletAddress').innerText = "Connected: " + userAddress;
  });

  document.getElementById('sendTxButton').addEventListener('click', async function() {
    let recipient = document.getElementById('recipient').value;
    let amount = document.getElementById('sendAmount').value;
    if(!ethers.isAddress(recipient)){
      alert("Invalid recipient address");
      return;
    }
    if(parseInt(amount) <= 0){
      alert("Amount must be greater than 0");
      return;
    }
    document.getElementById('txStatus').innerText = "Sending transaction...";
    try {
      let tx = await contract.sendINR(recipient, { value: ethers.BigNumber.from(amount) });
      document.getElementById('txStatus').innerText = "Transaction sent. Waiting for confirmation...";
      await tx.wait();
      document.getElementById('txStatus').innerText = "Transaction confirmed. Hash: " + tx.hash;
    } catch(e) {
      document.getElementById('txStatus').innerText = "Transaction failed: " + e.message;
    }
  });

  document.getElementById('scheduleTxButton').addEventListener('click', async function() {
    let schedRecipient = document.getElementById('schedRecipient').value;
    let schedAmount = document.getElementById('schedAmount').value;
    let schedDelay = document.getElementById('schedDelay').value;
    if(!ethers.isAddress(schedRecipient)){
      alert("Invalid recipient address");
      return;
    }
    if(parseInt(schedAmount) <= 0 || parseInt(schedDelay) < 0){
      alert("Enter valid amount and delay");
      return;
    }
    document.getElementById('schedStatus').innerText = "Transaction scheduled in " + schedDelay + " seconds...";
    setTimeout(async () => {
      try {
        let tx = await contract.sendINR(schedRecipient, { value: ethers.BigNumber.from(schedAmount) });
        await tx.wait();
        document.getElementById('schedStatus').innerText = "Scheduled transaction confirmed. Hash: " + tx.hash;
      } catch(e) {
        document.getElementById('schedStatus').innerText = "Scheduled transaction failed: " + e.message;
      }
    }, parseInt(schedDelay) * 1000);
  });

  document.getElementById('depositButton').addEventListener('click', async function() {
    let depositAmount = document.getElementById('depositAmount').value;
    if(parseInt(depositAmount) <= 0){
      alert("Deposit amount must be greater than 0");
      return;
    }
    document.getElementById('depositStatus').innerText = "Depositing funds...";
    try {
      let tx = await contract.deposit({ value: ethers.BigNumber.from(depositAmount) });
      document.getElementById('depositStatus').innerText = "Deposit sent. Waiting for confirmation...";
      await tx.wait();
      document.getElementById('depositStatus').innerText = "Deposit confirmed. Hash: " + tx.hash;
    } catch(e) {
      document.getElementById('depositStatus').innerText = "Deposit failed: " + e.message;
    }
  });

  document.getElementById('withdrawButton').addEventListener('click', async function() {
    let withdrawAmount = document.getElementById('withdrawAmount').value;
    if(parseInt(withdrawAmount) <= 0){
      alert("Withdraw amount must be greater than 0");
      return;
    }
    document.getElementById('withdrawStatus').innerText = "Initiating withdrawal...";
    try {
      let tx = await contract.withdraw(ethers.BigNumber.from(withdrawAmount));
      document.getElementById('withdrawStatus').innerText = "Withdrawal sent. Waiting for confirmation...";
      await tx.wait();
      document.getElementById('withdrawStatus').innerText = "Withdrawal confirmed. Hash: " + tx.hash;
    } catch(e) {
      document.getElementById('withdrawStatus').innerText = "Withdrawal failed: " + e.message;
    }
  });

  document.getElementById('getBalanceButton').addEventListener('click', async function() {
    try {
      let balance = await contract.getBalance();
      document.getElementById('contractBalance').innerText = "Contract Balance: " + balance.toString() + " Wei";
    } catch(e) {
      document.getElementById('contractBalance').innerText = "Error retrieving balance: " + e.message;
    }
  });

  contract.on("TransactionExecuted", (from, to, amount) => {
    let li = document.createElement('li');
    li.innerText = "Tx - From: " + from + " To: " + to + " Amount: " + amount.toString() + " Wei";
    document.getElementById('eventList').appendChild(li);
  });

  contract.on("Deposit", (from, amount) => {
    let li = document.createElement('li');
    li.innerText = "Deposit - From: " + from + " Amount: " + amount.toString() + " Wei";
    document.getElementById('eventList').appendChild(li);
  });

  async function fetchRates(base) {
    try {
      let response = await fetch(`https://open.er-api.com/v6/latest/${base}`);
      let data = await response.json();
      if(data.result === "success") {
        return data.rates;
      } else {
        throw new Error("Failed to fetch rates");
      }
    } catch(e) {
      console.error(e);
      return null;
    }
  }

  async function updateCurrencyTable(rates) {
    const tableBody = document.getElementById('currencyTable').getElementsByTagName('tbody')[0];
    tableBody.innerHTML = "";
    for (const [currency, rate] of Object.entries(rates)) {
      let row = document.createElement('tr');
      let cellCurrency = document.createElement('td');
      cellCurrency.innerText = currency;
      let cellRate = document.createElement('td');
      cellRate.innerText = rate;
      row.appendChild(cellCurrency);
      row.appendChild(cellRate);
      tableBody.appendChild(row);
    }
  }

  async function fetchLiveRates() {
    let fromCurrency = document.getElementById('fromCurrency').value;
    let rates = await fetchRates(fromCurrency);
    if(rates) {
      document.getElementById('liveRates').innerText = "Live Rates (Base: " + fromCurrency + ")";
      updateCurrencyTable(rates);
    } else {
      document.getElementById('liveRates').innerText = "Error fetching live rates";
    }
  }

  // Auto-update live rates every 10 seconds when in Currency mode
  setInterval(() => {
    if(currencyContainer.style.display !== 'none') {
      fetchLiveRates();
    }
  }, 10000);

  document.getElementById('convertButton').addEventListener('click', async function() {
    let amountInput = document.getElementById('amountInput').value;
    let fromCurrency = document.getElementById('fromCurrency').value;
    let toCurrency = document.getElementById('toCurrency').value;
    if(parseFloat(amountInput) <= 0) {
      alert("Enter a valid amount");
      return;
    }
    let rates = await fetchRates(fromCurrency);
    if(rates && rates[toCurrency]) {
      let converted = parseFloat(amountInput) * rates[toCurrency];
      document.getElementById('conversionResult').innerText = amountInput + " " + fromCurrency + " = " + converted.toFixed(2) + " " + toCurrency;
    } else {
      document.getElementById('conversionResult').innerText = "Conversion error";
    }
  });
});
