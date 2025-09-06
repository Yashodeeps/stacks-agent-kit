import { config } from "dotenv";
import { createStacksWalletAgent, StacksUtils } from "../index";

// Load environment variables
config();

// Example usage of the Stacks Agent Kit
async function swapExample() {
    console.log("💱 Getting swap quote for STX to sBTC...");

    const agent = await createStacksWalletAgent({
        network: process.env.STACKS_NETWORK as "testnet" | "mainnet",
    });

    const quoteResult = await agent.getSwapQuote({
        fromPrivateKey: process.env.STACKS_WALLET_A_PRIVATE_KEY || '',
        amount: "10.0", // Swap 10 STX
        slippageTolerance: 0.5, // 0.5% slippage tolerance
    });

    if (quoteResult.success && quoteResult.data) {
        console.log("✅ Swap Quote:");
        console.log(
            `   Expected output: ${quoteResult.data.expectedOutput} sBTC`
        );
        console.log(
            `   Minimum output: ${quoteResult.data.minimumOutput} sBTC`
        );
        console.log(`   Fee: ${quoteResult.data.fee} STX`);
        console.log(`   Price impact: ${quoteResult.data.priceImpact}%`);

        // Execute the swap if quote looks good
        console.log("\n💱 Executing STX to sBTC swap...");
        const swapResult = await agent.swapSTXForSBTC({
            fromPrivateKey: process.env.STACKS_WALLET_A_PRIVATE_KEY || '',
            amount: "10.0",
            slippageTolerance: 0.5,
        });

        if (swapResult.success) {
            console.log(
                `✅ Swap transaction submitted: ${swapResult.transactionId}`
            );
        } else {
            console.log("❌ Swap failed:", swapResult.error);
        }
    } else {
        console.log("❌ Failed to get swap quote:", quoteResult.error);
    }

    console.log("\n" + "=".repeat(50) + "\n");
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
    swapExample().catch(console.error);
  }
  
  export { swapExample };
  