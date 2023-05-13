const { join } = require('path')
require('dotenv').config({ path: join(__dirname, '../..', '.env') });
const { airdrops } = require('../../wallets/public.js')
const { log } = require('../../utils/common.js')
const ethers = require('ethers')
const abiErc20 = require("../../abis/erc-20.json")
const classicPoolFactoryAbi = require("../../abis/syncswap/SyncSwapClassicPoolFactory.json")
const poolAbi = require("../../abis/syncswap/SyncSwapClassicPool.json")
const routerAbi = require("../../abis/syncswap/SyncSwapRouter.json")
const mintSquareAbi = require("../../abis/syncswap/MintSquare.json")
const nexonEthAbi = require("../../abis/syncswap/NexonEth.json")
const provider = new ethers.providers.StaticJsonRpcProvider("https://zksync2-mainnet.zksync.io")
const mysql = require('mysql');

let wallets = []
Object.keys(airdrops).forEach(k => {
    wallets.push(new ethers.Wallet(airdrops[k], provider))
})

// CREATE TABLE `airdrops_activity` (
//     `id` int unsigned NOT NULL AUTO_INCREMENT,
//     `address` varchar(63) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
//     `next_time` bigint unsigned DEFAULT '0',
//     `last_activity` varchar(63) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
//     `taskMintSquare` tinyint unsigned DEFAULT '0',
//     PRIMARY KEY (`id`),
//     UNIQUE KEY `only` (`address`) USING BTREE
//   ) ENGINE=InnoDB AUTO_INCREMENT=216 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/**
 * SyncSwap
 */
const classicPoolFactoryAddress = "0xf2DAd89f2788a8CD54625C60b55cD3d2D0ACa7Cb"
const routerAddress = "0x2da10A1e27bF85cEdD8FFb1AbBe97e53391C0295"
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

const events = [
    'taskMintSquare',
    'taskSyncswap',
    'taskNexon',
]

main()
async function main() {
    console.log(`start.`)
    while (1) {
        try {
            let gasPrice = await provider.getGasPrice()
            console.log(`gasPrice: ${gasPrice}`)
            if(gasPrice.gt(ethers.BigNumber.from(10).pow(8).mul(3))) {
                await sleep(5000)
                continue
            }
            let connection = mysql.createConnection({
                host: process.env.MYSQL_HOST,
                user: process.env.MYSQL_USER,
                password: process.env.MYSQL_PASSWORD,
                database: 'chain'
            });
            await new Promise((resolve, reject) => {
                connection.connect((error) => {
                    if (error) {
                        reject(error)
                    } else {
                        resolve()
                    }
                });
            })
            for (let i = 0; i < wallets.length; i++) {
                let wallet_address = await wallets[i].getAddress()
                console.log(`handing ${wallet_address}`);
                try {
                    let results = await new Promise((resolve, reject) => {
                        connection.query(`SELECT * FROM airdrops_activity WHERE address = '${wallet_address}'`, (error, results, fields) => {
                            if (error) {
                                reject(error)
                            } else {
                                resolve(results)
                            }
                        })
                    })
                    if (results.length === 0 || results[0].next_time <= (new Date().valueOf())) {
                        // 随机任务
                        let last_activity = events[getRandomInt(0, events.length - 1)]
                        if(results[0].taskMintSquare) {
                            continue
                        }
                        let next_time = (new Date().valueOf()) + getRandomInt(10 * 24 * 3600, 20 * 24 * 3600) * 1000 // 10~20天交互一次
                        await new Promise((resolve, reject) => {
                            connection.query(`INSERT INTO airdrops_activity (address, next_time, last_activity) VALUES ('${wallet_address}', ${next_time}, '${last_activity}') ON DUPLICATE KEY UPDATE next_time = ${next_time}, last_activity = '${last_activity}'`, (error, results, fields) => {
                                if (error) {
                                    reject(error)
                                } else {
                                    resolve(results)
                                }
                            })
                        })
                        console.log(`task ${last_activity} handing.`)
                        switch (last_activity) {
                            case 'taskMintSquare':
                                await taskMintSquare(wallets[i])
                                await new Promise((resolve, reject) => {
                                    connection.query(`UPDATE airdrops_activity SET taskMintSquare = 1 WHERE id = ${results[0].id}`, (error, results, fields) => {
                                        if (error) {
                                            reject(error)
                                        } else {
                                            resolve(results)
                                        }
                                    })
                                })
                                break;
                            case 'taskSyncswap':
                                await taskSyncswap(wallets[i])
                                break;
                            case 'taskNexon':
                                await taskNexon(wallets[i])
                                break;
                        }
                        console.log(`task ${last_activity} handed.`)
    
                    }
                } catch (e) {
                    console.log(`error on handing ${wallet_address}`)
                    console.log(e)
                }
    
                await sleep(getRandomInt(3000, 10000))
            }
            connection.end();
    
            await sleep(10 * 60 * 1000) // sleep 10 minutes
        } catch(e) {
            log(`${e}`)
            await sleep(1 * 60 * 1000) 
        }
       
    }

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}


