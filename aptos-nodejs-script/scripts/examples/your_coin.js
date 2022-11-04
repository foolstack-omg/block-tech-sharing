// Copyright (c) Aptos
// SPDX-License-Identifier: Apache-2.0

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const NODE_URL = process.env.APTOS_NODE_URL || "https://fullnode.devnet.aptoslabs.com";
const FAUCET_URL = process.env.APTOS_FAUCET_URL || "https://faucet.devnet.aptoslabs.com";

const { AptosAccount, AptosClient, TxnBuilderTypes, MaybeHexString, HexString, FaucetClient } = require("aptos");
/**
  This example depends on the MoonCoin.move module having already been published to the destination blockchain.

  One method to do so is to use the CLI:
      * Acquire the Aptos CLI, see https://aptos.dev/cli-tools/aptos-cli-tool/install-aptos-cli
      * `yarn your_coin ~/aptos-core/aptos-move/move-examples/moon_coin`.
      * Open another terminal and `aptos move compile --package-dir ~/aptos-core/aptos-move/move-examples/moon_coin --save-metadata --named-addresses MoonCoin=<Alice address from above step>`.
      * Return to the first terminal and press enter.
 */

const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

class CoinClient extends AptosClient {
  constructor() {
    super(NODE_URL);
  }

  /** Register the receiver account to receive transfers for the new coin. */
  async registerCoin(coinTypeAddress, coinReceiver) {
    const rawTxn = await this.generateTransaction(coinReceiver.address(), {
      function: "0x1::managed_coin::register",
      type_arguments: [`${coinTypeAddress.hex()}::moon_coin::MoonCoin`],
      arguments: [],
    });

    const bcsTxn = await this.signTransaction(coinReceiver, rawTxn);
    const pendingTxn = await this.submitTransaction(bcsTxn);

    return pendingTxn.hash;
  }

  /** Mints the newly created coin to a specified receiver address */
  async mintCoin(minter, receiverAddress, amount) {
    const rawTxn = await this.generateTransaction(minter.address(), {
      function: "0x1::managed_coin::mint",
      type_arguments: [`${minter.address()}::moon_coin::MoonCoin`],
      arguments: [receiverAddress.hex(), amount],
    });

    const bcsTxn = await this.signTransaction(minter, rawTxn);
    const pendingTxn = await this.submitTransaction(bcsTxn);

    return pendingTxn.hash;
  }

  /** Return the balance of the newly created coin */
  async getBalance(accountAddress, coinTypeAddress) {
    try {
      const resource = await this.getAccountResource(
        accountAddress,
        `0x1::coin::CoinStore<${coinTypeAddress.hex()}::moon_coin::MoonCoin>`,
      );

      return parseInt((resource.data)["coin"]["value"]);
    } catch (_) {
      return 0;
    }
  }
}

/** run our demo! */
async function main() {
  assert(process.argv.length == 3, "Expecting an argument that points to the moon_coin directory.");

  const client = new CoinClient();
  const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);

  // Create two accounts, Alice and Bob, and fund Alice but not Bob
  const alice = new AptosAccount(new HexString(process.env.MAIN_WALLET_PRIVATE_KEY).toUint8Array());
  const bob = new AptosAccount(new HexString(process.env.BOB_WALLET_PRIVATE_KEY).toUint8Array()); // <:!:section_2

  console.log("\n=== Addresses ===");
  console.log(`Alice: ${alice.address()}`);
  console.log(`Bob: ${bob.address()}`);

  await faucetClient.fundAccount(alice.address(), 100_000_000);
  await faucetClient.fundAccount(bob.address(), 100_000_000);

  await new Promise((resolve) => {
    readline.question("Update the module with Alice's address, compile, and press enter.", () => {
      resolve();
      readline.close();
    });
  });

  // :!:>publish
  const modulePath = process.argv[2];
  const packageMetadata = fs.readFileSync(path.join(modulePath, "build", "Examples", "package-metadata.bcs"));
  const moduleData = fs.readFileSync(path.join(modulePath, "build", "Examples", "bytecode_modules", "moon_coin.mv"));

  console.log("Publishing MoonCoin package.");
  let txnHash = await client.publishPackage(alice, new HexString(packageMetadata.toString("hex")).toUint8Array(), [
    new TxnBuilderTypes.Module(new HexString(moduleData.toString("hex")).toUint8Array()),
  ]);
  await client.waitForTransaction(txnHash, { checkSuccess: true }); // <:!:publish

  console.log("Bob registers the newly created coin so he can receive it from Alice");
  txnHash = await client.registerCoin(alice.address(), bob);
  await client.waitForTransaction(txnHash, { checkSuccess: true });
  console.log(`Bob's initial MoonCoin balance: ${await client.getBalance(bob.address(), alice.address())}.`);

  console.log("Alice mints Bob some of the new coin.");
  txnHash = await client.mintCoin(alice, bob.address(), 100);
  await client.waitForTransaction(txnHash, { checkSuccess: true });
  console.log(`Bob's updated MoonCoin balance: ${await client.getBalance(bob.address(), alice.address())}.`);
}

if (require.main === module) {
  main().then((resp) => console.log(resp));
}
