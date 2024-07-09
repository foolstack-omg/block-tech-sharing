import PropTypes from "prop-types"
import React, { useEffect } from "react"
import {
  usePrepareContractWrite,
  useContractWrite,
  useWaitForTransaction
} from "wagmi"
import {
  DEFAULT_CONTRACT_ADDRESS,
  GAS_LIMIT_MULTIPLIER
} from "../../config/constant"
import { ethers } from "ethers"
import { CircularProgress } from "@mui/material"
import { useSnackbar } from "notistack"

const WriteButton = ({ onClick, children, abi, functionName, value, args }) => {
  const { enqueueSnackbar } = useSnackbar()
  const {
    config,
    isError: prepareIsError,
    error: prepareError
  } = usePrepareContractWrite({
    address: DEFAULT_CONTRACT_ADDRESS,
    abi,
    functionName,
    overrides: {
      value: ethers.utils.parseEther(value)
    },
    args
  })

  const {
    data,
    error: writeError,
    isError: writeIsError,
    isLoading: writeIsLoading,
    write
  } = useContractWrite({
    ...config,
    request: {
      ...config.request,
      gasLimit: Math.ceil(config?.request?.gasLimit * GAS_LIMIT_MULTIPLIER)
    }
  })

  const {
    data: txnRes,
    error: txnError,
    isError: txnIsError,
    isLoading: txnIsLoading,
    isSuccess: txnIsSuccess
  } = useWaitForTransaction({
    hash: data?.hash
  })

  useEffect(() => {
    if (txnIsSuccess) {
      console.log("Transaction success", txnRes)
    }
  }, [txnIsSuccess])

  useEffect(() => {
    if (txnIsError) {
      enqueueSnackbar(txnError.message, { variant: "error" })
    }
  }, [txnIsError])

  useEffect(() => {
    if (writeIsError) {
      enqueueSnackbar(writeError.message, { variant: "error" })
    }
  }, [writeIsError])

  useEffect(() => {
    if (prepareIsError) {
      enqueueSnackbar(prepareError.message, { variant: "error" })
    }
  }, [prepareIsError])

  const handleClick = () => {
    write?.()
    onClick?.()
  }
  return (
    <>
      <button
        disabled={!write || writeIsLoading || txnIsLoading}
        onClick={handleClick}
        id="inherit-button"
      >
        {children}
      </button>
      {txnIsLoading && <CircularProgress />}
      {prepareError && (
        <div>
          An error occurred preparing the transaction: {prepareError.message}
        </div>
      )}
    </>
  )
}

WriteButton.propTypes = {
  onClick: PropTypes.func,
  children: PropTypes.any,
  abi: PropTypes.any.isRequired,
  functionName: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  args: PropTypes.array.isRequired
}

export default WriteButton
