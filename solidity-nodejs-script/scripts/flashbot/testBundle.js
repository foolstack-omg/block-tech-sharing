const { providers, Wallet, BigNumber } = require("ethers");
const { FlashbotsBundleProvider, FlashbotsBundleResolution } = require("@flashbots/ethers-provider-bundle");
const ethers = require('ethers')
const { wallets, airdrops } = require('../../wallets/public.js');
const { sign } = require("crypto");
const ETHEREUM_RPC_URL = "https://ethereum-rpc.publicnode.com"
// Standard json rpc provider directly from ethers.js (NOT Flashbots)
const provider = new providers.JsonRpcProvider({ url: ETHEREUM_RPC_URL })
// Uniswap V2 Router 合约地址
const UNISWAP_V2_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // WETH
const DAI_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // DAI
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) public view returns (uint256)"
];

async function main() {
  // `authSigner` is an Ethereum private key that does NOT store funds and is NOT your bot's primary key.
  // This is an identifying key for signing payloads to establish reputation and whitelisting
  // In production, this should be used across multiple bundles to build relationship. In this example, we generate a new wallet each time
  const walletRelay = new Wallet(wallets["0x544052dfbAdB948278cFa9d384A288232379964f"])
  const walletSponser = new Wallet(wallets["0x544052dfbAdB948278cFa9d384A288232379964f"])
  const walletExecutor = new Wallet(wallets["0x544052dfbAdB948278cFa9d384A288232379964f"])
  // let gasPrice = await provider.getGasPrice()
  // console.log(`${gasPrice}`)
  let { gasPrice, maxFeePerGas, maxPriorityFeePerGas } = await provider.getFeeData();
  // 设置交易参数
  const amountIn = ethers.utils.parseUnits("0.01", 18); // 1 WETH
  const amountOutMin = ethers.utils.parseUnits("40", 18); // 最低输出（建议通过 Uniswap SDK 或链下计算）
  const path = [WETH_ADDRESS, DAI_ADDRESS]; // 交换路径：WETH -> DAI
  const to = walletExecutor.address; // 接收地址
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 分钟后截止

  // 构造 approve 交易
  const erc20Contract = new ethers.Contract(WETH_ADDRESS, ERC20_ABI, walletSponser);
  const approveData = erc20Contract.interface.encodeFunctionData("approve", [
    UNISWAP_V2_ROUTER,
    amountIn
  ]);

  // 构造 swapExactTokensForTokens 交易
  const uniswapRouterAbi = [
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)"
  ];
  const uniswapRouter = new ethers.Contract(UNISWAP_V2_ROUTER, uniswapRouterAbi, walletSponser);
  const swapData = uniswapRouter.interface.encodeFunctionData("swapExactTokensForTokens", [
    amountIn,
    amountOutMin,
    path,
    to,
    deadline
  ]);

  // 构造 bundleTransactions
  const bundleTransactions = [
    // 1. Approve 交易
    {
      transaction: {
        chainId: 1,
        from: walletSponser.address,
        to: WETH_ADDRESS,
        data: approveData,
        type: 2, // EIP-1559
        maxFeePerGas: maxFeePerGas.mul(2),
        maxPriorityFeePerGas: maxPriorityFeePerGas,
        gasLimit: BigNumber.from(100000), // approve 通常需要较低 Gas
      },
      signer: walletSponser
    },
    // 2. Swap 交易
    {
      transaction: {
        chainId: 1,
        from: walletSponser.address,
        to: UNISWAP_V2_ROUTER,
        data: swapData,
        type: 2, // EIP-1559
        maxFeePerGas: maxFeePerGas.mul(2),
        maxPriorityFeePerGas: maxPriorityFeePerGas,
        gasLimit: BigNumber.from(300000), // Swap 交易需要更多 Gas
      },
      signer: walletSponser
    }
  ];
 
  // Flashbots provider requires passing in a standard provider
  const flashbotsProvider = await FlashbotsBundleProvider.create(
    provider, // a normal ethers.js provider, to perform gas estimiations and nonce lookups
    walletRelay, // ethers.js signer wallet, only for signing request payloads, not transactions
    'https://relay.flashbots.net'
  )
  const signedBundle = await flashbotsProvider.signBundle(bundleTransactions)
  const simulatedGasPrice = await checkSimulation(flashbotsProvider, signedBundle);
  console.log(`Simulated Gas Price: ${gasPriceToGwei(simulatedGasPrice)} gwei`)
  
  const BLOCKS_IN_FUTURE = 1
  const currentBlockNumber = await provider.getBlockNumber()
  const targetBlockNumber = currentBlockNumber + BLOCKS_IN_FUTURE;
  const bundleResponse = await flashbotsProvider.sendBundle(bundleTransactions, targetBlockNumber)
  if ('error' in bundleResponse) {
    throw new Error(bundleResponse.error.message)
  }
  console.log(bundleResponse)
  const bundleResolution = await bundleResponse.wait()
  console.log(bundleResolution)
  if (bundleResolution === FlashbotsBundleResolution.BundleIncluded) {
    console.log(`Congrats, included in ${targetBlockNumber}`)
    process.exit(0)
  } else if (bundleResolution === FlashbotsBundleResolution.BlockPassedWithoutInclusion) {
    console.log(`Not included in ${targetBlockNumber}`)
  } else if (bundleResolution === FlashbotsBundleResolution.AccountNonceTooHigh) {
    console.log("Nonce too high, bailing, but transaction may still be included, check etherscan later")
    process.exit(1)
  }
}

main()

async function checkSimulation(
  flashbotsProvider,
  signedBundle
) {
  const simulationResponse = await flashbotsProvider.simulate(
    signedBundle,
    "latest"
  );

  if ("results" in simulationResponse) {
    for (let i = 0; i < simulationResponse.results.length; i++) {
      const txSimulation = simulationResponse.results[i];
      if ("error" in txSimulation) {
        throw new Error(
          `TX #${i} : ${txSimulation.error} ${txSimulation.revert}`
        );
      }
    }
    console.log(`coinbaseDiff`, simulationResponse.coinbaseDiff.toString())
    if (simulationResponse.coinbaseDiff.eq(0)) {
      throw new Error("Does not pay coinbase");
    }

    const gasUsed = simulationResponse.results.reduce(
      (acc, txSimulation) => acc + txSimulation.gasUsed,
      0
    );

    const gasPrice = simulationResponse.coinbaseDiff.div(gasUsed);
    return gasPrice;
  }

  console.error(
    `Similuation failed, error code: ${simulationResponse.error.code}`
  );
  console.error(simulationResponse.error.message);
  throw new Error("Failed to simulate response");
}
function gasPriceToGwei(gasPrice) {
  return gasPrice.mul(100).div(1e9).toNumber() / 100;
}