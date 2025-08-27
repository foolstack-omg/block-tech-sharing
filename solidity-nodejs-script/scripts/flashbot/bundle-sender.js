import { ethers } from 'ethers';
import axios from 'axios';

// --- Configuration ---
// Private key for signing the bundle requests. This should have a balance to pay for the bundle.

const PRIVATE_KEY = "";

// Ethereum RPC URL. Using Alchemy as in the original script.
const RPC_URL = "https://eth-mainnet.g.alchemy.com/v2/ukgHj8a7XoZYoXtQlRdMQJCXFBKYKdFb";

// List of MEV builder RPC endpoints.
const BUILDERS = {
    "rsync": "https://rsync-builder.xyz",
    "beaverbuild.org": "https://rpc.beaverbuild.org",
    "Titan": "https://rpc.titanbuilder.xyz",
    "builder0x69": "https://builder0x69.io",
    "EigenPhi": "https://builder.eigenphi.io",
    "boba-builder": "https://boba-builder.com/searcher/bundle",
    "Gambit Labs": "https://builder.gmbit.co/rpc",
    "flashbots": "https://relay.flashbots.net", // For simulation and sending
    "f1b.io": "https://rpc.f1b.io",
    "payload": "https://rpc.payload.de",
    "Loki": "https://rpc.lokibuilder.xyz",
    "BuildAI": "https://buildai.net",
    "JetBuilder": "https://rpc.mevshare.jetbldr.xyz",
    "tbuilder": "https://flashbots.rpc.tbuilder.xyz",
    "penguinbuild": "https://rpc.penguinbuild.org",
    "bobthebuilder": "https://rpc.bobthebuilder.xyz",
    "BTCS": "https://rpc.btcs.com",
    "Eden Network": "https://api.edennetwork.io/v1/bundle",
    "eth-builder": "https://eth-builder.com",
};

// --- Ethers.js Setup ---
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);

/**
 * Signs a JSON-RPC request body for Flashbots.
 * The signature is required in the X-Flashbots-Signature header.
 * This replicates the signing logic from the Go example.
 * @param {object} body The JSON-RPC request body.
 * @returns {Promise<string>} The signature string in the format "address:signature".
 */
async function signRequestBody(body) {
    const bodyJson = JSON.stringify(body);
    const encoder = new TextEncoder();
    const requestBodyHash = ethers.utils.keccak256(encoder.encode(bodyJson));
    const signature = await signer.signMessage(requestBodyHash);
    return `${signer.address}:${signature}`;
}

/**
 * Simulates a bundle of transactions using mev_simBundle.
 * @param {string[]} rawTxs Array of raw transaction hex strings.
 * @param {number} targetBlock The target block number for simulation.
 * @returns {Promise<boolean>} True if the simulation was successful, false otherwise.
 */
async function simBundle(rawTxs, targetBlock) {
    console.log(`\n--- Simulating Bundle for Block ${targetBlock} ---`);
    const body = {
        jsonrpc: "2.0",
        id: 1,
        method: "mev_simBundle",
        params: [{
            version: "beta-1",
            inclusion: {
                block: `0x${targetBlock.toString(16)}`,
            },
            body: [{
                tx: rawTxs[0],
                canRevert: false,
            }, {
                tx: rawTxs[1],
                canRevert: false,
            }],
        }, ],
    };

    const signature = await signRequestBody(body);
    const headers = {
        'Content-Type': 'application/json',
        'X-Flashbots-Signature': signature,
    };

    try {
        const response = await axios.post(BUILDERS.flashbots, body, { headers });
        console.log("Simulation result:", JSON.stringify(response.data, null, 2));
        return response.data?.result?.success || false;
    } catch (error) {
        console.error("Error simulating bundle:", error.response ? error.response.data : error.message);
        return false;
    }
}

/**
 * Sends a bundle of transactions to all configured builders.
 * @param {string[]} rawTxs Array of raw transaction hex strings.
 * @param {number} targetBlock The target block number for the bundle.
 */
