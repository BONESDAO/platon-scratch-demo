export default function ReceiptModal({ receipt }) {
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="glass-card p-6 w-96">
                <div className="flex items-center justify-between mb-4"><h3 className="text-xl font-black text-emerald-400">Pluck Card</h3></div>
                <div className="space-y-3 text-sm"><div className="flex justify-between"><span>Order ID</span><span className="font-mono text-emerald-300">{receipt.orderId}</span></div><div className="flex justify-between"><span>Status</span><span className={receipt.status === '已签名' ? 'text-emerald-300' : 'text-amber-300'}>{receipt.status}</span></div><div className="flex justify-between"><span>Time（UTC）</span><span className="font-mono text-slate-300">{receipt.time}</span></div></div>
                <div className="mt-4 text-center text-amber-300">
                    {receipt.status === '交易失败' ? <span className="text-red-400">Failed: {receipt.error}</span> : 'Drawing ticket'}
                </div>
            </div>
        </div>
    );
}
