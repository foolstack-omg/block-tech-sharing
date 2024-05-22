const { MnemonicKey, LCDClient, MsgExecute, Wallet, bcs, MsgDelegate } = require('@initia/initia.js');
const { join } = require('path')
require('dotenv').config({ path: join(__dirname, '../..', '.env') });
const lcd = new LCDClient(process.env.INITIA_LCD)
const { wallets } = require('../../wallets/initia.js');
const { sleep } = require('zksync-web3/build/src/utils.js');
const { log } = require('../../utils/common.js');

async function main() {
    console.log( bcs.string().serialize('init1t6duckxxljq4q8f3sa96j75fckxwe3uskdldmx').toBase64())
   
    for (let i = 0; i < wallets.length; i++) {
        try {
            let mnemonic = wallets[i].mnemonic
            const key = new MnemonicKey({ mnemonic: mnemonic })
            console.log(key.accAddress)
            const wallet = new Wallet(lcd, key)
            console.log(`sequnce: ${await wallet.sequence()}`)
            
            const delegate = new MsgExecute(
                wallets[i].address, // sender address
                '0x42cd8467b1c86e59bf319e5664a09b6b5840bb3fac64f5ce690b5041c530565a',  
                'dex_utils',
                'single_asset_provide_stake',
                [],
                ["2/BsSK85hOxtmuipqn27C7HnhKqbjEpWga9mDPhVjX0=","jkczvavPfUr8PRTw3UbJv1L7D86eS5lsk54ZW4vIkdk=","QEIPAAAAAAA=","AbNgCwAAAAAA","MmluaXR2YWxvcGVyMXg1d2doNnZ3eWU2MHd2M2R0c2hzOWRtcWdnd2Z4MmxkZm40bmZh"]
            )

            const signedTx = await wallet.createAndSignTx({
                msgs: [delegate],
            })
            signedTx.toData().body
            console.log(`broadcasting`)
            const broadcastResult = await lcd.tx.broadcast(signedTx)
            console.log(`success. tx: ${broadcastResult.txhash}`)
            await sleep(1000)
    
        } catch(e) {
            log(`error`, e)
        }
       
    }
    
}


main()
