async function main() {
  const FinancialTransaction = await ethers.getContractFactory("FinancialTransaction");
  const contract = await FinancialTransaction.deploy();
  await contract.deployTransaction.wait();
  console.log("FinancialTransaction deployed to:", contract.address);
}
main().then(() => process.exit(0)).catch(error => {
  console.error(error);
  process.exit(1);
});
// SPDX-License-Identifier: MIT