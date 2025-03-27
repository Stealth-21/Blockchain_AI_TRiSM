// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

contract FinancialTransaction {
    address public owner;
    uint256 public transactionCount;

    event TransactionExecuted(address indexed from, address indexed to, uint256 amount);
    event Deposit(address indexed from, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    function sendINR(address payable recipient) external payable {
        require(msg.value > 0, "Amount must be greater than zero");
        recipient.transfer(msg.value);
        transactionCount++;
        emit TransactionExecuted(msg.sender, recipient, msg.value);
    }

    function deposit() external payable {
        require(msg.value > 0, "Deposit must be greater than zero");
        emit Deposit(msg.sender, msg.value);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function withdraw(uint256 amount) external {
        require(msg.sender == owner, "Only owner can withdraw");
        require(amount <= address(this).balance, "Insufficient balance");
        payable(owner).transfer(amount);
    }

    function batchSendINR(address payable[] calldata recipients, uint256[] calldata amounts) external payable {
        require(recipients.length == amounts.length, "Length mismatch");
        uint256 total = 0;
        for(uint i = 0; i < amounts.length; i++){
            total += amounts[i];
        }
        require(msg.value >= total, "Insufficient funds provided");
        for(uint i = 0; i < recipients.length; i++){
            recipients[i].transfer(amounts[i]);
            emit TransactionExecuted(msg.sender, recipients[i], amounts[i]);
        }
        transactionCount += recipients.length;
    }
}
