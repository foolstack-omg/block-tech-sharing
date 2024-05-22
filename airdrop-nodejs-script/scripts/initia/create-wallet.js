const { MnemonicKey, LCDClient } = require('@initia/initia.js');
const lcd = new LCDClient('https://lcd.initiation-1.initia.xyz/')

async function main() {

    let wallets = []
    for (let i = 0; i < 100; i++) {
        const key = new MnemonicKey();
        // console.log('mnemonic:', key.mnemonic);
        // console.log('account address:', key.accAddress);
        wallets.push({
            mnemonic: key.mnemonic,
            address: key.accAddress
        })
    }

    console.log(wallets)
}


main()
