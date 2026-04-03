import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboard, checkTrigger, simulatePayout } from '../services/api'

export default function Dashboard() {
    const navigate = useNavigate()
    const workerId = localStorage.getItem('worker_id')
    const workerName = localStorage.getItem('worker_name') || 'Worker'
    const [data, setData] = useState(null)
    const [checking, setChecking] = useState(false)
    const [paying, setPaying] = useState(false)
    const [alert, setAlert] = useState(null)
    const [payout, setPayout] = useState(null)

    const load = () => getDashboard(workerId).then(r => setData(r.data)).catch(console.error)
    useEffect(() => { load() }, [])

    const handleTrigger = async () => {
        setChecking(true); setAlert(null); setPayout(null)
        try {
            const res = await checkTrigger(workerId)
            setAlert(res.data)
            if (res.data.triggered) load()
        } catch (e) {
            setAlert({ triggered: false, message: e.response?.data?.detail || 'Error' })
        } finally { setChecking(false) }
    }

    const handlePayout = async (claimId) => {
        setPaying(true)
        try {
            const res = await simulatePayout(claimId)
            setPayout(res.data)
            load()
        } catch (e) {
            alert('Payout error: ' + (e.response?.data?.detail || 'Failed'))
        } finally { setPaying(false) }
    }

    if (!data) return (
        <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
            <div className="text-center">
                <div className="text-4xl mb-3">⚡</div>
                <p className="text-[#38BDF8] animate-pulse">Loading GigSure...</p>
            </div>
        </div>
    )

    const firstName = workerName.split(' ')[0]

    return (
        <div className="min-h-screen bg-[#F1F5F9]">

            {/* Header */}
            <div className="bg-[#0A1628] px-4 pt-8 pb-16">
                <div className="max-w-md mx-auto flex justify-between items-start">
                    <div>
                        <p className="text-[#64748B] text-xs mb-1">⚡ GigSure Dashboard</p>
                        <h1 className="text-white text-2xl font-black">Hello, {firstName} 👋</h1>
                        <p className="text-[#38BDF8] text-sm">Your income is protected this week</p>
                    </div>
                    <div className="text-right">
                        <div className="bg-[#F59E0B] text-[#0A1628] text-xs font-bold px-3 py-1 rounded-full mb-2">
                            Trust: {data.worker.trust_score}
                        </div>
                        <button onClick={() => { localStorage.clear(); navigate('/') }}
                            className="text-[#475569] text-xs hover:text-red-400">Logout</button>
                    </div>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 -mt-10 space-y-4 pb-8">

                {/* Policy Card */}
                {data.policy.active ? (
                    <div className="bg-gradient-to-r from-[#16A34A] to-[#15803d] rounded-2xl p-5 shadow-xl shadow-green-900/20">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                    <span className="text-green-100 text-xs font-bold uppercase tracking-wide">Policy Active</span>
                                </div>
                                <p className="text-white font-black text-xl capitalize">{data.policy.plan_type} Plan</p>
                                <p className="text-green-100 text-sm">₹{data.policy.final_premium}/week · Max ₹{data.policy.max_daily_payout}/day</p>
                            </div>
                            <div className="bg-white/20 rounded-xl p-3">
                                <span className="text-2xl">🛡️</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-5 shadow-xl">
                        <p className="text-white font-bold text-lg">⚠️ No Active Policy</p>
                        <p className="text-red-100 text-sm mb-3">You are not covered this week</p>
                        <button onClick={() => navigate('/policy')}
                            className="bg-white text-red-600 font-bold px-4 py-2 rounded-xl text-sm">
                            Get Covered Now →
                        </button>
                    </div>
                )}

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                    <StatCard label="Premium" value={`₹${data.policy.final_premium || '—'}`} sub="this week" color="blue" />
                    <StatCard label="Saved" value={`₹${data.stats.total_saved}`} sub="total" color="green" />
                    <StatCard label="Claims" value={data.stats.total_claims} sub="filed" color="amber" />
                </div>

                {/* Trigger Alert */}
                {alert && (
                    <div className={`rounded-2xl p-4 border-2 ${alert.triggered
                            ? 'bg-green-50 border-green-400'
                            : 'bg-blue-50 border-blue-200'
                        }`}>
                        <p className={`font-bold text-sm mb-1 ${alert.triggered ? 'text-green-700' : 'text-blue-700'}`}>
                            {alert.triggered ? '🚨 Disruption Detected!' : '✅ Zone Clear'}
                        </p>
                        <p className="text-xs text-gray-600">{alert.message}</p>
                        {alert.triggered && alert.claim && (
                            <div className="mt-3 bg-white rounded-xl p-3 space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Trigger Type</span>
                                    <span className="font-bold capitalize text-red-600">{alert.claim.trigger_type}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Payout Amount</span>
                                    <span className="font-bold text-green-600">₹{alert.claim.payout_amount}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Reference</span>
                                    <span className="font-mono text-xs text-gray-600">{alert.claim.reference_id}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Status</span>
                                    <span className="font-bold text-green-600">{alert.claim.status} ✅</span>
                                </div>
                                <button onClick={() => handlePayout(alert.claim.id || data.stats.total_claims)}
                                    disabled={paying}
                                    className="w-full mt-2 bg-[#2563EB] text-white font-bold py-2 rounded-xl text-sm">
                                    {paying ? '⏳ Processing...' : '💸 Simulate UPI Payout'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Payout Result */}
                {payout && payout.success && (
                    <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-4">
                        <p className="text-green-700 font-black text-lg">🎉 Payout Complete!</p>
                        <p className="text-green-600 text-sm mb-3">₹{payout.payout_amount} transferred via UPI</p>
                        <p className="text-xs text-gray-500 font-mono mb-3">Ref: {payout.upi_reference}</p>

                        {/* Pipeline */}
                        <div className="space-y-2">
                            {payout.pipeline.map((step, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                    <span className="text-green-500">{step.status}</span>
                                    <span className="text-gray-700 font-medium">{step.name}</span>
                                    <span className="ml-auto text-gray-400">{step.time}</span>
                                </div>
                            ))}
                        </div>

                        {/* Fraud Check */}
                        <div className="mt-3 bg-white rounded-xl p-3">
                            <p className="text-xs font-bold text-gray-600 mb-2">🔍 Fraud Check Result</p>
                            <div className="grid grid-cols-2 gap-1 text-xs">
                                <span className="text-gray-500">Mock GPS</span>
                                <span className="text-green-600 font-bold">✅ Not detected</span>
                                <span className="text-gray-500">Cell Tower</span>
                                <span className="text-green-600 font-bold">✅ Matched</span>
                                <span className="text-gray-500">Platform Login</span>
                                <span className="text-green-600 font-bold">✅ Verified</span>
                                <span className="text-gray-500">Fraud Score</span>
                                <span className="text-green-600 font-bold">0.05 — CLEAN</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <button onClick={handleTrigger} disabled={checking}
                    className="w-full bg-[#0A1628] hover:bg-[#1E3A5F] text-white font-bold py-4 rounded-2xl
            transition-all shadow-lg flex items-center justify-center gap-2">
                    <span className="text-xl">🌧️</span>
                    <span>{checking ? 'Scanning your zone...' : 'Check Zone for Disruption'}</span>
                </button>

                <button onClick={() => navigate('/claims')}
                    className="w-full bg-white border-2 border-[#E2E8F0] hover:border-[#2563EB]
            text-[#1E3A5F] font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2">
                    <span>📋</span><span>View Claim History</span>
                </button>

                <button onClick={() => navigate('/policy')}
                    className="w-full bg-white border-2 border-[#E2E8F0] hover:border-[#F59E0B]
            text-[#1E3A5F] font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2">
                    <span>🔄</span><span>Change Plan</span>
                </button>

            </div>
        </div>
    )
}

function StatCard({ label, value, sub, color }) {
    const colors = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        amber: 'bg-amber-50 text-amber-600',
    }
    return (
        <div className={`${colors[color]} rounded-2xl p-3 text-center`}>
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="font-black text-lg">{value}</p>
            <p className="text-xs text-gray-400">{sub}</p>
        </div>
    )
}