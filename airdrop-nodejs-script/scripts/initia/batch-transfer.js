const { MnemonicKey, LCDClient, MsgExecute, Wallet, bcs, MsgSend } = require('@initia/initia.js');
const lcd = new LCDClient('https://lcd.initiation-1.initia.xyz/')
const { wallets } = require('../../wallets/initia.js');
const { sleep } = require('zksync-web3/build/src/utils.js');
const { log } = require('../../utils/common.js');

async function main() {
    for (let i = 1; i < 100; i++) {
        try {
            console.log(`[${i + 1}] handling: ${wallets[i].address}`)
            const balances = await lcd.bank.balance(wallets[i].address)

            console.log(`balances`, balances[0]._coins)
            if (parseInt(balances[0]._coins.uinit.amount) > 11000000) {
                let mnemonic = wallets[i].mnemonic
                const key = new MnemonicKey({ mnemonic: mnemonic })
                console.log(key.accAddress)
                const wallet = new Wallet(lcd, key)
                console.log(`sequnce: ${await wallet.sequence()}`)
                let msgs = []
                for (let j = 1; j <= 4; j++) {
                    const msgSendInit = new MsgSend(wallets[i].address, wallets[i + j * 100].address, '2000000uinit')
                    const msgSendUsdc = new MsgSend(wallets[i].address, wallets[i + j * 100].address, '1000000uusdc')
                    msgs.push(msgSendInit, msgSendUsdc)
                }
                const signedTx = await wallet.createAndSignTx({
                    msgs: msgs
                })
                console.log(`broadcasting`)
                const broadcastResult = await lcd.tx.broadcast(signedTx)
                console.log(`success. tx: ${broadcastResult.txhash}`)
            }




            await sleep(3000)

        } catch (e) {
            log(`error`, e)
        }

    }

}


main()
