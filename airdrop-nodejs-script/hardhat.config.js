/**
* @type import('hardhat/config').HardhatUserConfig
*/

require('dotenv').config();
require("@nomiclabs/hardhat-ethers");

const { API_URL, PRIVATE_KEY, BABY_API_URL, BABY_PRIVATE_KEY } = process.env;

module.exports = {
   solidity: "0.7.3",
   defaultNetwork: "ropsten",
   networks: {
      hardhat: {},
      ropsten: {
         url: API_URL,
         accounts: [`0x${PRIVATE_KEY}`]
      },
      // mainnet: {
      //   url: "https://bsc-dataseed.binance.org/",
      //   chainId: 56,
      //   gasPrice: 20000000000,
      //   accounts: {mnemonic: mnemonic}
      // }
   },
}