async function taskSyncswap(wallet) {

    const value = ethers.utils.parseEther(getRandomInt(10000, 20000) / 10 ** 6 + '')

    await swapETHForErc20(wallet, "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91", "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4", value)

    await sleep((Math.random() * 10000) + 2000)

    const erc20Contract = new ethers.Contract(
        "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4",
        abiErc20,
        wallet
    );

    let balanceOfErc20 = await erc20Contract.balanceOf(await wallet.getAddress())
    // check allowance
    let allowance = await erc20Contract.allowance(await wallet.getAddress(), routerAddress)
    if (allowance.eq(0)) {
        let res = await erc20Contract.approve(routerAddress, ethers.constants.MaxUint256)
        res.wait()
    }
    await (swapErc20ForETH(wallet, "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4", "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91", balanceOfErc20))
}

async function swapETHForErc20(wallet, wETHAddress, erc20Address, amountIn) {
    // The factory of the Classic Pool.
    const classicPoolFactory = new ethers.Contract(
        classicPoolFactoryAddress,
        classicPoolFactoryAbi,
        wallet
    );

    // Gets the address of the ETH/DAI Classic Pool.
    // wETH is used internally by the pools.
    const poolAddress = await classicPoolFactory.getPool(wETHAddress, erc20Address);

    // Checks whether the pool exists.
    if (poolAddress === ZERO_ADDRESS) {
        throw Error('Pool not exists');
    }

    // Gets the reserves of the pool.
    const pool = new ethers.Contract(poolAddress, poolAbi, provider);
    const reserves = await pool.getReserves(); // Returns tuple (uint, uint)

    // Sorts the reserves by token addresses.
    const [reserveETH, reserveErc20] = wETHAddress < erc20Address ? reserves : [reserves[1], reserves[0]];

    // The input amount of ETH
    const value = amountIn
    const minAmountOut = getAmountOut(value, reserveETH, reserveErc20)

    // Constructs the swap paths with steps.
    // Determine withdraw mode, to withdraw native ETH or wETH on last step.
    // 0 - vault internal transfer
    // 1 - withdraw and unwrap to naitve ETH
    // 2 - withdraw and wrap to wETH
    const withdrawMode = 1; // 1 or 2 to withdraw to user's wallet

    const swapData = ethers.utils.defaultAbiCoder.encode(
        ["address", "address", "uint8"],
        [wETHAddress, await wallet.getAddress(), withdrawMode], // tokenIn, to, withdraw mode
    );

    // We have only 1 step.
    const steps = [{
        pool: poolAddress,
        data: swapData,
        callback: ZERO_ADDRESS, // we don't have a callback
        callbackData: '0x',
    }];

    // If we want to use the native ETH as the input token,
    // the `tokenIn` on path should be replaced with the zero address.
    // Note: however we still have to encode the wETH address to pool's swap data.
    const nativeETHAddress = ZERO_ADDRESS;

    // We have only 1 path.
    const paths = [{
        steps: steps,
        tokenIn: nativeETHAddress,
        amountIn: value,
    }];

    // Gets the router contract.
    const router = new ethers.Contract(routerAddress, routerAbi, wallet);
    // console.log(`${minAmountOut}`)
    // Note: checks approval for ERC20 tokens.
    // The router will handle the deposit to the pool's vault account.
    const response = await router.swap(
        paths, // paths
        minAmountOut.mul(99).div(100), // amountOutMin // Note: ensures slippage here
        ethers.BigNumber.from(Math.floor(Date.now() / 1000)).add(1800), // deadline // 30 minutes
        {
            value: value,
        }
    );

    await response.wait();
}


