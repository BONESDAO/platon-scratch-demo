import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { ethers } from 'ethers'
import ReceiptModal from '../components/ReceiptModal'
import StockSection from '../components/StockSection'
import { CHAIN_ID, RPC, CONTRACT, ABI } from '../utils/contract'

const DEVNET2 = { chainId: ethers.utils.hexValue(CHAIN_ID), chainName: 'PlatON Mainnet', nativeCurrency: { name: 'LAT', symbol: 'LAT', decimals: 18 }, rpcUrls: [RPC], blockExplorerUrls: ['https://scan.platon.network/'] }

export default function Home() {
    const [account, setAccount] = useState('')
    const [showReceipt, setShowReceipt] = useState(false)
    const [receipt, setReceipt] = useState(null)
    const router = useRouter()

    useEffect(() => {
        function handleConnected(e) { setAccount(e.detail) }
        window.addEventListener('wallet-connected', handleConnected)
        return () => window.removeEventListener('wallet-connected', handleConnected)
    }, [])

    async function connect() {
        if (!window.ethereum) return alert('Please install MetaMask')
        const p = new ethers.providers.Web3Provider(window.ethereum)
        try { await p.send('eth_requestAccounts', []) } catch (e) { return }
        const a = await p.getSigner().getAddress()
        setAccount(a)
    }

    async function startDraw() {
        if (!account) return connect();
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        // ① 先确保链正确（不弹多余窗）
        const chainId = await provider.getNetwork().then(n => n.chainId);
        if (chainId !== CHAIN_ID) {
            try { await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: ethers.utils.hexValue(CHAIN_ID) }] }); }
            catch (e) { alert('请手动切换到 PlatON Mainnet'); return; }
        }
        // ② 生成订单 & 弹收据
        const orderId = 'PlatON-' + Math.random().toString(16).slice(2, 8).toUpperCase();
        const utcTime = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
        setReceipt({ orderId, status: '等待签名', time: utcTime });
        setShowReceipt(true);
        // ③ 交易
        const signer = provider.getSigner();
        const c = new ethers.Contract(CONTRACT, ABI, signer);
        try {
            const tx = await c.play({ value: ethers.utils.parseEther('0.033') });
            setReceipt(r => ({ ...r, status: '已签名' }));
            await tx.wait();
            setShowReceipt(false);
            router.push({ pathname: '/scratch', query: { tx: tx.hash } });
        } catch (err) {
            // ④ 失败时收据弹窗显示错误 & 提供重试
            setReceipt(r => ({ ...r, status: '交易失败', error: err.reason || err.message }));
            setTimeout(() => setShowReceipt(false), 4000); // 4 秒后自动关
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-100">
            <header className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
                <div className="text-2xl font-black tracking-wider">PLATON Pluck</div>
                <button onClick={connect} className="px-4 py-2 rounded-2xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition">
                    {account ? `${account.slice(0, 6)}…${account.slice(-4)}` : 'Connect'}
                </button>
            </header>
            <main className="max-w-5xl mx-auto px-6 pt-16 pb-24 text-center">
                <h1 className="text-6xl font-black tracking-tight">How's your luck today?</h1>
                <p className="mt-3 text-slate-300"> per address during the event have <span className="text-emerald-400 font-bold">30</span> free chances</p>
                <div className="mt-10">
                    <button onClick={startDraw} className="btn-glow">Play Now</button>
                </div>
            </main>
            <StockSection />
            {showReceipt && <ReceiptModal receipt={receipt} />}
        </div>
    );
}