async function sendBundle(rawTxs, targetBlock) {
    console.log(`\n--- Sending Bundle for Block ${targetBlock} ---`);
    const body = {
        jsonrpc: "2.0",
        id: 1,
        method: "eth_sendBundle",
        params: [{
            txs: rawTxs,
            blockNumber: `0x${targetBlock.toString(16)}`,
        }, ],
    };

    const signature = await signRequestBody(body);
    // signature = "0x756576cD839252Ba6ecC1b54FcCb7B58D7654321:0xbfeb02d694415c47e4c358097766002166cf9f62dfd656795e358be2dd4742d15a361e9a6eb97d576cb4acc449186fa25491409cc1258214e6fc41f3e86aaf551c"
    const headers = {
        'Content-Type': 'application/json',
        'X-Flashbots-Signature': signature,
    };

    const builderEntries = Object.entries(BUILDERS);
    let count = 0;

    const promises = builderEntries.map(async ([name, url]) => {
        try {
            const response = await axios.post(url, body, { headers });
            count++;
            console.log(`[${count}/${builderEntries.length}] Sent to ${name}:`, response.data);
        } catch (error) {
            count++;
            console.error(`[${count}/${builderEntries.length}] Error sending to ${name}:`, error.response ? error.response.data : error.message);
        }
    });

    await Promise.all(promises);
}

/**
 * Waits for transactions to be included in a block.
 * @param {string[]} txHashes Array of transaction hashes to monitor.
 */
async function monitorTransactions(txHashes) {
    console.log("\n--- Monitoring for Transaction Inclusion ---");
    const receiptPromises = txHashes.map((hash, i) => {
        return new Promise(async (resolve) => {
            while (true) {
                try {
                    const receipt = await provider.getTransactionReceipt(hash);
                    if (receipt) {
                        console.log(`✅ Transaction ${i + 1} (${hash}) FOUND. Success: ${receipt.status === 1}`);
                        resolve(receipt);
                        return;
                    }
                    console.log(`⏳ Waiting for transaction ${i + 1} (${hash})...`);
                    // Wait for 4 seconds before retrying, as in the Go script.
                    await new Promise(r => setTimeout(r, 4000));
                } catch (e) {
                    console.error(`Error fetching receipt for ${hash}:`, e.message);
                    // Continue polling even on error, unless it's a fatal one.
                    await new Promise(r => setTimeout(r, 4000));
                }
            }
        });
    });
    await Promise.all(receiptPromises);
}


async function makeRawTx() {
    const account = new ethers.Wallet(PRIVATE_KEY);
    const nonce = await provider.getTransactionCount(account.address);
    const tx1 = {
        from: account.address,
        to: account.address,
        nonce,
        value: ethers.utils.parseEther("0"),
        gasPrice: ethers.utils.parseUnits("2", "gwei"),
        gasLimit: ethers.utils.parseUnits("21000", "wei"),
        chainId: 1,
    };
    const signedTx = await account.signTransaction(tx1);
    const tx2 = {
        from: account.address,
        to: account.address,
        nonce: nonce + 1,
        value: ethers.utils.parseEther("0"),
        gasPrice: ethers.utils.parseUnits("2", "gwei"),
        gasLimit: ethers.utils.parseUnits("21000", "wei"),
        chainId: 1,
    };
    const signedTx2 = await account.signTransaction(tx2);
    return [
        signedTx,
        signedTx2,
    ]
}

/**
 * Main execution function.
 */
async function main() {
    const rawTxs = await makeRawTx();
    const txHashes = rawTxs.map(tx => ethers.utils.keccak256(tx));
    txHashes.forEach((hash, i) => {
        console.log(`Transaction ${i + 1}: ${hash}`);
    });

    let currentBlock = await provider.getBlockNumber();
    let targetBlock = currentBlock + 1

    console.log(`\nCurrent Block: ${currentBlock}, Target Block: ${targetBlock}`);

    const simOk = await simBundle(rawTxs, currentBlock + 1);
    if (!simOk) {
        console.error("Bundle simulation failed. Exiting.");
        process.exit(1);
    }
    console.log("✅ Bundle simulation successful.");

    let isQuerying = false;
    sendBundle(rawTxs, currentBlock + 1);

    const interval = setInterval(async () => {
        try {
            currentBlock = await provider.getBlockNumber();
            console.log(`Current: ${currentBlock}, Target: ${targetBlock}`);

            if (currentBlock >= targetBlock) {
                monitorTransactions(txHashes).then(() => {
                    console.log("\n🎉 All transactions have been confirmed!");
                    clearInterval(interval);
                    process.exit(0);
                });
            }

            if (currentBlock > targetBlock + 1) {
                console.log("\n❌ Max target block reached, but transactions were not found.");
                clearInterval(interval);
                process.exit(1);
            }
        } catch (error) {
            console.error("An error occurred in the main loop:", error.message);
        }
    }, 1200);
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});