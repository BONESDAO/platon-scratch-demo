import { useEffect, useRef, useState } from 'react'
import { CONTRACT, ABI, CHAIN_ID, RPC } from '../utils/contract'
import { ethers } from 'ethers'

export default function ScratchCard({ account, provider }) {
  const canvas = useRef()
  const [done, setDone] = useState(false)
  const [prize, setPrize] = useState('')
  const [left, setLeft] = useState(null)

  useEffect(() => {
    const c = new ethers.Contract(CONTRACT, ABI, provider)
    c.played(account).then(n => setLeft(30 - Number(n)))
  }, [account, provider])

  useEffect(() => {
    if (!canvas.current) return
    const ctx = canvas.current.getContext('2d')
    const img = new Image()
    img.src = '/cover.png'
    img.onload = () => ctx.drawImage(img, 0, 0, 300, 200)
    let scratched = 0
    const handler = (e) => {
      if (done) return
      const rect = canvas.current.getBoundingClientRect()
      const x = (e.touches?.[0]?.clientX || e.clientX) - rect.left
      const y = (e.touches?.[0]?.clientY || e.clientY) - rect.top
      ctx.globalCompositeOperation = 'destination-out'
      ctx.beginPath()
      ctx.arc(x, y, 20, 0, Math.PI * 2)
      ctx.fill()
      scratched++
      if (scratched > 200 && !done) {
        setDone(true)
        finish()
      }
    }
    canvas.current.addEventListener('mousemove', handler)
    canvas.current.addEventListener('touchmove', handler)
    return () => {
      canvas.current?.removeEventListener('mousemove', handler)
      canvas.current?.removeEventListener('touchmove', handler)
    }
  }, [done, provider, account])

  async function finish() {
    const signer = provider.getSigner()
    const c = new ethers.Contract(CONTRACT, ABI, signer)
    try {
      const tx = await c.play({ value: ethers.utils.parseEther('0.033') })
      await tx.wait()
      const rc = await provider.getTransactionReceipt(tx.hash)
      const log = c.interface.parseLog(rc.logs[0])
      const tier = log.args.prizeTier
      const amt = log.args.amount
      if (tier === 6) setPrize('Better luck next time!')
      else setPrize(`Congrats! You won ${ethers.utils.formatEther(amt)} LAT`)
      setLeft(l => l - 1)
    } catch (e) {
      alert('Tx failed: ' + (e.reason || e.message))
      setDone(false)
    }
  }

  if (left === 0) return <p className="text-red-600">No chance left</p>

  return (
    <div className="flex flex-col items-center">
      <p className="mb-2">Chances left: {left}</p>
      <canvas ref={canvas} width={300} height={200} className="border" />
      {done && <p className="mt-4 text-xl">{prize}</p>}
    </div>
  )
}