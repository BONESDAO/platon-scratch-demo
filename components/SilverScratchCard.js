import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';

const SilverScratchCard = forwardRef(({ revealText }, ref) => {
  const canvasRef = useRef(null);
  const [done, setDone] = useState(false);

  // 外部可调用：完全重置
  useImperativeHandle(ref, () => ({
    reset: () => {
      setDone(false);
      const cv = canvasRef.current;
      if (!cv) return;
      const ctx = cv.getContext('2d');
      const w = cv.width;
      const h = cv.height;
      const grd = ctx.createLinearGradient(0, 0, w, h);
      grd.addColorStop(0, '#e5e7eb');
      grd.addColorStop(0.5, '#9ca3af');
      grd.addColorStop(1, '#e5e7eb');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 24px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('Use finger/mouse to scratch', w / 2, 40);
    }
  }));

  useEffect(() => {
    if (done) return;
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const w = cv.width;
    const h = cv.height;
    const grd = ctx.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, '#e5e7eb');
    grd.addColorStop(0.5, '#9ca3af');
    grd.addColorStop(1, '#e5e7eb');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 24px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Use finger/mouse to scratch', w / 2, 40);

    let scratched = 0;
    const radius = 25;
    const handler = (e) => {
      if (done) return;
      const r = cv.getBoundingClientRect();
      const x = (e.touches?.[0]?.clientX || e.clientX) - r.left;
      const y = (e.touches?.[0]?.clientY || e.clientY) - r.top;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      scratched++;
      if (scratched % 20 === 0) checkArea();
    };

    function checkArea() {
      const data = ctx.getImageData(0, 0, w, h).data;
      let transparent = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] === 0) transparent++;
      if (transparent / (w * h) > 0.4) finish();
    }

    function finish() {
      setDone(true);
      ctx.clearRect(0, 0, w, h);
    }

    cv.addEventListener('mousemove', handler);
    cv.addEventListener('touchmove', handler);
    return () => {
      cv.removeEventListener('mousemove', handler);
      cv.removeEventListener('touchmove', handler);
    };
  }, [done]);

  return (
    <div className="relative">
      <canvas ref={canvasRef} width={384} height={256} className="rounded-3xl border-2 border-slate-700 shadow-2xl cursor-crosshair" />
      {done && <div className="absolute inset-0 flex items-center justify-center text-2xl font-black text-emerald-400">{revealText}</div>}
    </div>
  );
});
export default SilverScratchCard;
