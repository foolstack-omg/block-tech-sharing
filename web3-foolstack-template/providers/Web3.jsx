import { useEffect, useState } from "react"
import "@rainbow-me/rainbowkit/styles.css"
import { configureChains, createConfig, WagmiConfig } from "wagmi"
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit"
import {
  arbitrum,
  goerli,
  mainnet,
  optimism,
  polygon,
  baseGoerli
} from "wagmi/chains"
import { publicProvider } from "wagmi/providers/public"

const base = {
  id: 8453,
  name: "Base",
  network: "base",
  nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
  },
  rpcUrls: {
      // alchemy: {
      //     http: ["https://opt-mainnet.g.alchemy.com/v2"],
      //     webSocket: ["wss://opt-mainnet.g.alchemy.com/v2"],
      // },
      // infura: {
      //     http: ["https://optimism-mainnet.infura.io/v3"],
      //     webSocket: ["wss://optimism-mainnet.infura.io/ws/v3"],
      // },
      default: {
          http: ["https://developer-access-mainnet.base.org"],
      },
      public: {
          http: ["https://developer-access-mainnet.base.org"],
      },
  },
  blockExplorers: {
      etherscan: {
          name: "Etherscan",
          url: "https://basescan.org",
      },
      default: {
          name: "Optimism Explorer",
          url: "https://basescan.org",
      },
  },
  contracts: {
      multicall3: {
          address: "0xca11bde05977b3631167028862be2a173976ca11",
          blockCreated: 4286263,
      },
  },
}
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [
    // mainnet,
    arbitrum,
    // base,
    // ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === "true" ? [goerli] : [])
  ],
  [publicProvider()]
)

const { connectors } = getDefaultWallets({
  appName: "Dapp Forge",
  projectId: "928c0944dc8279fb073a7405ecd6b657",
  chains
})

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient
})

export function Web3Provider(props) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    setReady(true)
  }, [])
  return (
    <>
      {ready && (
        <WagmiConfig config={wagmiConfig}>
          <RainbowKitProvider chains={chains}>
            {props.children}
          </RainbowKitProvider>
        </WagmiConfig>
      )}
    </>
  )
}
