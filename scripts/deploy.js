async function main() {
  const ChainVote = await ethers.getContractFactory("ChainVote");
  console.log("Deploying ChainVote...");

  const contract = await ChainVote.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("ChainVote deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });