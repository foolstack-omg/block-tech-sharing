import { useEffect } from "react"
import { useSignMessage } from "wagmi"

export const useCustomSignMessage = (message, signClick, isCorrectChain) => {
  const { data, isError, isSuccess, signMessage } = useSignMessage({
    message
  })
  useEffect(() => {
    if (signClick && message && isCorrectChain) {
      console.log("signing message ", message)
      signMessage()
    }
  }, [signClick, message, isCorrectChain, signMessage])
  return {
    data,
    isError,
    isSuccess
  }
}
