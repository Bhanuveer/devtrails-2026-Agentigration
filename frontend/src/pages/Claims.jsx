import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getClaims, simulatePayout } from '../services/api'

const TRIGGER_META = {
    rain   : { icon: '🌧️', label: 'Heavy Rain',   payout_color: 'text-blue-600' },
    heat   : { icon: '🌡️', label: 'Extreme Heat',  payout_color: 'text-orange-600' },
    aqi    : { icon: '😷', label: 'Severe AQI',    payout_color: 'text-purple-600' },
    curfew : { icon: '🚧', label: 'Curfew/Bandh',  payout_color: 'text-yellow-600' },
    flood  : { icon: '🌊', label: 'Flash Flood',   payout_color: 'text-cyan-600' },
}

const STATUS_STYLE = {
    approved : 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    paid     : 'bg-green-100  text-green-700  border border-green-200',
    flagged  : 'bg-red-100    text-red-700    border border-red-200',
    pending  : 'bg-gray-100   text-gray-600   border border-gray-200',
}

export default function Claims() {
    const navigate    = useNavigate()
    const workerId    = localStorage.getItem('worker_id')
    const [claims, setClaims]       = useState([])
    const [loading, setLoading]     = useState(true)
    const [paying, setPaying]       = useState(null)
    const [payouts, setPayouts]     = useState({})
    const [filter, setFilter]       = useState('all')
    const [expanded, setExpanded]   = useState({})   // which fraud panel is open

    const load = () => getClaims(workerId)
        .then(r => setClaims(r.data))
        .catch(() => setClaims([]))
        .finally(() => setLoading(false))

    useEffect(() => { load() }, [])

    const handlePayout = async (claimId) => {
        setPaying(claimId)
        try {
            const res = await simulatePayout(claimId)
            setPayouts(p => ({ ...p, [claimId]: res.data }))
            load()
        } catch (e) {
            alert(e.response?.data?.detail || 'Payout error')
        } finally { setPaying(null) }
    }

    const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }))

    const filters   = ['all', 'approved', 'paid']
    const displayed = filter === 'all' ? claims : claims.filter(c => c.status === filter)
    const paid_total = claims.filter(c => c.status === 'paid').reduce((s, c) => s + c.payout_amount, 0)

    return (
        <div className="min-h-screen bg-[#F1F5F9]">

            {/* Header */}
            <div className="bg-[#0A1628] px-4 py-5">
                <div className="max-w-md mx-auto flex items-center gap-3">
                    <button onClick={() => navigate('/dashboard')}
                        className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center text-white text-sm">←</button>
                    <div className="flex-1">
                        <h1 className="text-white font-black text-lg">Claim History</h1>
                        <p className="text-[#64748B] text-xs">{claims.length} total · ₹{paid_total} income protected</p>
                    </div>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="max-w-md mx-auto px-4 mt-4">
                <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-gray-100 mb-4">
                    {filters.map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all
                            ${filter === f
                                ? 'bg-[#0A1628] text-white shadow'
                                : 'text-[#64748B] hover:text-[#0A1628]'}`}>
                            {f === 'all' ? `All (${claims.length})` :
                             f === 'approved' ? `Approved (${claims.filter(c=>c.status==='approved').length})` :
                             `Paid (${claims.filter(c=>c.status==='paid').length})`}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <p className="text-center text-[#38BDF8] mt-12 animate-pulse">Loading claims...</p>
                ) : displayed.length === 0 ? (
                    <div className="text-center mt-16">
                        <div className="text-6xl mb-4">📋</div>
                        <p className="text-[#1E3A5F] font-bold text-lg">No claims yet</p>
                        <p className="text-[#94A3B8] text-sm mt-1">
                            Claims appear automatically when disruptions hit your zone
                        </p>
                        <p className="text-[#64748B] text-xs mt-2">
                            Go to Dashboard → Simulate Trigger to demo the claim flow
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4 pb-8">
                        {displayed.map(c => {
                            const meta    = TRIGGER_META[c.trigger_type] || { icon: '⚡', label: c.trigger_type }
                            const payData = payouts[c.id]
                            const isOpen  = expanded[c.id]

                            return (
                                <div key={c.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">

                                    {/* Claim Header */}
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl">{meta.icon}</span>
                                                <div>
                                                    <p className="text-[#1E3A5F] font-black">{meta.label}</p>
                                                    <p className="text-[#94A3B8] text-xs font-mono">{c.reference_id}</p>
                                                </div>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full font-bold capitalize ${STATUS_STYLE[c.status] || STATUS_STYLE.pending}`}>
                                                {c.status}
                                            </span>
                                        </div>

                                        {/* Payout Amount */}
                                        <div className="bg-[#F8FAFC] rounded-xl p-3 mb-3 flex justify-between items-center">
                                            <span className="text-[#64748B] text-sm">Income Protected</span>
                                            <span className={`font-black text-2xl ${meta.payout_color || 'text-[#2563EB]'}`}>
                                                ₹{c.payout_amount}
                                            </span>
                                        </div>

                                        {/* 5-Step Transparency Pipeline */}
                                        <div className="mb-3">
                                            <p className="text-xs font-bold text-[#0A1628] mb-2">📋 Claim Transparency Feed</p>
                                            <div className="space-y-1.5">
                                                {[
                                                    {
                                                        icon   : '🌧️',
                                                        step   : 'Trigger Detected',
                                                        detail : `${meta.label} threshold crossed in your zone`,
                                                        time   : 'T+0 min',
                                                        done   : true
                                                    },
                                                    {
                                                        icon   : '📋',
                                                        step   : 'Claim Auto-Filed',
                                                        detail : `Reference ${c.reference_id} created automatically`,
                                                        time   : 'T+1 min',
                                                        done   : true
                                                    },
                                                    {
                                                        icon   : '🔍',
                                                        step   : 'AI Fraud Verified',
                                                        detail : `Fraud score: ${c.fraud_score?.toFixed(2) || '0.05'} — CLEAN ✅`,
                                                        time   : 'T+2 min',
                                                        done   : true
                                                    },
                                                    {
                                                        icon   : '💸',
                                                        step   : 'UPI Payout Processed',
                                                        detail : c.status === 'paid'
                                                            ? `₹${c.payout_amount} transferred to your UPI`
                                                            : 'Pending — click "Process UPI Payout" below',
                                                        time   : 'T+4 min',
                                                        done   : c.status === 'paid'
                                                    },
                                                    {
                                                        icon   : '✅',
                                                        step   : 'Record Updated',
                                                        detail : c.status === 'paid' ? 'Claim closed. +25 🪙 GigSure Coins awarded.' : 'Pending',
                                                        time   : 'T+5 min',
                                                        done   : c.status === 'paid'
                                                    },
                                                ].map((s, i) => (
                                                    <div key={i} className="flex items-start gap-2">
                                                        <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs
                                                            ${s.done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                                            {s.done ? '✓' : i + 1}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between">
                                                                <span className={`text-xs font-bold ${s.done ? 'text-[#0A1628]' : 'text-gray-400'}`}>
                                                                    {s.step}
                                                                </span>
                                                                <span className="text-xs text-gray-400">{s.time}</span>
                                                            </div>
                                                            <p className={`text-xs ${s.done ? 'text-gray-500' : 'text-gray-300'}`}>{s.detail}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Fraud Check Expandable */}
                                        <button onClick={() => toggleExpand(c.id)}
                                            className="w-full flex justify-between items-center text-xs text-[#64748B] bg-[#F8FAFC] rounded-xl p-3 mb-3">
                                            <span className="font-bold">🔍 View Fraud Check Details</span>
                                            <span>{isOpen ? '▲' : '▼'}</span>
                                        </button>
                                        {isOpen && (
                                            <div className="grid grid-cols-2 gap-2 text-xs mb-3 bg-[#F8FAFC] rounded-xl p-3">
                                                <span className="text-gray-500">🛰 GPS Spoofing</span>
                                                <span className="text-green-600 font-bold">Not detected ✅</span>
                                                <span className="text-gray-500">📡 Cell Tower</span>
                                                <span className="text-green-600 font-bold">Matched ✅</span>
                                                <span className="text-gray-500">📱 Platform Login</span>
                                                <span className="text-green-600 font-bold">Verified ✅</span>
                                                <span className="text-gray-500">👥 Zone Cluster</span>
                                                <span className="text-green-600 font-bold">Normal ✅</span>
                                                <span className="text-gray-500">🔢 Fraud Score</span>
                                                <span className="text-green-600 font-bold">{c.fraud_score?.toFixed(2) || '0.05'} — CLEAN</span>
                                            </div>
                                        )}

                                        {/* Payout success card */}
                                        {payData && payData.success && (
                                            <div className="bg-green-50 rounded-xl p-3 mb-3 border border-green-200">
                                                <p className="text-green-700 font-black text-sm">🎉 Payout Complete!</p>
                                                <p className="text-green-600 text-xs mt-1">{payData.message}</p>
                                                <p className="text-xs text-gray-500 font-mono mt-1">UPI Ref: {payData.upi_reference}</p>
                                                {payData.coins_awarded > 0 && (
                                                    <p className="text-amber-600 text-xs font-bold mt-1">
                                                        🪙 +{payData.coins_awarded} GigSure Coins earned
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Action buttons */}
                                        {c.status === 'approved' && (
                                            <button onClick={() => handlePayout(c.id)} disabled={paying === c.id}
                                                className="w-full bg-gradient-to-r from-[#2563EB] to-[#1d4ed8]
                                                text-white font-bold py-3 rounded-xl text-sm shadow-md">
                                                {paying === c.id ? '⏳ Processing UPI...' : `💸 Process UPI Payout — ₹${c.payout_amount}`}
                                            </button>
                                        )}
                                        {c.status === 'paid' && (
                                            <div className="w-full bg-green-50 text-green-700 font-bold py-3 rounded-xl text-sm text-center border border-green-200">
                                                ✅ ₹{c.payout_amount} Paid via UPI · +25 🪙 Coins
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}