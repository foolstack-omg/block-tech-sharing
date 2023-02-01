const { JsonRpcProvider, Network, Ed25519Keypair, RawSigner } = require('@mysten/sui.js');
const dotenv = require("dotenv");
dotenv.config();

async function main() {
    // connect to Devnet
    const provider = new JsonRpcProvider(Network.DEVNET);


    // Signer
    const keypair = Ed25519Keypair.deriveKeypair(process.env.MAIN_MNEMONICS);
    const signer = new RawSigner(keypair, provider);
    

    /**
     * 调用自己部署的nft合约的代码
     * sui client publish ~/Documents/Projects/sui/sui-arbitrage/moves/examples/nft-example --gas 0x075b79fe933d366b44c1aedcbb8614e2d349e7cd --gas-budget 30000 --verify-dependencies
     * 合约部署成功后获取合约地址: Created Objects
     * (如何通过Menomanic引入已存在的账号到Sui client？ 通过这个指令`sui keytool import "${memonamic}" ed25519`)
     */
    /** 合约部署回执
     * Successfully verified dependencies on-chain against source.
----- Certificate ----
Transaction Hash: 9AxNwxte52ExiCQ17wVbSPWqAaegx1hh1ozMWc6RCM6T
Transaction Signature: AA==@Cu59jZSpmwWhWAISqA9rz+VayELyXYg6yWNdakPD4sSsIl2wDMC79mZSofQ8IGEzUv5tzFyy04PdN2pivwu2DQ==@YCtEgmDX/1tPUt4lqkvLBf0B4E5MonU4jUGV7oqJUBc=
Signed Authorities Bitmap: RoaringBitmap<[0, 1, 2]>
Transaction Kind : Publish
Sender: 0x7ca7b6f541123fc4b45679193cb03ce176d14fc7
Gas Payment: Object ID: 0x075b79fe933d366b44c1aedcbb8614e2d349e7cd, version: 0x686, digest: 0xaccea196c784f66e19305b43fabfd3ba208d68b64e2d60b82b8230d47018425f
Gas Price: 1
Gas Budget: 30000
----- Transaction Effects ----
Status : Success
Created Objects:
  - ID: 0x32c058abc5b0ea2fb617578872645ec82683a373 , Owner: Immutable
Mutated Objects:
  - ID: 0x075b79fe933d366b44c1aedcbb8614e2d349e7cd , Owner: Account Address ( 0x7ca7b6f541123fc4b45679193cb03ce176d14fc7 )
     */
    const moveCallTxn = await signer.executeMoveCall({
        packageObjectId: '0x32c058abc5b0ea2fb617578872645ec82683a373', // 部署完成后的合约地址
        module: 'devnet_nft',
        function: 'mint_to_sender',
        typeArguments: [],
        arguments: [
          'Hello',
          'Hello, World',
          '',
        ],
        gasBudget: 10000,
      });
      console.log('moveCallTxn', JSON.stringify(moveCallTxn));
    
    /**
     * {
    "EffectsCert":{
        "certificate":{
            "transactionDigest":"2aG2x98v588qEGu2dSNsJQUVA8U6pNwoUfEJYp19TJBq",
            "data":{
                "transactions":[
                    {
                        "Call":{
                            "package":{
                                "objectId":"0x32c058abc5b0ea2fb617578872645ec82683a373",
                                "version":1,
                                "digest":"M+C+Mkk6h/TjKusn86WFyUkD5FAc3WEQSBMbFCSwVto="
                            },
                            "module":"devnet_nft",
                            "function":"mint_to_sender",
                            "arguments":[
                                "Hello",
                                "Hello, World",
                                ""
                            ]
                        }
                    }
                ],
                "sender":"0x7ca7b6f541123fc4b45679193cb03ce176d14fc7",
                "gasPayment":{
                    "objectId":"0x075b79fe933d366b44c1aedcbb8614e2d349e7cd",
                    "version":1672,
                    "digest":"520AIJHZrxS9ef6IAy7ZJB2Y2etmIW8FQEUDK7qBhZs="
                },
                "gasPrice":1,
                "gasBudget":10000
            },
            "txSignature":"AGaTtpRvWHBZc0JRtuVI7xZw2wSMjNsZiFM99Ghr3oK8qp9GwmNBUrfyvU+IOuOn1/wv7xVEUzaKzOsklcAEewZgK0SCYNf/W09S3iWqS8sF/QHgTkyidTiNQZXuiolQFw==",
            "authSignInfo":{
                "epoch":61,
                "signature":"AaIiTv2110JVUvjRICPoAW7r655uaipkjPoVs9waXQriTE2X1ZwgQHV2b6TxM02OgA==",
                "signers_map":[
                    58,
                    48,
                    0,
                    0,
                    1,
                    0,
                    0,
                    0,
                    0,
                    0,
                    2,
                    0,
                    16,
                    0,
                    0,
                    0,
                    0,
                    0,
                    1,
                    0,
                    2,
                    0
                ]
            }
        },
        "effects":{
            "transactionEffectsDigest":"dph19WeQ1l/+r977IOayemEO9kvB7nowf5guJMVA7/k=",
            "effects":{
                "status":{
                    "status":"success"
                },
                "gasUsed":{
                    "computationCost":207,
                    "storageCost":31,
                    "storageRebate":16
                },
                "transactionDigest":"2aG2x98v588qEGu2dSNsJQUVA8U6pNwoUfEJYp19TJBq",
                "created":[
                    {
                        "owner":{
                            "AddressOwner":"0x7ca7b6f541123fc4b45679193cb03ce176d14fc7"
                        },
                        "reference":{
                            "objectId":"0x7725200b513b559f6d6740e403402e8a55a674b2",
                            "version":1673,
                            "digest":"086I++Sf2teV9x7Qr3NHNL3EK8HfN1rwmQ33yua3tLQ="
                        }
                    }
                ],
                "mutated":[
                    {
                        "owner":{
                            "AddressOwner":"0x7ca7b6f541123fc4b45679193cb03ce176d14fc7"
                        },
                        "reference":{
                            "objectId":"0x075b79fe933d366b44c1aedcbb8614e2d349e7cd",
                            "version":1673,
                            "digest":"KPaPv6tx4Cv59tB4eWS5bWBFTcURy7/NkXUyD6sME4U="
                        }
                    }
                ],
                "gasObject":{
                    "owner":{
                        "AddressOwner":"0x7ca7b6f541123fc4b45679193cb03ce176d14fc7"
                    },
                    "reference":{
                        "objectId":"0x075b79fe933d366b44c1aedcbb8614e2d349e7cd",
                        "version":1673,
                        "digest":"KPaPv6tx4Cv59tB4eWS5bWBFTcURy7/NkXUyD6sME4U="
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
                            "coinObjectId":"0x075b79fe933d366b44c1aedcbb8614e2d349e7cd",
                            "version":1672,
                            "amount":-222
                        }
                    },
                    {
                        "newObject":{
                            "packageId":"0x32c058abc5b0ea2fb617578872645ec82683a373",
                            "transactionModule":"devnet_nft",
                            "sender":"0x7ca7b6f541123fc4b45679193cb03ce176d14fc7",
                            "recipient":{
                                "AddressOwner":"0x7ca7b6f541123fc4b45679193cb03ce176d14fc7"
                            },
                            "objectType":"0x32c058abc5b0ea2fb617578872645ec82683a373::devnet_nft::DevNetNFT",
                            "objectId":"0x7725200b513b559f6d6740e403402e8a55a674b2",
                            "version":1673
                        }
                    },
                    {
                        "moveEvent":{
                            "packageId":"0x32c058abc5b0ea2fb617578872645ec82683a373",
                            "transactionModule":"devnet_nft",
                            "sender":"0x7ca7b6f541123fc4b45679193cb03ce176d14fc7",
                            "type":"0x32c058abc5b0ea2fb617578872645ec82683a373::devnet_nft::NFTMinted",
                            "fields":{
                                "creator":"0x7ca7b6f541123fc4b45679193cb03ce176d14fc7",
                                "name":"Hello",
                                "object_id":"0x7725200b513b559f6d6740e403402e8a55a674b2"
                            },
                            "bcs":"dyUgC1E7VZ9tZ0DkA0AuilWmdLJ8p7b1QRI/xLRWeRk8sDzhdtFPxwVIZWxsbw=="
                        }
                    }
                ],
                "dependencies":[
                    "7SEBCLekfSqGmADF876zmZuQJHg6gCshQ6wtFCjABkuS",
                    "9AxNwxte52ExiCQ17wVbSPWqAaegx1hh1ozMWc6RCM6T"
                ]
            },
            "authSignInfo":{
                "epoch":61,
                "signature":"AZTz7buMC4Sutjk+QOcVD84t3dorY25UVAcSLNJGEtftl2QhlpsORWDQFSXNfi42Pg==",
                "signers_map":[
                    58,
                    48,
                    0,
                    0,
                    1,
                    0,
                    0,
                    0,
                    0,
                    0,
                    2,
                    0,
                    16,
                    0,
                    0,
                    0,
                    0,
                    0,
                    1,
                    0,
                    3,
                    0
                ]
            }
        },
        "confirmed_local_execution":true
    }
}
     */

    const nft = await provider.getObject("0x7725200b513b559f6d6740e403402e8a55a674b2") // ObjectID, 通过上面的events的newObject.objectId知道创建的NFT的ObjectID
    console.log(JSON.stringify(nft))

    /**
     * {"status":"Exists","details":{"data":{"dataType":"moveObject","type":"0xf400f6d2e12b585e54c17b6730def426445bdb47::devnet_nft::DevNetNFT","has_public_transfer":true,"fields":{"description":"AAAA","id":{"id":"0x9ace09f30ac2dc1e11827f5692abd61489fc563b"},"name":"Fucker","url":""}},"owner":{"AddressOwner":"0xd7753ca0ff5ca708d7128c074c3f1c9db6c4bc2f"},"previousTransaction":"GbyVpVUgDvWDp7wwiWynJ78cizdk4d6AztJaqxURPFzF","storageRebate":14,"reference":{"objectId":"0x9ace09f30ac2dc1e11827f5692abd61489fc563b","version":2402,"digest":"0HLoW0HLF7672gaMoFEvTcdiBELPhK7vOqIRR9QdnHw="}}}
     */

    
}

main()