const { MnemonicKey, LCDClient, MsgExecute, Wallet, bcs } = require('@initia/initia.js');
const lcd = new LCDClient('https://lcd.initiation-1.initia.xyz/')
const { wallets } = require('../../wallets/initia.js');
const { sleep } = require('zksync-web3/build/src/utils.js');
const { log } = require('../../utils/common.js');

async function main() {
    
    // for (let i = 0; i < wallets.length; i++) {
    //     try {
    //         console.log(`[${i+1}]`)
    //         console.log(`address: ${wallets[i].address}`)
    //         console.log(`memonic: ${wallets[i].mnemonic}`)
    
    //     } catch(e) {
    //         log(`error`, e)
    //     }
       
    // }
    for (let i = 0; i < 30; i++) {
        try {
            console.log(`[${i+1}] ${wallets[i].address}`)
    
        } catch(e) {
            log(`error`, e)
        }
       
    }
    
}


main()