async function swapErc20ForETH(wallet, erc20Address, wETHAddress, amountIn) {
    // The factory of the Classic Pool.
    const classicPoolFactory = new ethers.Contract(
        classicPoolFactoryAddress,
        classicPoolFactoryAbi,
        wallet
    );

    // Gets the address of the ETH/DAI Classic Pool.
    // wETH is used internally by the pools.
    const poolAddress = await classicPoolFactory.getPool(wETHAddress, erc20Address);

    // Checks whether the pool exists.
    if (poolAddress === ZERO_ADDRESS) {
        throw Error('Pool not exists');
    }

    // Gets the reserves of the pool.
    const pool = new ethers.Contract(poolAddress, poolAbi, provider);
    const reserves = await pool.getReserves(); // Returns tuple (uint, uint)

    // Sorts the reserves by token addresses.
    const [reserveETH, reserveErc20] = wETHAddress < erc20Address ? reserves : [reserves[1], reserves[0]];

    // The input amount of ETH
    const value = amountIn
    const minAmountOut = getAmountOut(value, reserveErc20, reserveETH)

    // Constructs the swap paths with steps.
    // Determine withdraw mode, to withdraw native ETH or wETH on last step.
    // 0 - vault internal transfer
    // 1 - withdraw and unwrap to naitve ETH
    // 2 - withdraw and wrap to wETH
    const withdrawMode = 1; // 1 or 2 to withdraw to user's wallet

    const swapData = ethers.utils.defaultAbiCoder.encode(
        ["address", "address", "uint8"],
        [erc20Address, await wallet.getAddress(), withdrawMode], // tokenIn, to, withdraw mode
    );

    // We have only 1 step.
    const steps = [{
        pool: poolAddress,
        data: swapData,
        callback: ZERO_ADDRESS, // we don't have a callback
        callbackData: '0x',
    }];

    // We have only 1 path.
    const paths = [{
        steps: steps,
        tokenIn: erc20Address,
        amountIn: value,
    }];

    // Gets the router contract.
    const router = new ethers.Contract(routerAddress, routerAbi, wallet);
    // console.log(`${minAmountOut}`)
    // Note: checks approval for ERC20 tokens.
    // The router will handle the deposit to the pool's vault account.
    const response = await router.swap(
        paths, // paths
        minAmountOut.mul(99).div(100), // amountOutMin // Note: ensures slippage here
        ethers.BigNumber.from(Math.floor(Date.now() / 1000)).add(1800), // deadline // 30 minutes
    );

    await response.wait();
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// taskMintSquare
async function taskMintSquare(wallet) {
    const squareAddress = "0x53eC17BD635F7A54B3551E76Fd53Db8881028fC3"
    const contract = new ethers.Contract(
        squareAddress,
        mintSquareAbi,
        wallet
    );
    await contract.mint("ipfs://QmWe4wCYYvWCzqmZG7Bxbu9qofpZPLgi8nhXPYkRGoyqnk")
}

// taskMintSquare
async function taskNexon(wallet) {
    const nexonEthAddress = "0x1BbD33384869b30A323e15868Ce46013C82B86FB"
    const contract = new ethers.Contract(
        nexonEthAddress,
        nexonEthAbi,
        wallet
    );
    let randomEther = getRandomInt(100, 999) / 10**5 + "";
    let res = await contract.mint({ value: ethers.utils.parseEther(randomEther)})
    await res.wait();
    await sleep((Math.random() * 10000) + 2000)
    let balance = await contract.balanceOf(wallet.address)
    // console.log(`${balance}`)
    res = await contract.redeem(balance)
    await res.wait();
}
