const { getDecimals, initialize, formatNumberToBalance, getKeyringFromSeed, isValidAddress } = require("avail-js-sdk");

// 建议官方RPC必跑一份， 若同时有自己的RPC， 也使用自己的RPC， 跑一份。
// 这样可以避免官方RPC和自建RPC有差异的情况下，还能通过官方RPC这个保障。
// 使用自建RPC主要是两个作用： 1. 若官方RPC出问题， 还能用自建RPC 2. 自建RPC不会有请求频率的限制， 官方RPC可能有。
const AVAIL_RPC = 'wss://turing-rpc.avail.so/ws' 
// 助记词, 请替换为自己的助记词
const mnemonics = [
    'xxxx',
]
const RECEIVER = '5F9vyKMD9ai4CLgAdiwJwAtW9YD9BnjAUBFwHmckiLn3Yb8S' // 代币接收的归集地址, 自己更改

const main = async () => {
    // 初始化准备工作
    const api = await initialize(AVAIL_RPC);
   
    while (true) {
        try {
            console.log(`connect status:`, api.isConnected ? 'connected': 'disconnected')
            if(!api.isConnected) {
                await api.connect()
            }
            const startTime = Date.now();
            for(let i = 0; i < mnemonics.length; i++) {
                if(!api.isConnected) {
                    await api.connect()
                }
                // 若使用官方rpc的情况下，可能要控制请求频率， 以免被官方误认为DDOS攻击限制请求。 若使用自己的rpc， 则下面的等待10ms可以注释掉
                await new Promise((resolve) => setTimeout(resolve, 200)); // 目前控制, 每10ms请求一次
                const keyring = getKeyringFromSeed(mnemonics[i]);
                const address = keyring.address
                try {
                    console.log(`handing ${address}.`)
                    const tip = formatNumberToBalance(0.1); // 默认使用0.1AVL作为基础tip
                    const options = { tip: tip };
                    api.tx.balances.transferAll(RECEIVER, false).signAndSend(keyring, options, async ({
                        status,
                        events,
                        txHash
                    }) => {
                        console.log(`[${keyring.address}] Transaction Hash: ${txHash}, Status: ${status.type}`);
                        if (status.isInBlock) {
                            console.log(`[${keyring.address}] Transaction confirmed in block. Hash: ${txHash}`);
                        }
                    }).catch((e) => null);
                 
                } catch(e) {
                    console.log(`error on handing ${address}`, e)
                }
            }
            const endTime = Date.now();
            console.log(`批量处理时间: ${(endTime - startTime) / 1000} 秒`);
            console.log(`批量发送完毕.`);
        } catch(e) {
            console.log(e)
        }
       
    }

}

main();

