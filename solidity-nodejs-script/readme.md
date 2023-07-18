# Solidity Nodejs客户端脚本代码
## 关注推特账号: @0xLmaoevd

- scripts
    - eip712 (Eip712使用示例代码)
    - merkle（Merkle proof使用示例代码）

## Install
0. 查阅 *package.json* 文件, 确认文件中不存在陌生的第三方依赖
1. 运行 `npm i` 安装依赖库
2. 运行 `cp .env.example .env`
3. 打开 *.env* 文件 根据运行的脚本中存在的process.env.xxx, 配置相关环境参数xxx。不同的脚本以来的环境参数不同，按需配置即可

## Example
1. 运行eip712脚本. `node ./scripts/eip712/main.js` PS: 脚本里的私钥没钱，不用担心