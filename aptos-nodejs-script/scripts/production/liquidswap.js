// Copyright (c) Aptos
// SPDX-License-Identifier: Apache-2.0

/**
 * 部署合约
 * 1. cd ~/aptos-core/aptos-move/move-examples/moon_coin
 * 2. aptos move compile --named-addresses MoonCoin=0x5e603a89cf690d7134cf2f24fdb16ba90c4f5686333721c12e835fb6c76bc7ba --save-metadata
 */
 const dotenv = require("dotenv") ;
 dotenv.config();
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const NODE_URL = process.env.MAIN_NODE_URL;
const FAUCET_URL = process.env.MAIN_NODE_URL;
const {SDK} = require('@pontem/liquidswap-sdk')

const { AptosAccount, AptosClient, TxnBuilderTypes, MaybeHexString, HexString, FaucetClient } = require("aptos");

const APTOS_COIN = "0x1::aptos_coin::AptosCoin"
const L0_USDC_COIN = "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC"
const L0_USDT_COIN = "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT"
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
  const client = new CoinClient();
  const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);

  // Create two accounts, Alice and Bob, and fund Alice but not Bob
  const alice = new AptosAccount(new HexString(process.env.MAIN_WALLET_PRIVATE_KEY).toUint8Array());
 
  console.log("\n=== Addresses ===");
  console.log(`${alice.address()}`);
  // await faucetClient.fundAccount(alice.address(), 100_000_000);

  const sdk = new SDK({
    nodeUrl: NODE_URL, // Node URL
    networkOptions: {
      nativeToken: APTOS_COIN, // Type of Native network token
      modules: {
        Scripts:
          '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts', // This module is used for Swap
        CoinInfo: '0x1::coin::CoinInfo', // Type of base CoinInfo module
        CoinStore: '0x1::coin::CoinStore', // Type of base CoinStore module
      },
    }
  })

  // Get BTC amount
  const amount = await sdk.Swap.calculateRates({
    fromToken: APTOS_COIN,
    toToken: L0_USDC_COIN,
    amount: 1000000, // 1 APTOS
    interactiveToken: 'from',
    pool: {
      address: '0x05a97986a9d031c4567e15b797be516910cfcb4156312482efc6a19c0a30c948',
      moduleAddress: '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12',
      lpToken: '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Uncorrelated'
    }
  })
  console.log(amount) // 1584723 (0.01584723 BTC)

  // Generate TX payload for swap 1 APTOS to maximum 0.01584723 BTC
  // and minimum 0.01584723 BTC - 5% (with slippage 5%)

  // 这里createSwapTransactionPayload的fromAmount和toAmount的滑点计算有问题
  const txPayload = sdk.Swap.createSwapTransactionPayload({
    fromToken: APTOS_COIN,
    toToken: L0_USDC_COIN,
    fromAmount: 1000000, // 1 APTOS,
    toAmount: amount, // 0.01584723 BTC,
    interactiveToken: 'from',
    slippage: 0.001, // 5% (1 - 100%, 0 - 0%)
    pool: {
      address: '0x05a97986a9d031c4567e15b797be516910cfcb4156312482efc6a19c0a30c948',
      moduleAddress: '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12',
      lpToken: '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Uncorrelated'
    }
  })
  // txPayload.type = 'entry_function_payload'
  // txPayload.arguments.splice(0, 1)
  console.log(txPayload);
  txPayload.arguments[2] = (amount * 997 /1000).toFixed() // 由于LiquidSwap的Sdk滑点计算有问题，自定义0滑点的数量
 

  
  const rawTxn = await client.generateTransaction(alice.address(), {
    function: txPayload.function,
    type_arguments: txPayload.typeArguments,
    arguments: txPayload.arguments.splice(1, 2),
  });

  let UserTransaction = await client.simulateTransaction(alice, rawTxn, {
    estimateGasUnitPrice: true,
    estimateMaxGasAmount: true
  })

  console.log(UserTransaction)

  // [
  //   {
  //     version: '6206164',
  //     hash: '0x3f2ec8bee18a38713d710785057f5147f3791d4d139b5c7c71712c54797a4ffe',
  //     state_change_hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
  //     event_root_hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
  //     state_checkpoint_hash: null,
  //     gas_used: '4718',
  //     success: true,
  //     vm_status: 'Executed successfully',
  //     accumulator_root_hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
  //     changes: [
  //       [Object], [Object],
  //       [Object], [Object],
  //       [Object], [Object],
  //       [Object], [Object]
  //     ],
  //     sender: '0x34f20a6efd68b2a8969d63bf614f0e29b070ac0d878c242f32781b0ca9aef292',
  //     sequence_number: '16',
  //     max_gas_amount: '297148',
  //     gas_unit_price: '100',
  //     expiration_timestamp_secs: '1666282485',
  //     payload: {
  //       function: '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts::swap',
  //       type_arguments: [Array],
  //       arguments: [Array],
  //       type: 'entry_function_payload'
  //     },
  //     signature: {
  //       public_key: '0x72ca9c898ac443652d06a20d7a6a460e4c3cf4e6ccf7ea8681f6abf909ed73c4',
  //       signature: '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
  //       type: 'ed25519_signature'
  //     },
  //     events: [ [Object], [Object], [Object], [Object], [Object] ],
  //     timestamp: '1666282463589152'
  //   }
  // ]
  // const bcsTxn = await client.signTransaction(alice, rawTxn);
  // const pendingTxn = await client.submitTransaction(bcsTxn);
  // await client.waitForTransaction(pendingTxn.hash, { checkSuccess: true });


}

if (require.main === module) {
  main().then((resp) => console.log(resp));
}
