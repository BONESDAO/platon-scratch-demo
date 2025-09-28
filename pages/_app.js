import '../styles/globals.css'
import { useEffect } from 'react'
import { ethers } from 'ethers'

export default function App({ Component, pageProps }) {
  useEffect(() => {
    if (!window.ethereum) return
    (async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const accounts = await provider.listAccounts()
      if (accounts.length) {
        window.dispatchEvent(new CustomEvent('wallet-connected', { detail: accounts[0] }))
      }
    })()
  }, [])
  return <Component {...pageProps} />
}