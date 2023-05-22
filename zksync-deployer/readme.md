# zksync合约部署及开源脚本

*由于Zksync合约无法直接使用remix进行构建部署，因此这里要用官方提供的脚本进行部署合约并开源代码*

## 安装
*package.json依赖均为官方代码库*
1. `yarn install`
2. `cp .env.example .env`
3. 在 **MAIN_WALLET_PRIVATE_KEY** 后填写私钥

## 脚本
- `yarn hardhat compile` (编译contracts目录中所有合约)
- `yarn hardhat deploy-zksync --script greeter.ts` (使用hardhat.config.ts中defaultNetwork部署Greeter合约)
- `yarn hardhat deploy-zksync --script wallet.ts --network zkSyncMainnet` (使用zkSyncMainnet网络部署Wallet合约, 并在https://explorer.zksync.io/浏览器中开源代码)
