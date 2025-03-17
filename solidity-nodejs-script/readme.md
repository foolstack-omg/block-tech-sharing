# Solidity Nodejs客户端脚本代码

- scripts
    - eip712 (Eip712使用示例代码)
    - merkle（Merkle proof使用示例代码）
    - zeta（ZetaChain全自动刷积分脚本）
    - circle/cctp (Circle CCTP 全链统一流动USDC免手续费跨链脚本)
    - avail (基于Pokadot波卡生态技术构建的Avail链，监控内存池抢跑归集代币)
    - nostr-v2 (Lnfi闪电协议<原NostrAsset> 基于nostr协议的套利脚本）)
        - nostr-oracle.js (用于记录历史价格并作为是否下单的价格预言机，防止有心人价格操纵把我一锅端了)
        - nostr-monitor-buy-order.js (监控买单, 并根据预言机判断是否下单)
        - nostr-monitor-sell-order.js (监控卖单, 并根据预言机判断是否下单)
        - nostr-send-msg.js (发送通知消息， 听到声音一般都会暗爽)
       

## Install
0. 查阅 *package.json* 文件, 确认文件中不存在陌生的第三方依赖
1. 运行 `npm i` 安装依赖库
2. 运行 `cp .env.example .env`
3. 打开 *.env* 文件 根据运行的脚本中存在的process.env.xxx, 配置相关环境参数xxx。不同的脚本以来的环境参数不同，按需配置即可

## Example
1. 运行eip712脚本. `node ./scripts/eip712/main.js` PS: 脚本里的私钥没钱，不用担心