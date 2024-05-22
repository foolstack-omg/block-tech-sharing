const { MnemonicKey, LCDClient, MsgExecute, Wallet, bcs } = require('@initia/initia.js');
const { join } = require('path')
require('dotenv').config({ path: join(__dirname, '../..', '.env') });
const lcd = new LCDClient(process.env.INITIA_LCD)
const { wallets } = require('../../wallets/initia.js');
const { sleep } = require('zksync-web3/build/src/utils.js');
const { log } = require('../../utils/common.js');

async function main() {
    
    for (let i = 0; i < wallets.length; i++) {
        try {
            console.log(`handling: ${wallets[i].address}`)
            const balances = await lcd.bank.balance(wallets[i].address)
    
            console.log(`balances`, balances[0]._coins)
    
            if (balances[0]._coins && balances[0]._coins.uinit && balances[0]._coins.uinit.amount >= 30 * 10 ** 6) {
                let mnemonic = wallets[i].mnemonic
                const key = new MnemonicKey({ mnemonic: mnemonic })
                console.log(key.accAddress)
                const wallet = new Wallet(lcd, key)
                console.log(`sequnce: ${await wallet.sequence()}`)
               
                const msg = new MsgExecute(
                    wallets[i].address, // sender address
                    '0x1',                                         // module owner address
                    'dex',                                         // module name
                    'swap_script',                                 // function name
                    [],                                            // type arguments
                    // [
                    //     bcs.address().serialize('0x2').toBase64(), // arguments, BCS-encoded
                    //     bcs.address().serialize('0x3').toBase64(), // arguments, BCS-encoded
                    //     bcs.u64().serialize(10000).toBase64()      // arguments, BCS-encoded
                    // ],
                    ["2/BsSK85hOxtmuipqn27C7HnhKqbjEpWga9mDPhVjX0=","jkczvavPfUr8PRTw3UbJv1L7D86eS5lsk54ZW4vIkdk=","gJaYAAAAAAA=","AaJefQAAAAAA"]

                )
    
                const signedTx = await wallet.createAndSignTx({
                    msgs: [msg],
                })
                signedTx.toData().body
                console.log(`broadcasting`)
                const broadcastResult = await lcd.tx.broadcast(signedTx)
                console.log(`success. tx: ${broadcastResult.txhash}`)
            }
            await sleep(1000)
    
        } catch(e) {
            log(`error`, e)
        }
       
    }
    
}


main()
