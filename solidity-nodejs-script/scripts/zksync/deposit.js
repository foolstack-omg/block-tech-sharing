const { join } = require('path')
require('dotenv').config({ path: join(__dirname, '../..', '.env') });
const { airdrops } = require('../../wallets/public.js')
const ethers = require('ethers')
const provider = new ethers.providers.StaticJsonRpcProvider("https://rpc.ankr.com/eth")
let wallets = []
Object.keys(airdrops).forEach(k => {
    wallets.push(new ethers.Wallet(airdrops[k], provider))
})

main()
async function main() {
    console.log(`start.`)
    
    let gasPrice = await provider.getGasPrice()
    console.log(`gasPrice: ${gasPrice}`)
    for (let i = 0; i < wallets.length; i++) {
        let wallet_address = await wallets[i].getAddress()
        console.log(`handing ${wallet_address}`);
        let change = wallet_address.substring(2, wallet_address.length).toLowerCase()
        try {
            let res = await wallets[i].sendTransaction({
                from: wallet_address,
                to: `0x32400084c286cf3e17e7b677ea9583e60a000324`,
                data: `0xeb672419000000000000000000000000${change}00000000000000000000000000000000000000000000000000c3663566a5800000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000b54a300000000000000000000000000000000000000000000000000000000000003200000000000000000000000000000000000000000000000000000000000000100000000000000000000000000${change}00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000`,
                value: ethers.utils.parseEther("0.057"),
                gasLimit: 150000
            })
            // console.log(res)
            await res.wait(1)
            console.log(`handled ${wallet_address}`)
        } catch (e) {
            console.log(e)
            console.log(`error on handing ${wallet_address}`)
        }
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

