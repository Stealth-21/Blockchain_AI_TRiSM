pragma solidity ^0.8.0;
contract FinancialTransaction {
    address public owner;
    uint256 public transactionCount;
    event TransactionExecuted(address indexed from, address indexed to, uint256 amount);
    event Deposit(address indexed from, uint256 amount);
    constructor() { owner = msg.sender; }
    function sendINR(address payable recipient) public payable {
        require(msg.value > 0, "Amount must be greater than zero");
        recipient.transfer(msg.value);
        transactionCount++;
        emit TransactionExecuted(msg.sender, recipient, msg.value);
    }
    function deposit() public payable {
        require(msg.value > 0, "Deposit amount must be greater than zero");
        emit Deposit(msg.sender, msg.value);
    }
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
    function withdraw(uint256 amount) public {
        require(msg.sender == owner, "Only owner can withdraw");
        require(amount <= address(this).balance, "Insufficient balance");
        payable(owner).transfer(amount);
    }
}
