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
            
            const delegate = new MsgDelegate(
                wallets[i].address, // sender address
                'initvaloper14qekdkj2nmmwea4ufg9n002a3pud23y8l3ep5z',  
                '1000000uinit'
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
