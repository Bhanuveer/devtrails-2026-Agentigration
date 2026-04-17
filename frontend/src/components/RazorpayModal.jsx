/**
 * RazorpayModal.jsx — GigSure Phase 3
 * Simulates a real Razorpay checkout modal with UPI / Card / NetBanking tabs.
 * Uses GigSure's mock Razorpay test mode backend.
 */

import { useState } from 'react'
import { razorpayCreateOrder, razorpayVerify } from '../services/api'

const PAYMENT_METHODS = [
    { id: 'upi',        label: 'UPI',         icon: '📲' },
    { id: 'card',       label: 'Card',        icon: '💳' },
    { id: 'netbanking', label: 'Net Banking',  icon: '🏦' },
]

export default function RazorpayModal({ claim, worker, onSuccess, onClose }) {
    const [step, setStep]         = useState('method')   // method → form → processing → success
    const [method, setMethod]     = useState('upi')
    const [upiId, setUpiId]       = useState('')
    const [cardNo, setCardNo]     = useState('')
    const [expiry, setExpiry]     = useState('')
    const [cvv, setCvv]           = useState('')
    const [bank, setBank]         = useState('HDFC Bank')
    const [order, setOrder]       = useState(null)
    const [result, setResult]     = useState(null)
    const [error, setError]       = useState('')

    // Step 1: Create order
    const handleProceed = async () => {
        setError('')
        setStep('processing')
        try {
            const res = await razorpayCreateOrder({
                amount      : claim.payout_amount,
                claim_id    : claim.id,
                trigger_type: claim.trigger_type,
                worker_name : worker?.full_name || 'Worker',
                phone       : worker?.phone || '9999999999',
            })
            setOrder(res.data)
            setStep('form')
        } catch {
            setError('Could not initiate payment. Please retry.')
            setStep('method')
        }
    }

    // Step 2: Verify payment
    const handlePay = async () => {
        if (method === 'upi' && !upiId.includes('@')) {
            setError('Enter a valid UPI ID (e.g. name@upi)')
            return
        }
        setError('')
        setStep('processing')
        try {
            const res = await razorpayVerify({
                claim_id  : claim.id,
                order_id  : order?.order_id,
                amount_inr: claim.payout_amount,
                method,
                upi_id    : upiId,
                bank,
            })
            setResult(res.data)
            setStep('success')
            setTimeout(() => onSuccess(res.data), 3000)
        } catch {
            setError('Payment failed. Please retry.')
            setStep('form')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && onClose()}>

            <div className="w-full max-w-md bg-white rounded-t-3xl overflow-hidden animate-slide-up shadow-2xl">

                {/* Razorpay Header */}
                <div className="bg-[#072654] px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white rounded-lg p-1.5">
                            <span className="text-lg">⚡</span>
                        </div>
                        <div>
                            <p className="text-white font-black text-sm">GigSure Parametric Insurance</p>
                            <p className="text-blue-300 text-xs">Powered by Razorpay TEST MODE</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/60 hover:text-white text-xl font-bold">×</button>
                </div>

                {/* Amount Banner */}
                <div className="bg-[#F7F9FF] border-b border-gray-100 px-5 py-3 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-gray-500">Claim Payout Amount</p>
                        <p className="text-2xl font-black text-[#072654]">₹{claim.payout_amount}</p>
                        <p className="text-xs text-gray-400 mt-0.5 capitalize">{claim.trigger_type} disruption payout</p>
                    </div>
                    <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full">
                        🧪 TEST MODE
                    </span>
                </div>

                <div className="px-5 py-4">

                    {/* ── STEP: METHOD SELECT ── */}
                    {step === 'method' && (
                        <div>
                            <p className="text-sm font-bold text-gray-700 mb-3">Select Payment Method</p>
                            <div className="flex gap-2 mb-4">
                                {PAYMENT_METHODS.map(m => (
                                    <button key={m.id} onClick={() => setMethod(m.id)}
                                        className={`flex-1 py-3 rounded-xl text-xs font-bold border-2 transition-all flex flex-col items-center gap-1
                                        ${method === m.id
                                            ? 'border-[#072654] bg-[#072654]/5 text-[#072654]'
                                            : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                                        <span className="text-lg">{m.icon}</span>
                                        {m.label}
                                    </button>
                                ))}
                            </div>

                            {/* Method preview */}
                            {method === 'upi' && (
                                <div className="bg-blue-50 rounded-xl p-3 mb-4 text-xs text-blue-700">
                                    💡 Enter your UPI ID (e.g. <strong>worker@upi</strong>) to receive ₹{claim.payout_amount} instantly
                                </div>
                            )}
                            {method === 'card' && (
                                <div className="bg-purple-50 rounded-xl p-3 mb-4 text-xs text-purple-700">
                                    💳 Amount will be credited to your linked bank account within 1-2 hours
                                </div>
                            )}
                            {method === 'netbanking' && (
                                <div className="bg-green-50 rounded-xl p-3 mb-4 text-xs text-green-700">
                                    🏦 Funds credited directly to your bank account in under 10 minutes
                                </div>
                            )}

                            {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

                            <button onClick={handleProceed}
                                className="w-full bg-[#072654] text-white font-black py-4 rounded-2xl text-sm shadow-lg active:scale-95 transition-transform">
                                Continue →
                            </button>
                        </div>
                    )}

                    {/* ── STEP: PAYMENT FORM ── */}
                    {step === 'form' && (
                        <div>
                            {order && (
                                <div className="bg-gray-50 rounded-xl p-3 mb-4 flex justify-between text-xs text-gray-500">
                                    <span>Order ID</span>
                                    <span className="font-mono font-bold text-gray-700">{order.order_id}</span>
                                </div>
                            )}

                            {method === 'upi' && (
                                <div className="mb-4">
                                    <label className="text-xs font-bold text-gray-600 mb-2 block">UPI ID</label>
                                    <input
                                        value={upiId}
                                        onChange={e => setUpiId(e.target.value)}
                                        placeholder="yourname@upi"
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#072654] outline-none"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">e.g. worker@okaxis, name@ybl, phone@paytm</p>
                                </div>
                            )}

                            {method === 'card' && (
                                <div className="space-y-3 mb-4">
                                    <input value={cardNo} onChange={e => setCardNo(e.target.value.replace(/\D/g, '').slice(0,16))}
                                        placeholder="Card number (test: 4111 1111 1111 1111)"
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#072654] outline-none" />
                                    <div className="flex gap-2">
                                        <input value={expiry} onChange={e => setExpiry(e.target.value)}
                                            placeholder="MM/YY" className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#072654] outline-none" />
                                        <input value={cvv} onChange={e => setCvv(e.target.value.slice(0,3))}
                                            placeholder="CVV" className="w-24 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#072654] outline-none" />
                                    </div>
                                    <p className="text-xs text-blue-600">Use test card: 4111 1111 1111 1111 · 12/26 · 123</p>
                                </div>
                            )}

                            {method === 'netbanking' && (
                                <div className="mb-4">
                                    <label className="text-xs font-bold text-gray-600 mb-2 block">Select Bank</label>
                                    <select value={bank} onChange={e => setBank(e.target.value)}
                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#072654] outline-none bg-white">
                                        {['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak Bank', 'Bank of Baroda'].map(b => (
                                            <option key={b}>{b}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

                            <button onClick={handlePay}
                                className="w-full bg-[#3395FF] text-white font-black py-4 rounded-2xl text-sm shadow-lg active:scale-95 transition-transform">
                                Pay ₹{claim.payout_amount} →
                            </button>
                            <button onClick={() => setStep('method')} className="w-full text-gray-400 text-xs mt-2 py-2">
                                ← Change payment method
                            </button>
                        </div>
                    )}

                    {/* ── STEP: PROCESSING ── */}
                    {step === 'processing' && (
                        <div className="py-8 flex flex-col items-center gap-4">
                            <div className="w-14 h-14 rounded-full border-4 border-[#3395FF] border-t-transparent animate-spin" />
                            <p className="text-sm font-bold text-gray-700">Processing payment...</p>
                            <p className="text-xs text-gray-400">Verifying with Razorpay secure gateway</p>
                        </div>
                    )}

                    {/* ── STEP: SUCCESS ── */}
                    {step === 'success' && result && (
                        <div className="py-4 flex flex-col items-center gap-3">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl">
                                ✅
                            </div>
                            <p className="text-green-700 font-black text-lg">₹{result.amount_inr} Received!</p>
                            <p className="text-gray-500 text-xs text-center">{result.message}</p>

                            <div className="w-full bg-gray-50 rounded-2xl p-4 space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Payment ID</span>
                                    <span className="font-mono font-bold text-gray-700">{result.payment_id}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Order ID</span>
                                    <span className="font-mono font-bold text-gray-700">{result.order_id}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Method</span>
                                    <span className="font-bold text-gray-700 capitalize">{result.method?.toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Settled in</span>
                                    <span className="font-bold text-green-600">{result.settled_in}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Status</span>
                                    <span className="text-green-600 font-bold">✅ Verified</span>
                                </div>
                            </div>

                            {result.coins_awarded > 0 && (
                                <p className="text-amber-600 font-bold text-sm">
                                    🪙 +{result.coins_awarded} GigSure Coins Earned!
                                </p>
                            )}

                            <div className="bg-blue-50 rounded-xl px-4 py-2 text-xs text-blue-600 text-center">
                                🧪 Test Mode — No real money transferred
                            </div>
                        </div>
                    )}

                </div>

                {/* Razorpay Footer */}
                <div className="px-5 pb-5 pt-1 flex items-center justify-center gap-2">
                    <span className="text-gray-300 text-xs">Secured by</span>
                    <span className="text-[#072654] font-black text-xs">Razorpay</span>
                    <span className="text-gray-200 text-xs">·</span>
                    <span className="text-gray-300 text-xs">256-bit SSL</span>
                </div>

            </div>
        </div>
    )
}
