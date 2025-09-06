import { config } from "dotenv";
import { createStacksWalletAgent, StacksUtils } from "../index";
import { createNetwork } from "@stacks/network";

// Load environment variables
config();

// Example usage of the Stacks Agent Kit
async function swapExample() {
    console.log("💱 Getting swap quote for STX to xBTC...");

    // Create a custom network
    const network = createNetwork({
        network: "testnet",
        client: {
            baseUrl: "https://stacks-node-api.testnet.alexlab.co"
        }
    });

    // Override the baseUrl to ensure it's used
    network.client.baseUrl = "https://stacks-node-api.testnet.alexlab.co";

    const agent = await createStacksWalletAgent({
        network: "testnet"
    });

    const quoteResult = await agent.getSwapQuote({
        fromPrivateKey: process.env.STACKS_WALLET_A_PRIVATE_KEY || '',
        amount: "5.0", // Swap 10 STX
        slippageTolerance: 0.5, // 0.5% slippage tolerance
    });

    if (quoteResult.success && quoteResult.data) {
        console.log("✅ Swap Quote:");
        console.log(
            `   Expected output: ${quoteResult.data.expectedOutput} xBTC`
        );
        console.log(
            `   Minimum output: ${quoteResult.data.minimumOutput} xBTC`
        );
        console.log(`   Fee: ${quoteResult.data.fee} STX`);
        console.log(`   Price impact: ${quoteResult.data.priceImpact}%`);

        // Execute the swap if quote looks good
        console.log("\n💱 Executing STX to xBTC swap...");
        const swapResult = await agent.swapSTXForXBTC({
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
  