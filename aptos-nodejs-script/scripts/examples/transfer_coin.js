// Copyright (c) Aptos
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable no-console */

const dotenv = require("dotenv") ;
dotenv.config();

const { AptosClient, AptosAccount, CoinClient, FaucetClient, HexString, TxnBuilderTypes,
  TransactionBuilder } = require("aptos");
const NODE_URL = process.env.NODE_URL || "";
const FAUCET_URL = process.env.FAUCET_URL || "";

(async () => {
  console.log(NODE_URL)
  // Create API and faucet clients.
  // :!:>section_1
  const client = new AptosClient(NODE_URL);
  const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL); // <:!:section_1

  // Create client for working with the coin module.
  // :!:>section_1a
  const coinClient = new CoinClient(client); // <:!:section_1a

  // Create accounts.
  // :!:>section_2
  const alice = new AptosAccount(new HexString(process.env.MAIN_WALLET_PRIVATE_KEY).toUint8Array());
  const bob = new AptosAccount(undefined, "0x2f0434fe778ae6f330e8ddef05ed391e7dad5683785b95c6903adf01f9c05f3a"); // <:!:section_2

  // Print out account addresses.
  console.log("=== Addresses ===");
  console.log(`Alice: ${alice.address()}`);
  console.log(`Bob: ${bob.address()}`);
  console.log("");

  // // Fund accounts.
  // // :!:>section_3
  await faucetClient.fundAccount(alice.address(), 100_000_000);
  await faucetClient.fundAccount(bob.address(), 0); // <:!:section_3

  // Print out initial balances.
  console.log("=== Initial Balances ===");
  // :!:>section_4
  console.log(`Alice: ${await coinClient.checkBalance(alice)}`);
  console.log(`Bob: ${await coinClient.checkBalance(bob)}`); // <:!:section_4
  console.log("");

  // Have Alice send Bob some AptosCoins.
  // :!:>section_5
  let txnHash = await coinClient.transfer(alice, bob, 1_000, { gasUnitPrice: BigInt(100) }); // <:!:section_5
  // :!:>section_6a
  await client.waitForTransaction(txnHash); // <:!:section_6a

  // Print out intermediate balances.
  console.log("=== Intermediate Balances ===");
  console.log(`Alice: ${await coinClient.checkBalance(alice)}`);
  console.log(`Bob: ${await coinClient.checkBalance(bob)}`);
  console.log("");

  // Have Alice send Bob some more AptosCoins.
  txnHash = await coinClient.transfer(alice, bob, 1_000, { gasUnitPrice: BigInt(100) });
  // :!:>section_6b
  await client.waitForTransaction(txnHash, { checkSuccess: true }); // <:!:section_6b

  // Print out final balances.
  console.log("=== Final Balances ===");
  console.log(`Alice: ${await coinClient.checkBalance(alice)}`);
  console.log(`Bob: ${await coinClient.checkBalance(bob)}`);
  console.log("");
})();
