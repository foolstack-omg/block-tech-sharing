import "../styles/globals.css"

import { Web3Provider } from "providers/Web3"
import { ToastAction, Toaster } from "@/components/ui/toast"

function MyApp({ Component, pageProps }) {
  return (
    <Web3Provider>
      <Component {...pageProps} />
      
    </Web3Provider>
    
  )
}

export default MyApp
