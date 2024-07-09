import PropTypes from "prop-types"
import React from "react"
import { useAccount, useNetwork, useSwitchNetwork } from "wagmi"
import { useCustomSignMessage } from "../../hooks/useSignMessage"
import { ethers } from "ethers"
import useLocalStorage from "../../hooks/useLocalStorage"
import { useEffect, useState } from "react"

const SignInButton = ({ onClick, children, message }) => {
  const { chain } = useNetwork()
  const [signClick, setSignClick] = useState(false)
  const { switchNetwork } = useSwitchNetwork()
  const [signature, setSignature] = useLocalStorage("signature", "")
  const { address, isConnected } = useAccount()

  const { data, isError, isSuccess } = useCustomSignMessage(
    message,
    signClick,
    chain?.id === Number(process.env.NEXT_PUBLIC_CHAIN_ID)
  )

  async function signCustomMessage() {
    setSignClick(true)
  }

  const handleClick = () => {
    if (isConnected && address) {
      console.log("chain", process.env.NEXT_PUBLIC_CHAIN_ID)
      if (chain.id !== Number(process.env.NEXT_PUBLIC_CHAIN_ID)) {
        switchNetwork(
          ethers.utils.hexlify(Number(process.env.NEXT_PUBLIC_CHAIN_ID))
        )
      }
      if (signature === "") {
        signCustomMessage()
      } else {
        onClick()
      }
    } else {
      alert("Please connect your wallet first")
    }
  }

  useEffect(() => {
    // Clean up signature when address and chain change
    setSignature("")
  }, [chain, address])

  useEffect(() => {
    if (isSuccess) {
      onClick()
      setSignature(data)
      console.log("Signature data button", data)
    }
    if (isError) {
      setSignature("")
      console.log("Sign error", isError)
    }
    setSignClick(false)
  }, [isSuccess, isError])

  return (
    <button id="inherit-button" onClick={handleClick}>
      {children}
    </button>
  )
}

SignInButton.propTypes = {
  onClick: PropTypes.func,
  children: PropTypes.node,
  message: PropTypes.string
}

export default SignInButton
