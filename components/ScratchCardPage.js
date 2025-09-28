// components/ScratchCardPage.js
import { useEffect, useRef, useState } from 'react'

export default function ScratchCardPage({ onScratchFinish }) {
  const canvasRef = useRef(null)
  const [done, setDone] = useState(false)
  const [prize, setPrize] = useState('')

  async function finish() {
    if (done) return
    setDone(true)
    const res = await onScratchFinish()
    setPrize(res)
  }

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    const w = cv.width
    const h = cv.height

    // 1. 金属银激光渐变
    const grd = ctx.createLinearGradient(0, 0, w, h)
    grd.addColorStop(0, '#e5e7eb')
    grd.addColorStop(0.5, '#9ca3af')
    grd.addColorStop(1, '#e5e7eb')
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, w, h)

    // 2. 顶部文字
    ctx.fillStyle = '#374151'
    ctx.font = 'bold 24px Inter'
    ctx.textAlign = 'center'
    ctx.fillText('用手指/鼠标刮开', w / 2, 40)

    // 3. 刮开逻辑
    let scratched = 0
    const brush = 30
    const handler = (e) => {
      if (done) return
      const r = cv.getBoundingClientRect()
      const x = (e.touches?.[0]?.clientX || e.clientX) - r.left
      const y = (e.touches?.[0]?.clientY || e.clientY) - r.top
      ctx.globalCompositeOperation = 'destination-out'
      ctx.beginPath()
      ctx.arc(x, y, brush, 0, Math.PI * 2)
      ctx.fill()
      scratched++
      if (scratched % 20 === 0) checkArea()
    }

    function checkArea() {
      const data = ctx.getImageData(0, 0, w, h).data
      let transparent = 0
      for (let i = 3; i < data.length; i += 4) if (data[i] === 0) transparent++
      if (transparent / (w * h) > 0.4) finish()
    }

    cv.addEventListener('mousemove', handler)
    cv.addEventListener('touchmove', handler)
    return () => {
      cv.removeEventListener('mousemove', handler)
      cv.removeEventListener('touchmove', handler)
    }
  }, [done])

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center px-6">
      <h1 className="text-4xl font-black mb-8">刮开涂层</h1>
      <canvas
        ref={canvasRef}
        width={384}
        height={256}
        className="rounded-3xl border-2 border-slate-700 shadow-2xl cursor-crosshair"
      />
      {done && (
        <div className="mt-8 text-3xl font-black text-emerald-400">{prize || 'Loading...'}</div>
      )}
      <button
        onClick={() => window.location.href = '/'}
        className="mt-10 px-6 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 transition"
      >
        返回首页
      </button>
    </div>
  )
}