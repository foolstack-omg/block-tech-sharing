const { JsonRpcProvider, Network, Ed25519Keypair, RawSigner } = require('@mysten/sui.js');
const dotenv = require("dotenv");
dotenv.config();

async function main() {
    // connect to Devnet
    const provider = new JsonRpcProvider(Network.DEVNET);

    // Signer
    const keypair = Ed25519Keypair.deriveKeypair(process.env.MAIN_MNEMONICS);
    const signer = new RawSigner(keypair, provider);
    const sui_address = keypair.getPublicKey().toSuiAddress();
    // get tokens from the DevNet faucet server
    await provider.requestSuiFromFaucet(
      sui_address
    );

    // const objects = await provider.getObjectsOwnedByAddress(
    //     '0x7ca7b6f541123fc4b45679193cb03ce176d14fc7'
    // );
    // console.log(objects)



    // const transferTxn = await signer.transferObject({
    //     objectId: '0xfae70303a3e7a54f3ccd1af510dab1be86e58e81',
    //     gasBudget: 1000,
    //     recipient: '0xd84058cb73bdeabe123b56632713dcd65e1a6c92',
    // });
    // console.log('transferTxn', transferTxn);

    let gasCost = await signer.getGasCostEstimation({
      kind: 'moveCall',
      data: {
        packageObjectId: '0x2',
        module: 'devnet_nft',
        function: 'mint',
        typeArguments: [],
        arguments: [
          '',
          '',
          '',
        ],
        gasBudget: 10000,
      }
    });
    console.log(gasCost)

    // let effects = await signer.dryRunTransaction({
    //   kind: 'moveCall',
    //   data: {
    //     packageObjectId: '0x2',
    //     module: 'devnet_nft',
    //     function: 'mint',
    //     typeArguments: [],
    //     arguments: [
    //       '',
    //       '',
    //       '',
    //     ],
    //     gasBudget: 10000,
    //   }
    // })
    // console.log(JSON.stringify(effects))

    /** effects
     * {
    "status":{
        "status":"success"
    },
    "gasUsed":{
        "computationCost":193,
        "storageCost":29,
        "storageRebate":16
    },
    "transactionDigest":"14jYKsy3Ry3fw4wDVsxhyX4gZWQcK5wTYEKgxsx3JoE3",
    "created":[
        {
            "owner":{
                "AddressOwner":"0x7ca7b6f541123fc4b45679193cb03ce176d14fc7"
            },
            "reference":{
                "objectId":"0xc6873173ee38c756e65468c6e16c52d5e46e9774",
                "version":1317,
                "digest":"X4vZDB6SbB9vtdTIW6cDlp8DsucHqE+5PwgPwQpo2LY="
            }
        }
    ],
    "mutated":[
        {
            "owner":{
                "AddressOwner":"0x7ca7b6f541123fc4b45679193cb03ce176d14fc7"
            },
            "reference":{
                "objectId":"0x310245d85e673b25687947e2dc87b663a987ad8e",
                "version":1317,
                "digest":"OHlTY4KdoYtB0UWSwspWt+R8XGmY40e6TO0YkvPzn9M="
            }
        }
    ],
    "gasObject":{
        "owner":{
            "AddressOwner":"0x7ca7b6f541123fc4b45679193cb03ce176d14fc7"
        },
        "reference":{
            "objectId":"0x310245d85e673b25687947e2dc87b663a987ad8e",
            "version":1317,
            "digest":"OHlTY4KdoYtB0UWSwspWt+R8XGmY40e6TO0YkvPzn9M="
        }
    },
    "events":[
        {
            "coinBalanceChange":{
                "packageId":"0x0000000000000000000000000000000000000002",
                "transactionModule":"gas",
                "sender":"0x7ca7b6f541123fc4b45679193cb03ce176d14fc7",
                "changeType":"Gas",
                "owner":{
                    "AddressOwner":"0x7ca7b6f541123fc4b45679193cb03ce176d14fc7"
                },
                "coinType":"0x2::sui::SUI",
                "coinObjectId":"0x310245d85e673b25687947e2dc87b663a987ad8e",
                "version":1316,
                "amount":-206
            }
        },
        {
            "newObject":{
                "packageId":"0x0000000000000000000000000000000000000002",
                "transactionModule":"devnet_nft",
                "sender":"0x7ca7b6f541123fc4b45679193cb03ce176d14fc7",
                "recipient":{
                    "AddressOwner":"0x7ca7b6f541123fc4b45679193cb03ce176d14fc7"
                },
                "objectType":"0x2::devnet_nft::DevNetNFT",
                "objectId":"0xc6873173ee38c756e65468c6e16c52d5e46e9774",
                "version":1317
            }
        },
        {
            "moveEvent":{
                "packageId":"0x0000000000000000000000000000000000000002",
                "transactionModule":"devnet_nft",
                "sender":"0x7ca7b6f541123fc4b45679193cb03ce176d14fc7",
                "type":"0x2::devnet_nft::MintNFTEvent",
                "fields":{
                    "creator":"0x7ca7b6f541123fc4b45679193cb03ce176d14fc7",
                    "name":"",
                    "object_id":"0xc6873173ee38c756e65468c6e16c52d5e46e9774"
                },
                "bcs":"xocxc+44x1bmVGjG4WxS1eRul3R8p7b1QRI/xLRWeRk8sDzhdtFPxwA="
            }
        }
    ],
    "dependencies":[
        "125kiR626stqNiNg3DBRb6apuB3zVFbsKFeaYb2s8Wpj",
        "GQZFkBzqwhA9tyXx1Up1XSRHtdSqmXW1j9pnEEoVE82Z"
    ]
}
     */
    
    
    const moveCallTxn = await signer.executeMoveCall({
        packageObjectId: '0x2',
        module: 'devnet_nft',
        function: 'mint',
        typeArguments: [],
        arguments: [
          '',
          '',
          '',
        ],
        gasBudget: 10000,
      });
      console.log('moveCallTxn', moveCallTxn);
}

main()