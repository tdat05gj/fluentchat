const { ethers } = require("hardhat");
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying SecureMessaging contract to Fluent testnet...");

  // Get the contract factory
  const SecureMessaging = await ethers.getContractFactory("SecureMessaging");

  // Deploy the contract
  console.log("⏳ Deploying contract...");
  const secureMessaging = await SecureMessaging.deploy();

  // Wait for deployment to be mined
  await secureMessaging.waitForDeployment();

  const contractAddress = await secureMessaging.getAddress();
  console.log("✅ SecureMessaging deployed to:", contractAddress);

  // Get the contract ABI
  const artifact = await hre.artifacts.readArtifact("SecureMessaging");
  const abi = artifact.abi;

  // Create contract info object
  const contractInfo = {
    address: contractAddress,
    abi: abi,
    network: "fluent-testnet",
    chainId: 20994,
    deployedAt: new Date().toISOString(),
    explorerUrl: `https://testnet.fluentscan.xyz/address/${contractAddress}`
  };

  // Save contract info to frontend
  const frontendDir = path.join(__dirname, "..", "frontend", "src");
  const contractInfoPath = path.join(frontendDir, "contractInfo.json");

  // Ensure frontend/src directory exists
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }

  fs.writeFileSync(contractInfoPath, JSON.stringify(contractInfo, null, 2));

  console.log("📄 Contract info saved to:", contractInfoPath);
  console.log("🔗 Explorer URL:", contractInfo.explorerUrl);
  console.log("✨ Deployment completed successfully!");

  // Verify contract on explorer (optional - may need to be done manually)
  console.log("\n📋 To verify the contract on Fluent Explorer:");
  console.log(`1. Visit: https://testnet.fluentscan.xyz/address/${contractAddress}`);
  console.log("2. Go to 'Contract' tab and click 'Verify and Publish'");
  console.log("3. Upload the contract source code");

  return contractAddress;
}

main()
  .then((address) => {
    console.log(`\n🎉 Deployment successful! Contract address: ${address}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
