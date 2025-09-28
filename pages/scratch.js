// pages/scratch.js  ← 一次性覆盖
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';
import { CONTRACT, ABI, CHAIN_ID } from '../utils/contract';
import SilverScratchCard from '../components/SilverScratchCard';
import ReceiptModal from '../components/ReceiptModal';
import StockSection from '../components/StockSection';

export default function Scratch() {
    const router = useRouter();
    const { tx } = router.query;

    const [prize, setPrize] = useState('');               // 当前奖品文字
    const [showReceipt, setShowReceipt] = useState(false); // 收据弹窗开关
    const [receipt, setReceipt] = useState(null);          // 收据内容
    const stockRef = useRef(); // ✅ 只给 StockSection 用                           // 刮层 & 库存刷新句柄

    /* ---------------- 首次加载 + 再抽后重新解析奖品 ---------------- */
    useEffect(() => {
        if (!tx) return;
        (async () => {
            const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC);
            const rc = await provider.getTransactionReceipt(tx);
            const c = new ethers.Contract(CONTRACT, ABI, provider);
            const log = c.interface.parseLog(rc.logs[0]);
            const tier = log.args.prizeTier;
            const amt = log.args.amount;
            setPrize(tier === 6 ? 'Better luck next time!' : `Congrats! You won ${ethers.utils.formatEther(amt)} LAT`);
        })();
    }, [tx]);

    /* ---------------- 再抽一次：完整收据 + 原地更新 ---------------- */
    async function drawAgain() {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const c = new ethers.Contract(CONTRACT, ABI, signer);

        // 1. 检查能否抽（次数 & 库存）
        const me = await signer.getAddress();
        const played = await c.played(me);
        if (played >= 30) { alert('您已用完 30 次机会'); return; }
        const { left } = await c.prizes(0);
        if (left === 0) { alert('奖品已发完'); return; }

        // 2. 订单 & 收据弹窗
        const orderId = 'PlatON-' + Math.random().toString(16).slice(2, 8).toUpperCase();
        const utcTime = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
        setReceipt({ orderId, status: '等待签名', time: utcTime });
        setShowReceipt(true);

        // 3. 确保链正确
        const chainId = await provider.getNetwork().then(n => n.chainId);
        if (chainId !== CHAIN_ID) {
            try { await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: ethers.utils.hexValue(CHAIN_ID) }] }); }
            catch (e) { alert('请手动切换到 PlatON DevNet2'); setShowReceipt(false); return; }
        }

        // 4. 交易
        try {
            const tx = await c.play({ value: ethers.utils.parseEther('0.033') });
            setReceipt(r => ({ ...r, status: '已签名' }));
            await tx.wait();
            stockRef.current?.loadStock(); // ✅ 只刷新库存
            setShowReceipt(false);
            // 5. 原地换参 → 触发 useEffect 重新解析奖励 + 重置刮层 + 刷新库存
            router.replace({ pathname: '/scratch', query: { tx: tx.hash } }, undefined, { shallow: true });
        } catch (err) {
            // 6. 失败：保留弹窗 4 秒显示简化错误
            setReceipt(r => ({ ...r, status: '交易失败', error: err.reason || '合约拒绝' }));
            setTimeout(() => setShowReceipt(false), 4000);
        }
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center px-6">
            <h1 className="text-4xl font-black mb-8">刮开涂层</h1>
            <SilverScratchCard revealText={prize} key={prize} ref={stockRef} />
            <div className="mt-10 flex gap-4">
                <button onClick={() => window.location.href = '/'} className="px-6 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 transition">返回首页</button>
                <button onClick={drawAgain} className="btn-glow">再抽一次</button>
            </div>
            {/* 实时库存（再抽后自动更新） */}
            <StockSection ref={stockRef} />
            {showReceipt && <ReceiptModal receipt={receipt} />}
        </div>
    );
}