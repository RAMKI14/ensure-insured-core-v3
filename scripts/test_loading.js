async function main() {
  console.log("Hardhat environment loaded successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
