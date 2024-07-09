import { ethers } from 'ethers'
import Redis from 'ioredis'
// import nextConnect from 'next-connect';
// import cors from 'cors';
// const handler = nextConnect();

// // 使用 cors 中间件
// handler.use(cors({ origin: '*' }));

// handler.get((req, res) => {
//     res.send('Hello world!');
//   });

// export default handler;

export default async function handler(req, res) {
    try {
        const redis = new Redis({
            port: process.env.REDIS_PORT,     // Redis 默认的端口号
            host: process.env.REDIS_HOST,  // Redis 服务器地址
            password: process.env.REDIS_PASSWORD
            // 你可以按需设置的其他配置项
        });
        // res.setHeader('Access-Control-Allow-Origin', '*');
        // res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
        // res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        // // 处理你的请求

        // // 如果是一个 OPTIONS 请求（预检请求），只需要返回响应头就好
        // if (req.method === 'OPTIONS') {
        //     res.status(200).end();
        //     return;
        // }
        const messageBytes = ethers.toUtf8Bytes(`request to get 0.1 bera.`);
        const messageDigest = ethers.hashMessage(messageBytes);
        // const signaturePromise = wallet.signMessage(messageDigest);
        const signature = req.body.signature

        // 从签名中恢复地址
        const recoveredAddress = ethers.recoverAddress(messageDigest, signature);

        // 检查地址是否有足够余额
        let pass = false
        const providerEth = new ethers.JsonRpcProvider("https://rpc.ankr.com/eth")
        let balanceEth = await providerEth.getBalance(recoveredAddress)
        let noncesEth = await providerEth.getTransactionCount(recoveredAddress)
        if (balanceEth >= ethers.parseEther("0.001")) {
            pass = true
        }
        if(noncesEth >= 3) {
            pass = true
        }
        if(!pass) {
            const providerArb = new ethers.JsonRpcProvider("https://rpc.ankr.com/arbitrum")
            let balanceArb = await providerArb.getBalance(recoveredAddress)
            let noncesArb = await providerArb.getTransactionCount(recoveredAddress)
            if (balanceArb >= ethers.parseEther("0.005")) {
                pass = true
            }
            if(noncesArb >= 10) {
                pass = true
            }
        }
        if(!pass) {
            const providerSync = new ethers.JsonRpcProvider("https://mainnet.era.zksync.io")
            let balanceSync = await providerSync.getBalance(recoveredAddress)
            let noncesSync = await providerSync.getTransactionCount(recoveredAddress)
            if (balanceSync >= ethers.parseEther("0.005")) {
                pass = true
            }
            if(noncesSync >= 10) {
                pass = true
            }
        }

        if (!pass) {
            console.log(`Please try another wallet.`)
            return res.status(200).json({ status: 0, msg: 'Please try another wallet.' })
        }

        const providerBera = new ethers.JsonRpcProvider("https://artio.rpc.berachain.com")
        const beraWallet = new ethers.Wallet(process.env.BERA_FAUCET_WALLET, providerBera)
        const balanceBera = await providerBera.getBalance(beraWallet.address)
        if(balanceBera < ethers.parseEther("0.11")) {
            return res.status(200).json({ status: 0, msg: 'The Faucet is empty.' })
        }
        try {
           
            let last_received_at = await redis.get(`BERA:${recoveredAddress}:AT`)
            if(last_received_at) {
                let now = new Date().valueOf()
                if((now - last_received_at) < 24 * 60 * 60 * 1000) {
                    let nextHours = (((24 * 60 * 60 * 1000 - (now - last_received_at)) / (60 * 60 * 1000))).toFixed(0)
                  
                    return res.status(200).json({ status: 0, msg: `Sorry, you can get bera after ${nextHours} hours.` })
                }
            }
            let resSend = await beraWallet.sendTransaction({
                from: beraWallet.address,
                to: recoveredAddress,
                value: ethers.parseEther("0.1")
            })
            let receipt = await resSend.wait()
            let tx = (await receipt.getTransaction()).hash
            console.log(`BERA:${recoveredAddress}:AT ` + last_received_at)
            await redis.set(`BERA:${recoveredAddress}:AT`, new Date().valueOf())
            return res.status(200).json({ status: 1, address: recoveredAddress, tx: tx})
        } catch(e) {
            console.log(e)
            return res.status(200).json({ status: 0, msg: 'bera chain is down.' })
        }
       
    } catch (e) {
        return res.status(200).json({ status: 0, msg: 'server error.' })
    }

}