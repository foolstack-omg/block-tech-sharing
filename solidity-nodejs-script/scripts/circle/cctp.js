require("dotenv").config();
const ethers = require('ethers')
const cctp_utils = require('../../utils/cctp')


const main = async () => {
    // transfer 1 USDC from Arbitrum Mainnet to Avalanche Mainnet, FROM wallet pay the Arbitrum ETH gas, TO wallet pay the Avalanche AVAX gas.
    let amountUSDC = ethers.BigNumber.from(10).pow(6).mul(1) // 1 USDC
    // you can change the rpc by changing the rpc url in $network_config, e.g. $network_config['MainNet']['Arbitrum'].rpc = 'xxx'.
    let res = await cctp_utils.cctp(cctp_utils.$network_config, 'MainNet', 'Avalanche', 'Arbitrum', process.env.FROM_PRIVATE_KEY, process.env.TO_PRIVATE_KEY, amountUSDC)
    console.log(res)
    // If deposited 1 USDC from Arbitrum, but the receive process didn't finished, need to recover the cctp process with the deposited tx.
    if(res.status == 'deposited') {
        res = await cctp_utils.recover_cctp(cctp_utils.$network_config, 'MainNet', 'Avalanche', 'Arbitrum', process.env.TO_PRIVATE_KEY, res.tx)
        console.log(res)
    }
};

main()