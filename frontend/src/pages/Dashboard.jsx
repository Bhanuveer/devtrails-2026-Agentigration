import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboard, simulateTrigger, simulatePayout, getLiveTriggers, getActuarial } from '../services/api'

// ── Trigger config ─────────────────────────────────────────────
const TRIGGER_CONFIG = {
    rain   : { icon: '🌧️', label: 'Heavy Rain',   color: 'from-blue-600 to-blue-800',   payout: 400, threshold: '50mm/24hr' },
    heat   : { icon: '🌡️', label: 'Extreme Heat',  color: 'from-orange-500 to-red-600',  payout: 300, threshold: '43°C' },
    aqi    : { icon: '😷', label: 'Severe AQI',    color: 'from-purple-600 to-purple-800', payout: 350, threshold: 'AQI 300' },
    curfew : { icon: '🚧', label: 'Curfew/Bandh',  color: 'from-yellow-600 to-amber-700', payout: 500, threshold: 'Active Alert' },
    flood  : { icon: '🌊', label: 'Flash Flood',   color: 'from-cyan-600 to-blue-800',   payout: 450, threshold: 'Red/Orange Alert' },
}

export default function Dashboard() {
    const navigate    = useNavigate()
    const workerId    = localStorage.getItem('worker_id')
    const workerName  = localStorage.getItem('worker_name') || 'Worker'

    const [data, setData]           = useState(null)
    const [simResult, setSimResult] = useState(null)
    const [payout, setPayout]       = useState(null)
    const [simulating, setSimulating] = useState(null)   // which trigger is running
    const [paying, setPaying]       = useState(false)
    const [liveTriggers, setLiveTriggers] = useState(null)
    const [actuarial, setActuarial] = useState(null)
    const [activeTab, setActiveTab] = useState('simulate')  // simulate | actuarial

    const load = () => getDashboard(workerId).then(r => setData(r.data)).catch(console.error)

    useEffect(() => {
        load()
        // Load live trigger statuses
        getLiveTriggers(workerId)
            .then(r => setLiveTriggers(r.data))
            .catch(console.error)
        // Load actuarial data
        getActuarial(workerId)
            .then(r => setActuarial(r.data))
            .catch(console.error)
    }, [])

    // ── Simulate any trigger ──────────────────────────────────
    const handleSimulate = async (triggerType) => {
        setSimulating(triggerType)
        setSimResult(null)
        setPayout(null)
        try {
            const res = await simulateTrigger(workerId, triggerType)
            setSimResult({ ...res.data, triggerType })
            load()
        } catch (e) {
            setSimResult({
                triggered: false,
                message: e.response?.data?.detail || 'Simulation error',
                triggerType
            })
        } finally { setSimulating(null) }
    }

    // ── Process UPI payout ────────────────────────────────────
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
                <div className="text-4xl mb-3 animate-bounce">⚡</div>
                <p className="text-[#38BDF8] animate-pulse text-sm">Loading GigSure...</p>
            </div>
        </div>
    )

    const firstName = workerName.split(' ')[0]
    const cfg       = simResult?.triggerType ? TRIGGER_CONFIG[simResult.triggerType] : null

    return (
        <div className="min-h-screen bg-[#F1F5F9]">

            {/* ── Header ─────────────────────────────────────── */}
            <div className="bg-[#0A1628] px-4 pt-8 pb-16">
                <div className="max-w-md mx-auto flex justify-between items-start">
                    <div>
                        <p className="text-[#64748B] text-xs mb-1">⚡ GigSure Dashboard</p>
                        <h1 className="text-white text-2xl font-black">Hello, {firstName} 👋</h1>
                        <p className="text-[#38BDF8] text-sm">Your income is protected this week</p>
                    </div>
                    <div className="text-right">
                        <div className="bg-[#F59E0B] text-[#0A1628] text-xs font-bold px-3 py-1 rounded-full mb-2">
                            Trust: {Math.round(data.worker.trust_score)}
                        </div>
                        <button onClick={() => { localStorage.clear(); navigate('/') }}
                            className="text-[#475569] text-xs hover:text-red-400">Logout</button>
                    </div>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 -mt-10 space-y-4 pb-24">

                {/* ── Policy Card ──────────────────────────────── */}
                {data.policy.active ? (
                    <div className="bg-gradient-to-r from-[#16A34A] to-[#15803d] rounded-2xl p-5 shadow-xl shadow-green-900/30">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                    <span className="text-green-100 text-xs font-bold uppercase tracking-wide">Policy Active</span>
                                </div>
                                <p className="text-white font-black text-xl capitalize">{data.policy.plan_type} Plan</p>
                                <p className="text-green-100 text-sm">₹{data.policy.final_premium}/week · Max ₹{data.policy.max_daily_payout}/day</p>
                            </div>
                            <div className="bg-white/20 rounded-xl p-3"><span className="text-2xl">🛡️</span></div>
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

                {/* ── Stats Row ────────────────────────────────── */}
                <div className="grid grid-cols-3 gap-3">
                    <StatCard label="Premium" value={`₹${data.policy.final_premium || '—'}`} sub="this week" color="blue" />
                    <StatCard label="Saved"   value={`₹${data.stats.total_saved}`}            sub="total"     color="green" />
                    <StatCard label="Claims"  value={data.stats.total_claims}                  sub="filed"     color="amber" />
                </div>

                {/* ── Tab Switcher ─────────────────────────────── */}
                <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-gray-100">
                    {[
                        { key: 'simulate',  label: '🚨 Simulate Trigger' },
                        { key: 'actuarial', label: '📊 Actuarial' },
                    ].map(t => (
                        <button key={t.key} onClick={() => setActiveTab(t.key)}
                            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all
                            ${activeTab === t.key
                                ? 'bg-[#0A1628] text-white shadow'
                                : 'text-[#64748B] hover:text-[#0A1628]'}`}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ══════════════════════════════════════════════ */}
                {/* TAB 1: TRIGGER SIMULATION                      */}
                {/* ══════════════════════════════════════════════ */}
                {activeTab === 'simulate' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <p className="font-black text-[#0A1628] text-sm">5 Parametric Triggers — Demo Mode</p>
                            <p className="text-[#64748B] text-xs mt-0.5">Click any trigger to simulate a disruption in your zone</p>
                        </div>
                        <div className="p-4 grid grid-cols-1 gap-3">
                            {Object.entries(TRIGGER_CONFIG).map(([type, cfg]) => (
                                <button
                                    key={type}
                                    onClick={() => handleSimulate(type)}
                                    disabled={simulating !== null}
                                    className={`w-full flex items-center justify-between
                                        bg-gradient-to-r ${cfg.color} text-white
                                        rounded-xl px-4 py-3 transition-all
                                        hover:scale-[1.02] active:scale-100
                                        disabled:opacity-50 disabled:cursor-not-allowed shadow-md`}>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{cfg.icon}</span>
                                        <div className="text-left">
                                            <p className="font-bold text-sm">{cfg.label}</p>
                                            <p className="text-white/70 text-xs">Threshold: {cfg.threshold} · Payout: ₹{cfg.payout}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold">
                                        {simulating === type ? '⏳' : '▶'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Simulation Result ────────────────────────── */}
                {activeTab === 'simulate' && simResult && (
                    <div className={`rounded-2xl border-2 overflow-hidden
                        ${simResult.triggered ? 'border-green-400 bg-green-50' : 'border-red-200 bg-red-50'}`}>

                        {/* Result header */}
                        <div className={`p-4 ${simResult.triggered ? 'bg-green-500' : 'bg-red-500'}`}>
                            <p className="text-white font-black text-sm">
                                {simResult.triggered ? '🚨 DISRUPTION DETECTED — Claim Auto-Filed!' : '⚠️ ' + simResult.message}
                            </p>
                            {simResult.triggered && (
                                <p className="text-white/80 text-xs mt-1">{simResult.message}</p>
                            )}
                        </div>

                        {/* 4-Step Claim Pipeline */}
                        {simResult.triggered && simResult.claim_pipeline && (
                            <div className="p-4 space-y-2">
                                <p className="text-xs font-bold text-[#0A1628] mb-3">📋 Claim Pipeline — Live Status</p>
                                {simResult.claim_pipeline.map((step, i) => (
                                    <div key={i} className="flex items-start gap-3 bg-white rounded-xl p-3 shadow-sm">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0
                                            ${step.status === 'complete' ? 'bg-green-500 text-white' : 'bg-[#F59E0B] text-white'}`}>
                                            {step.status === 'complete' ? '✓' : '⏳'}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <p className="text-xs font-bold text-[#0A1628]">Step {step.step}: {step.name}</p>
                                                <span className="text-xs text-[#64748B]">{step.timestamp}</span>
                                            </div>
                                            <p className="text-xs text-[#64748B] mt-0.5">{step.detail}</p>
                                            {/* Fraud check detail (step 3) */}
                                            {step.fraud_detail && (
                                                <div className="mt-2 grid grid-cols-2 gap-1">
                                                    <span className="text-xs text-gray-500">🛰 GPS Spoofing</span>
                                                    <span className="text-xs text-green-600 font-bold">Not detected ✅</span>
                                                    <span className="text-xs text-gray-500">📡 Cell Tower</span>
                                                    <span className="text-xs text-green-600 font-bold">Matched ✅</span>
                                                    <span className="text-xs text-gray-500">📱 Platform Login</span>
                                                    <span className="text-xs text-green-600 font-bold">Verified ✅</span>
                                                    <span className="text-xs text-gray-500">🔢 Fraud Score</span>
                                                    <span className="text-xs text-green-600 font-bold">{step.fraud_detail.fraud_score} — {step.fraud_detail.verdict}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Claim details */}
                                <div className="bg-white rounded-xl p-3 shadow-sm mt-1">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-500">Reference ID</span>
                                        <span className="font-mono font-bold">{simResult.claim?.reference_id}</span>
                                    </div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-500">Trigger Type</span>
                                        <span className="font-bold capitalize text-red-600">{simResult.claim?.trigger_type}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-500">Payout Amount</span>
                                        <span className="font-black text-green-600 text-base">₹{simResult.claim?.payout_amount}</span>
                                    </div>
                                </div>

                                {/* Payout button */}
                                {!payout && (
                                    <button onClick={() => handlePayout(simResult.claim?.id)}
                                        disabled={paying}
                                        className="w-full bg-gradient-to-r from-[#2563EB] to-[#1d4ed8] text-white font-bold py-3.5 rounded-xl text-sm shadow-lg">
                                        {paying ? '⏳ Processing UPI Transfer...' : `💸 Process UPI Payout — ₹${simResult.claim?.payout_amount}`}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Payout success */}
                        {payout && payout.success && (
                            <div className="p-4 bg-green-50 border-t border-green-200">
                                <div className="bg-green-500 rounded-xl p-4 text-white text-center mb-3">
                                    <p className="text-2xl font-black">🎉 ₹{payout.payout_amount} Paid!</p>
                                    <p className="text-sm text-green-100 mt-1">{payout.message}</p>
                                    <p className="text-xs text-green-200 mt-1 font-mono">{payout.upi_reference}</p>
                                </div>
                                <div className="space-y-1.5">
                                    {payout.pipeline.map((step, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs bg-white rounded-lg p-2">
                                            <span className="text-green-500 font-bold">{step.status}</span>
                                            <span className="font-medium text-gray-700">{step.name}</span>
                                            <span className="ml-auto text-gray-400">{step.time}</span>
                                        </div>
                                    ))}
                                </div>
                                {payout.coins_awarded > 0 && (
                                    <div className="mt-3 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl p-3 text-center">
                                        <p className="text-[#92400E] font-bold text-sm">🪙 +{payout.coins_awarded} GigSure Coins Earned!</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════ */}
                {/* TAB 2: ACTUARIAL DASHBOARD                     */}
                {/* ══════════════════════════════════════════════ */}
                {activeTab === 'actuarial' && actuarial && (
                    <div className="space-y-4">

                        {/* BCR / Loss Ratio */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                            <p className="font-black text-[#0A1628] text-sm mb-3">📊 Actuarial Health Metrics</p>

                            <div className={`rounded-xl p-3 mb-3 text-center
                                ${actuarial.actuarial.health === 'good' ? 'bg-green-50 border border-green-200' :
                                  actuarial.actuarial.health === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                                  'bg-red-50 border border-red-200'}`}>
                                <p className={`font-black text-2xl
                                    ${actuarial.actuarial.health === 'good' ? 'text-green-600' :
                                      actuarial.actuarial.health === 'warning' ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {actuarial.actuarial.bcr === 0 ? '—' : actuarial.actuarial.bcr}
                                </p>
                                <p className="text-xs text-gray-500">BCR (Burning Cost Rate)</p>
                                <p className={`text-xs font-bold mt-1
                                    ${actuarial.actuarial.health === 'good' ? 'text-green-600' : 'text-yellow-600'}`}>
                                    {actuarial.actuarial.status}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-center">
                                <div className="bg-[#F1F5F9] rounded-xl p-3">
                                    <p className="text-[#0A1628] font-black text-lg">{actuarial.platform_summary.loss_ratio_pct}%</p>
                                    <p className="text-xs text-gray-500">Loss Ratio</p>
                                    <p className="text-xs text-gray-400">Target: 55–70%</p>
                                </div>
                                <div className="bg-[#F1F5F9] rounded-xl p-3">
                                    <p className="text-[#0A1628] font-black text-lg">{actuarial.actuarial.paise_per_rupee || 0}p</p>
                                    <p className="text-xs text-gray-500">per ₹1 → Payouts</p>
                                    <p className="text-xs text-gray-400">Target: 65p</p>
                                </div>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                <div className="flex justify-between bg-gray-50 rounded-lg p-2">
                                    <span className="text-gray-500">Premium Collected</span>
                                    <span className="font-bold">₹{actuarial.platform_summary.total_premium_collected}</span>
                                </div>
                                <div className="flex justify-between bg-gray-50 rounded-lg p-2">
                                    <span className="text-gray-500">Claims Paid</span>
                                    <span className="font-bold text-green-600">₹{actuarial.platform_summary.total_claims_paid}</span>
                                </div>
                            </div>
                        </div>

                        {/* Stress Scenario */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                            <p className="font-black text-[#0A1628] text-sm mb-1">🌧️ Stress Scenario</p>
                            <p className="text-xs text-gray-500 mb-3">{actuarial.stress_scenario?.scenario}</p>
                            <div className="space-y-2 text-xs">
                                <Row label="Trigger days" value={`${actuarial.stress_scenario?.trigger_days} days`} />
                                <Row label="Max payout/day" value={`₹${actuarial.stress_scenario?.max_payout_per_day}`} />
                                <Row label="Total exposure" value={`₹${actuarial.stress_scenario?.total_exposure}`} highlight />
                                <Row label="BCR in stress" value={actuarial.stress_scenario?.bcr_in_stress} />
                                <div className={`rounded-lg p-2 text-center font-bold
                                    ${actuarial.stress_scenario?.verdict?.includes('Reserves') ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}>
                                    {actuarial.stress_scenario?.verdict}
                                </div>
                            </div>
                        </div>

                        {/* Formula Explanation */}
                        <div className="bg-[#0A1628] rounded-2xl p-4 shadow-sm">
                            <p className="font-black text-white text-sm mb-2">🧮 Premium Formula (Disclosed)</p>
                            <div className="bg-[#1E3A5F] rounded-xl p-3 mb-3">
                                <p className="text-[#38BDF8] font-mono text-xs">{actuarial.formula_explained?.formula}</p>
                            </div>
                            <p className="text-[#94A3B8] text-xs mb-1 font-mono">{actuarial.formula_explained?.example}</p>
                            <p className="text-[#64748B] text-xs mb-3">{actuarial.formula_explained?.then}</p>
                            <div className="space-y-1">
                                {actuarial.formula_explained?.assumptions?.map((a, i) => (
                                    <p key={i} className="text-[#475569] text-xs">• {a}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Quick Nav Buttons ────────────────────────── */}
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => navigate('/claims')}
                        className="bg-white border-2 border-[#E2E8F0] hover:border-[#2563EB]
                        text-[#1E3A5F] font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm">
                        <span>📋</span><span>Claim History</span>
                    </button>
                    <button onClick={() => navigate('/policy')}
                        className="bg-white border-2 border-[#E2E8F0] hover:border-[#F59E0B]
                        text-[#1E3A5F] font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm">
                        <span>🔄</span><span>Change Plan</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

function StatCard({ label, value, sub, color }) {
    const colors = {
        blue : 'bg-blue-50 text-blue-600',
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

function Row({ label, value, highlight }) {
    return (
        <div className="flex justify-between">
            <span className="text-gray-500">{label}</span>
            <span className={`font-bold ${highlight ? 'text-red-600' : 'text-gray-800'}`}>{value}</span>
        </div>
    )
}