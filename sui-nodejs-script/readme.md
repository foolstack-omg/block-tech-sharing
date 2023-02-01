# Sui Nodejs的脚本代码分享


## 安装
1. `cp ./.env.example ./.env`
2. `npm i`
3. 配置.env中需要用到的内容


## scripts 脚本
### examples 示例脚本
- 以下脚本展示了与合约交互的基本流程（预估Gas，测试事务是否能执行成功，获取测试执行的结果回执，正式提交事务等EtherJs常用到的类似功能函数）

1. stake.js (Testnet Wave2质押)
2. test_devnet_nft.js (与示例自定义合约sui/exmaples/nft-example交互的测试脚本)
3. test.js (mint官方的NFT脚本)