const hre = require("hardhat");

async function main() {
  const contractAddress = "0xA181b17eA8e7DA2798145340728024F132EF72Ea";
  
  console.log("🔍 Starting contract verification...");
  console.log(`📍 Contract Address: ${contractAddress}`);
  console.log(`🌐 Network: ${hre.network.name}`);
  console.log(`⚡ Chain ID: ${hre.network.config.chainId}`);

  try {
    // Verify the contract
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [], // No constructor arguments
      contract: "contracts/SecureMessaging.sol:SecureMessaging",
    });

    console.log("✅ Contract verified successfully!");
    console.log(`🔗 View on Fluent Explorer: https://testnet.fluentscan.xyz/address/${contractAddress}`);
    
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("ℹ️  Contract is already verified!");
      console.log(`🔗 View on Fluent Explorer: https://testnet.fluentscan.xyz/address/${contractAddress}`);
    } else {
      console.error("❌ Verification failed:", error.message);
      
      // Provide helpful troubleshooting info
      console.log("\n🛠️ Troubleshooting tips:");
      console.log("1. Make sure the contract source code matches exactly");
      console.log("2. Check if the contract was deployed with the same compiler version (0.8.19)");
      console.log("3. Verify the optimization settings match (runs: 200)");
      console.log("4. Ensure the network configuration is correct");
      
      // Try alternative verification method
      console.log("\n🔄 Attempting alternative verification...");
      
      try {
        await hre.run("verify:verify", {
          address: contractAddress,
          constructorArguments: [],
        });
        console.log("✅ Alternative verification successful!");
      } catch (altError) {
        console.error("❌ Alternative verification also failed:", altError.message);
      }
    }
  }
}

// Handle script execution
main()
  .then(() => {
    console.log("\n🎉 Verification process completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script execution failed:");
    console.error(error);
    process.exit(1);
  });
