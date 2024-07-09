import { ethers } from "ethers"
import { useEffect, useState } from "react"
import { useNetwork, useSigner } from "wagmi"

export const useCustomContract = (address, abi) => {
  const { data: signer } = useSigner()
  const { chain } = useNetwork()
  const [contract, setContract] = useState(null)
  useEffect(() => {
    if (address && abi && chain && signer) {
      setContract(new ethers.Contract(address, abi, signer))
    }
  }, [address, abi, chain, signer])

  return {
    contract,
    chain,
    signer
  }
}
