const { MnemonicKey, LCDClient, MsgExecute, Wallet, bcs } = require('@initia/initia.js');
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
            
            const register_domain = new MsgExecute(
                wallets[i].address, // sender address
                '0x42cd8467b1c86e59bf319e5664a09b6b5840bb3fac64f5ce690b5041c530565a',                                         // module owner address
                'usernames',                                         // module name
                'register_domain',                                 // function name
                [],                                            // type arguments
                // [
                //     bcs.address().serialize('0x2').toBase64(), // arguments, BCS-encoded
                //     bcs.address().serialize('0x3').toBase64(), // arguments, BCS-encoded
                //     bcs.u64().serialize(10000).toBase64()      // arguments, BCS-encoded
                // ],
                [bcs.string().serialize(key.accAddress).toBase64(),"4IfhAQAAAAA="]

            )
            const set_name = new MsgExecute(
                wallets[i].address, // sender address
                '0x42cd8467b1c86e59bf319e5664a09b6b5840bb3fac64f5ce690b5041c530565a',                                         // module owner address
                'usernames',                                         // module name
                'set_name',                                 // function name
                [],                                            // type arguments
                // [
                //     bcs.address().serialize('0x2').toBase64(), // arguments, BCS-encoded
                //     bcs.address().serialize('0x3').toBase64(), // arguments, BCS-encoded
                //     bcs.u64().serialize(10000).toBase64()      // arguments, BCS-encoded
                // ],
                [bcs.string().serialize(key.accAddress).toBase64()]

            )

            const signedTx = await wallet.createAndSignTx({
                msgs: [register_domain, set_name],
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
