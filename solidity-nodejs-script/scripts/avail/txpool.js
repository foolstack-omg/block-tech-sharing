const { getDecimals, initialize, formatNumberToBalance, getKeyringFromSeed, isValidAddress } = require("avail-js-sdk")
const { BN } = require("bn.js");

// 建议官方RPC必跑一份， 若同时有自己的RPC， 也使用自己的RPC， 跑一份。
// 这样可以避免官方RPC和自建RPC有差异的情况下，还能通过官方RPC这个保障。
// 使用自建RPC主要是两个作用： 1. 若官方RPC出问题， 还能用自建RPC 2. 自建RPC不会有请求频率的限制， 官方RPC可能有。
const AVAIL_RPC = 'wss://turing-rpc.avail.so/ws'
// 助记词, 请替换为自己的助记词
const mnemonics = [
  'xxxxx',
]
const RECEIVER = '5CLmozanvkjHfbpFLEd6i4nCRg4tzy1tGcZPYcSQ7uY4s1px' // 代币接收的归集地址, 自己更改

/**
 * Example of transferring tokens from Alice to Bob.
 */
const main = async () => {
  let api = await initialize(AVAIL_RPC)
  console.log(`avail api inited.`)


  let keyringMap = {}
  for(let i = 0; i < mnemonics.length; i++) {
    const keyring = getKeyringFromSeed(mnemonics[i])
    keyringMap[keyring.address] = keyring
  }

  let sent = {}
  while (true) {
    try {
      console.log(`connect status:`, api.isConnected ? 'connected' : 'disconnected')
      if (!api.isConnected) {
        api.disconnect()
        api = await initialize(AVAIL_RPC)
        console.log(`avail api inited.`)
      }

      const pendingExtrinsics = await api.rpc.author.pendingExtrinsics();
     
      for (let i = 0; i < pendingExtrinsics.length; i++) {
        let ext = pendingExtrinsics[i];

        let sender = ext.signer.toString()
      
        // 监控已被盗钱包Sender发出的tx， 使用相同的nonce， 提高tip， 抢跑
        if (Object.prototype.hasOwnProperty.call(keyringMap, sender)) {
          let keyring = keyringMap[sender]

          console.log(`sender:`, sender)
          console.log(`tip:`, ext.tip.toString())
          console.log(`nonce:`, ext.nonce.toString())
          console.log(`hash:`, ext.hash.toString())
          
          if(sent[ext.hash.toString()]) {
            // 已处理，不再重复发送
            console.log(`ignore ${ext.hash.toString()}`)
            continue
          }
          sent[ext.hash.toString()] = true

          let tip = new BN(ext.tip.toString()) // txpool中存在的tx给到的tip
          tip = tip.add(formatNumberToBalance(0.000001)) // 在原tip的基础上， 增加0.000001 AVL的TIP
          const options = {
            nonce: parseInt(ext.nonce.toString()), // 使用原tx的nonce， 即代表覆盖交易
            tip: tip 
          }
          // 抢跑， 把代币发送至自己新建的安全的钱包
          let transferTx = await api.tx.balances.transferAll(RECEIVER, false)
          let result =  await transferTx.signAndSend(keyring, options)
          console.log(`Sent TX: ${result}`)
          sent[`${result}`] = true
        }
      }

       // 若使用官方rpc的情况下，可能要控制请求频率， 以免被官方误认为DDOS攻击限制请求。 若使用自己的rpc， 则下面的等待10ms可以注释掉
       await new Promise((resolve) => setTimeout(resolve, 500)); // 目前控制, 每10ms请求一次

    } catch (e) {
      console.log(e)
    }

    
   
  }

  // process.exit(0)
}
main()

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}