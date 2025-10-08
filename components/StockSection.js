import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { ethers } from 'ethers';
import { CONTRACT, ABI } from '../utils/contract';

const StockSection = forwardRef((props, ref) => {
  const [list, setList] = useState([]);

  /* ====== 立即拉库存（可被外部强制刷新） ====== */
  const loadStock = async () => {
    const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC);
    const c = new ethers.Contract(CONTRACT, ABI, provider);
    const tmp = [];
    for (let i = 0; i < 6; i++) {
      const { amount, left, total, probability } = await c.prizes(i);
      const name = ['10LAT', '20LAT', '100LAT', '500LAT', '1000LAT', '10000LAT'][i];
      tmp.push({
        name,
        left: Number(left),
        total: Number(total),
        percent: (Number(probability) / 100).toFixed(1)
      });
    }
    setList(tmp);
  };

  useEffect(() => {
    loadStock(); // 首次加载
  }, []);

  // 暴露给父组件强制刷新（再抽后调用）
  useImperativeHandle(ref, () => ({ loadStock }));

  return (
    <section className="max-w-6xl mx-auto px-6 pb-16">
      <h2 className="text-3xl font-black mb-6">剩余奖品库存</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {list.map((p) => (
          <div key={p.name} className="glass-card p-5">
            <div className="flex items-center justify-between"><span className="font-bold text-slate-200">{p.name}</span><span className="text-emerald-400 font-mono-num">中奖率: {p.percent}%</span></div>
            <div className="mt-2 text-slate-400 font-mono text-sm">剩余 {p.left} / {p.total}</div>
            <div className="mt-3 h-2 w-full bg-slate-700 rounded-full"><div className="h-2 bg-emerald-400 rounded-full" style={{ width: `${(p.left / p.total) * 100}%` }} /></div>
          </div>
        ))}
      </div>
      <p className="text-center mt-8 text-slate-400">更多奖品正在路上</p>
    </section>
  );
});

export default StockSection;
