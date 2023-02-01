const { JsonRpcProvider, Network, Ed25519Keypair, RawSigner } = require('@mysten/sui.js');
const dotenv = require("dotenv");
dotenv.config();

async function getSuiCoinIds(provider, address) {
    const allCoins = await provider.getGasObjectsOwnedByAddress(address);
    // console.log(allCoins)
    var SuiCoinIds = [];
    for (var coin of allCoins) {
        SuiCoinIds.push(coin.objectId);
    }

    // keep one as gas cost
    SuiCoinIds.pop();

    //   console.log(SuiCoinIds)

    return SuiCoinIds


}



async function main() {
    // connect to Devnet
    const provider = new JsonRpcProvider('https://fullnode.testnet.sui.io');
    const SUI_SYSTEM_STATE_OBJECT_ID = "0x5";

    // Signer
    const keypair = Ed25519Keypair.deriveKeypair(process.env.MAIN_MNEMONICS);
    const signer = new RawSigner(keypair, provider);
    const sui_address = keypair.getPublicKey().toSuiAddress();
    // provider.getGasObjectsOwnedByAddress()

    /**
     * 测试Tx是否能执行成功(这里也可以用signer.getGasCostEstimation来替代signer.dryRunTransaction, 类似于EtherJs的estimateGas)
     * Move语言的参数类型和Js的参数类型的对应关系可以查看 https://docs.sui.io/devnet/reference/sui-json 
     */
    let effects = await signer.dryRunTransaction({
        kind: 'moveCall',
        data: {
            packageObjectId: '0x2',
            module: 'sui_system',
            function: 'request_add_delegation_mul_coin',
            typeArguments: [],
            arguments: [
                SUI_SYSTEM_STATE_OBJECT_ID, // SuiSystemState Object
                await getSuiCoinIds(provider, sui_address), // vector<Coin<SUI>>,
                ["1000000"], // option::Option<u64>, U64以上用字符串传输
                '0x5d06f37654f11cdd27179088fcfeadaab21e13ef' // address
            ],
            gasBudget: 100000,
        }
    })
    // console.log(JSON.stringify(effects))
    if (effects.status.status == 'success') {
        /**
         * 测试事务能执行成功，正式提交执行请求
         */
        let result = await signer.executeMoveCall({
            packageObjectId: '0x2',
            module: 'sui_system',
            function: 'request_add_delegation_mul_coin',
            typeArguments: [],
            arguments: [
                SUI_SYSTEM_STATE_OBJECT_ID,
                await getSuiCoinIds(provider, sui_address),
                ["1000000"], // Sui 是9位小数
                '0x5d06f37654f11cdd27179088fcfeadaab21e13ef'
            ],
            gasBudget: 100000,
        })
        console.log(result)
        /**
         * {
  EffectsCert: {
    certificate: {
      transactionDigest: 'DGLXnJXCFJzR7GKvo2gr3VPaqmJCbcqpQqApZc8UCDB8',
      data: [Object],
      txSignature: 'AE5qZiHuyFYuh18qEnaprD2uq9JPy/1DQD5yUuvU8MBDKvwzhfo6CCTyc33G90HdUwTE5RKaG1RPDr1L/ZUCfgZgK0SCYNf/W09S3iWqS8sF/QHgTkyidTiNQZXuiolQFw==',
      authSignInfo: [Object]
    },
    effects: {
      transactionEffectsDigest: 'nk88up3tCS8eznCMe231RCh+3rzQU/FruOX49WleEYo=',
      effects: [Object],
      authSignInfo: [Object]
    },
    confirmed_local_execution: false
  }
}
         */
    }

}

main()