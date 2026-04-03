import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getClaims, simulatePayout } from '../services/api'

export default function Claims() {
    const navigate = useNavigate()
    const workerId = localStorage.getItem('worker_id')
    const [claims, setClaims] = useState([])
    const [loading, setLoading] = useState(true)
    const [paying, setPaying] = useState(null)
    const [payouts, setPayouts] = useState({})

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

    const statusStyle = s => ({
        approved: 'bg-yellow-100 text-yellow-700',
        paid: 'bg-green-100 text-green-700',
        flagged: 'bg-red-100 text-red-700',
        pending: 'bg-gray-100 text-gray-600',
    }[s] || 'bg-gray-100 text-gray-600')

    const triggerIcon = t => ({ rain: '🌧️', heat: '🌡️', aqi: '😷', curfew: '🚧', flood: '🌊' }[t] || '⚡')

    return (
        <div className="min-h-screen bg-[#F1F5F9]">
            <div className="bg-[#0A1628] px-4 py-5 flex items-center gap-3">
                <button onClick={() => navigate('/dashboard')}
                    className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center text-white">←</button>
                <div>
                    <h1 className="text-white font-black text-lg">Claim History</h1>
                    <p className="text-[#64748B] text-xs">{claims.length} total claims</p>
                </div>
            </div>

            <div className="max-w-md mx-auto p-4">
                {loading ? (
                    <p className="text-center text-[#38BDF8] mt-12 animate-pulse">Loading claims...</p>
                ) : claims.length === 0 ? (
                    <div className="text-center mt-16">
                        <div className="text-6xl mb-4">📋</div>
                        <p className="text-[#1E3A5F] font-bold text-lg">No claims yet</p>
                        <p className="text-[#94A3B8] text-sm mt-1">Claims appear automatically when disruptions hit your zone</p>
                    </div>
                ) : (
                    <div className="space-y-4 mt-2">
                        {claims.map(c => (
                            <div key={c.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{triggerIcon(c.trigger_type)}</span>
                                            <div>
                                                <p className="text-[#1E3A5F] font-bold capitalize">{c.trigger_type} Disruption</p>
                                                <p className="text-[#94A3B8] text-xs font-mono">{c.reference_id}</p>
                                            </div>
                                        </div>
                                        <span className={`text-xs px-3 py-1 rounded-full font-bold capitalize ${statusStyle(c.status)}`}>
                                            {c.status}
                                        </span>
                                    </div>

                                    <div className="bg-[#F8FAFC] rounded-xl p-3 mb-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[#64748B] text-sm">Payout Amount</span>
                                            <span className="text-[#2563EB] font-black text-xl">₹{c.payout_amount}</span>
                                        </div>
                                    </div>

                                    {/* Transparency Pipeline */}
                                    <div className="space-y-1.5 mb-3">
                                        {[
                                            { icon: '🌧️', step: 'Trigger Detected', done: true },
                                            { icon: '📋', step: 'Claim Initiated', done: true },
                                            { icon: '🔍', step: 'AI Fraud Verification', done: true },
                                            { icon: '💸', step: 'Payout Processed', done: c.status === 'paid' },
                                            { icon: '✅', step: 'Record Updated', done: c.status === 'paid' },
                                        ].map((s, i) => (
                                            <div key={i} className="flex items-center gap-2 text-xs">
                                                <span className={s.done ? 'text-green-500' : 'text-gray-300'}>
                                                    {s.done ? '✅' : '⏳'}
                                                </span>
                                                <span className={s.done ? 'text-gray-700' : 'text-gray-400'}>{s.step}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Payout result */}
                                    {payouts[c.id] && (
                                        <div className="bg-green-50 rounded-xl p-3 mb-3 border border-green-200">
                                            <p className="text-green-700 font-bold text-sm">🎉 Payout Complete!</p>
                                            <p className="text-xs text-gray-500 font-mono mt-1">UPI Ref: {payouts[c.id].upi_reference}</p>
                                        </div>
                                    )}

                                    {/* Payout button */}
                                    {c.status === 'approved' && (
                                        <button onClick={() => handlePayout(c.id)} disabled={paying === c.id}
                                            className="w-full bg-[#2563EB] text-white font-bold py-2.5 rounded-xl text-sm">
                                            {paying === c.id ? '⏳ Processing UPI...' : '💸 Process UPI Payout'}
                                        </button>
                                    )}
                                    {c.status === 'paid' && (
                                        <div className="w-full bg-green-100 text-green-700 font-bold py-2.5 rounded-xl text-sm text-center">
                                            ✅ Paid via UPI
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}