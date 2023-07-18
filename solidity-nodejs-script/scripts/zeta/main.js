const { default: axios } = require('axios');
const { join } = require('path')
require('dotenv').config({ path: join(__dirname, '../..', '.env') });
const ethers = require('ethers')
const provider = new ethers.providers.StaticJsonRpcProvider("https://rpc.ankr.com/eth_goerli")

let walletss = []
/**
 * Seesion-Token 存在Expires过期时间，请记录过期时间，定期更换，目前官方设置的过期时间是一个月
 */
let walletSession = {
    "{请替换成私钥1}": "{请替换成与此钱包和Twitter绑定的ZetaChain关联的Cookie 「__Secure-next-auth.session-token」}", // 钱包1
    "{请替换成私钥2}": "{请替换成与此钱包和Twitter绑定的ZetaChain关联的Cookie 「__Secure-next-auth.session-token」}", // 钱包2
}
Object.keys(walletSession).forEach(pk => {
    walletss.push(new ethers.Wallet(pk, provider))
})
main()
async function main() {
    console.log(`start.`)
    setInterval(async () => {
        console.log(await provider.getBlockNumber())
    }, 5000)
    while (1) {
        
        for (let i = 0; i < walletss.length; i++) {
            let gasPrice = await provider.getGasPrice()
            gasPrice = gasPrice.mul(2)
            // console.log(`${gasPrice}`)
            let wallet_address = await walletss[i].getAddress()
            console.log(`handing ${wallet_address}`);
            let change = wallet_address.substring(2, wallet_address.length).toLowerCase()
            try {
                let res = await walletss[i].sendTransaction({
                    from: wallet_address,
                    to: "0x7c125c1d515b8945841b3d5144a060115c58725f",
                    data: `0x71ec5c05aa669c4922569c1d33f7a81aaa21813800000000000000000000000013a0c5930c028511dc02665e7285134b6d11a5f4000000000000000000000000${change}0000000000000000000000000000000000000000000000000000000000000000`,
                    value: ethers.utils.parseEther("0.001"),
                    gasPrice: gasPrice
                })
                // console.log(res)
                await res.wait(1)
                console.log(`finished: ${wallet_address}`)
                // 通过ajax提交确认
                let saved = false
                let tried = 0
                while(!saved) {
                    if(tried >= 10) {
                        break
                    }
                    try {
                        ++tried
                        let result = await axios({
                            method: 'POST',
                            url: 'https://labs.zetachain.com/api/save-transaction',
                            data: new URLSearchParams({
                                sourceChainId: 5,
                                sourceChainTxHash: res.hash,
                                walletAddress: wallet_address
                            }).toString(),
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'Cookie': '__Secure-next-auth.session-token=' + walletSession[wallet_address],
                                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'
                            },
                            timeout: 120000
                        })
                        console.log(`earned: ${wallet_address}`)
                        console.log(result.data)
                        if(result.data.savedTransaction) {
                            // 领取了
                            saved = true
                        }
                    } catch(e) {
                        console.log(`error on handing ${wallet_address}`)
                        console.log(e)
                        await sleep(3000)
                    }
                }
               
            } catch (e) {
                console.log(e)
                console.log(`error on handing ${wallet_address}`)
            }
        }

        await sleep(1000 * 60 * 60 * 24 * 7 + 30 * 1000) // 七天后继续刷
    }

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
