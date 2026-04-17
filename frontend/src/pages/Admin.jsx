import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminOverview, getAdminPredictive, getAdminFraud } from '../services/api'

export default function Admin() {
    const navigate = useNavigate()
    const [tab, setTab] = useState('overview')
    const [overview, setOverview] = useState(null)
    const [predict, setPredict] = useState(null)
    const [fraud, setFraud] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            getAdminOverview(),
            getAdminPredictive(),
            getAdminFraud()
        ]).then(([o, p, f]) => {
            setOverview(o.data)
            setPredict(p.data)
            setFraud(f.data)
            setLoading(false)
        }).catch(console.error)
    }, [])

    if (loading) return (
        <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
            <p className="text-[#38BDF8] animate-pulse">Loading Admin Dashboard...</p>
        </div>
    )

    const bcr = overview?.overview?.bcr || 0
    const lossRatio = overview?.overview?.loss_ratio || 0
    const bcrStatus = bcr === 0 ? 'gray' : bcr <= 0.7 ? 'green' : 'red'
    const bcrColor = { green: 'text-green-500', red: 'text-red-500', gray: 'text-gray-400' }[bcrStatus]

    return (
        <div className="min-h-screen bg-[#F1F5F9]">

            {/* Header */}
            <div className="bg-[#0A1628] px-4 pt-6 pb-14">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <div>
                        <p className="text-[#64748B] text-xs">⚡ GigSure</p>
                        <h1 className="text-white text-2xl font-black">Admin Dashboard</h1>
                        <p className="text-[#38BDF8] text-sm">Insurer Analytics & Risk Intelligence</p>
                    </div>
                    <button onClick={() => navigate('/dashboard')}
                        className="bg-white/10 text-white text-xs px-4 py-2 rounded-xl hover:bg-white/20">
                        ← Worker View
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 -mt-8 pb-8">

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <KPI label="Total Workers" value={overview?.overview?.total_workers} icon="👥" color="blue" />
                    <KPI label="Active Policies" value={overview?.overview?.active_policies} icon="🛡️" color="green" />
                    <KPI label="Total Claims" value={overview?.overview?.total_claims} icon="📋" color="amber" />
                    <KPI label="Avg Trust Score" value={overview?.overview?.avg_trust_score} icon="⭐" color="purple" />
                </div>

                {/* Financial KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <KPI label="Premium Collected" value={`₹${overview?.overview?.total_premium}`} icon="💰" color="green" />
                    <KPI label="Total Payouts" value={`₹${overview?.overview?.total_payouts}`} icon="💸" color="red" />
                    <KPI label="BCR" value={bcr || '—'} icon="📊" color="blue"
                        extra={<span className={`text-xs ${bcrColor} font-bold`}>
                            {bcr === 0 ? 'No data' : bcr <= 0.7 ? '✅ Healthy' : '⚠️ Review'}
                        </span>} />
                    <KPI label="Loss Ratio" value={`${lossRatio}%`} icon="📉" color="amber"
                        extra={<span className="text-xs text-gray-400">Target: 55-70%</span>} />
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-white rounded-2xl p-1 shadow-sm">
                    {[
                        { key: 'overview', label: '📊 Overview' },
                        { key: 'predictive', label: '🔮 Predictions' },
                        { key: 'fraud', label: '🔍 Fraud' },
                        { key: 'claims', label: '📋 Claims' },
                    ].map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all
                ${tab === t.key ? 'bg-[#0A1628] text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* OVERVIEW TAB */}
                {tab === 'overview' && (
                    <div className="space-y-4">

                        {/* Claims by Trigger */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm">
                            <h3 className="font-black text-[#0A1628] mb-4">Claims by Trigger Type</h3>
                            <div className="space-y-3">
                                {overview?.claims_by_trigger?.length === 0 ? (
                                    <p className="text-gray-400 text-sm text-center py-4">No claims yet</p>
                                ) : (
                                    overview?.claims_by_trigger?.map((t, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-medium capitalize flex items-center gap-2">
                                                    {triggerIcon(t.trigger_type)} {t.trigger_type}
                                                </span>
                                                <span className="text-gray-500">{t.count} claims · ₹{t.total_payout}</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full">
                                                <div className="h-2 bg-[#2563EB] rounded-full"
                                                    style={{ width: `${Math.min((t.count / (overview?.overview?.total_claims || 1)) * 100, 100)}%` }} />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Zone Distribution */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm">
                            <h3 className="font-black text-[#0A1628] mb-4">Worker Distribution by City</h3>
                            <div className="space-y-2">
                                {overview?.zone_distribution?.map((z, i) => (
                                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                                        <span className="text-sm font-medium text-gray-700">📍 {z.city}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 bg-blue-100 rounded-full w-24">
                                                <div className="h-2 bg-[#2563EB] rounded-full"
                                                    style={{ width: `${Math.min((z.workers / (overview?.overview?.total_workers || 1)) * 100, 100)}%` }} />
                                            </div>
                                            <span className="text-xs text-gray-500 w-16 text-right">{z.workers} workers</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* BCR Health */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm">
                            <h3 className="font-black text-[#0A1628] mb-4">📊 Actuarial Health</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-xl p-4 text-center">
                                    <p className="text-xs text-gray-500 mb-1">BCR (Burning Cost Rate)</p>
                                    <p className={`text-3xl font-black ${bcrColor}`}>{bcr || '—'}</p>
                                    <p className="text-xs text-gray-400 mt-1">Target: 0.55-0.70</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 text-center">
                                    <p className="text-xs text-gray-500 mb-1">Loss Ratio</p>
                                    <p className="text-3xl font-black text-[#2563EB]">{lossRatio}%</p>
                                    <p className="text-xs text-gray-400 mt-1">Target: 55-70%</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 text-center">
                                    <p className="text-xs text-gray-500 mb-1">Premium Collected</p>
                                    <p className="text-2xl font-black text-green-600">₹{overview?.overview?.total_premium}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 text-center">
                                    <p className="text-xs text-gray-500 mb-1">Claims Paid</p>
                                    <p className="text-2xl font-black text-red-500">₹{overview?.overview?.total_payouts}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* PREDICTIVE TAB */}
                {tab === 'predictive' && (
                    <div className="space-y-4">
                        <div className="bg-[#0A1628] rounded-2xl p-4">
                            <p className="text-[#38BDF8] text-xs font-bold uppercase tracking-wide">Next Week Forecast</p>
                            <p className="text-white font-black text-lg">Prophet-Based Zone Risk Predictions</p>
                            <p className="text-[#64748B] text-xs mt-1">
                                Reserve Required: <span className="text-[#F59E0B] font-bold">₹{predict?.reserve_required}</span>
                            </p>
                        </div>

                        {predict?.predictions?.map((p, i) => (
                            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-black text-[#0A1628] text-lg">📍 {p.city}</h3>
                                        <p className="text-gray-500 text-xs">{p.active_policies} active policies · {p.total_workers} workers</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${p.risk_level === 'HIGH' ? 'bg-red-100 text-red-700' :
                                            p.risk_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-green-100 text-green-700'
                                        }`}>
                                        {p.risk_level} RISK
                                    </span>
                                </div>

                                {/* Risk Score Bar */}
                                <div className="mb-3">
                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>Zone Risk Score</span>
                                        <span className="font-bold">{p.zone_risk_score}/100</span>
                                    </div>
                                    <div className="h-3 bg-gray-100 rounded-full">
                                        <div className={`h-3 rounded-full transition-all ${p.zone_risk_score > 70 ? 'bg-red-500' :
                                                p.zone_risk_score > 40 ? 'bg-yellow-500' : 'bg-green-500'
                                            }`} style={{ width: `${p.zone_risk_score}%` }} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                                        <p className="text-xs text-gray-400">Expected Claims</p>
                                        <p className="font-black text-[#0A1628] text-xl">{p.expected_claims}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                                        <p className="text-xs text-gray-400">Expected Payout</p>
                                        <p className="font-black text-red-500 text-xl">₹{p.expected_payout}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* FRAUD TAB */}
                {tab === 'fraud' && (
                    <div className="space-y-4">
                        {/* Fraud Summary Cards */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                                <p className="text-xs text-gray-500">Total Claims</p>
                                <p className="text-2xl font-black text-[#0A1628]">{fraud?.total_claims}</p>
                            </div>
                            <div className="bg-green-50 rounded-2xl p-4 text-center shadow-sm">
                                <p className="text-xs text-gray-500">Clean</p>
                                <p className="text-2xl font-black text-green-600">{fraud?.clean_claims}</p>
                            </div>
                            <div className="bg-red-50 rounded-2xl p-4 text-center shadow-sm">
                                <p className="text-xs text-gray-500">Flagged</p>
                                <p className="text-2xl font-black text-red-500">{fraud?.flagged_claims}</p>
                            </div>
                        </div>

                        {/* False Positive Cap */}
                        <div className="bg-[#0A1628] rounded-2xl p-4">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-white font-bold text-sm">False Positive Rate</p>
                                <span className="text-green-400 font-black">{fraud?.flag_rate}%</span>
                            </div>
                            <div className="h-3 bg-white/10 rounded-full">
                                <div className="h-3 bg-green-500 rounded-full"
                                    style={{ width: `${Math.min(fraud?.flag_rate || 0, 100)}%` }} />
                            </div>
                            <p className="text-[#64748B] text-xs mt-2">Cap: {fraud?.false_positive_cap}% - IRDAI compliance requirement</p>
                        </div>

                        {/* Defense Layers */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm">
                            <h3 className="font-black text-[#0A1628] mb-4">🛡️ Active Defense Layers</h3>
                            <div className="space-y-2">
                                {fraud?.defense_layers?.map((d, i) => (
                                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${d.layer === 'Device' ? 'bg-blue-100 text-blue-700' :
                                                    d.layer === 'Behaviour' ? 'bg-purple-100 text-purple-700' :
                                                        'bg-orange-100 text-orange-700'
                                                }`}>{d.layer}</span>
                                            <span className="text-sm text-gray-700">{d.check}</span>
                                        </div>
                                        <span className="text-green-500 text-xs font-bold">✅ {d.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* CLAIMS TAB */}
                {tab === 'claims' && (
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <h3 className="font-black text-[#0A1628]">Recent Claims - Live Feed</h3>
                            <p className="text-gray-400 text-xs">Last 10 claims across all workers</p>
                        </div>
                        {overview?.recent_claims?.length === 0 ? (
                            <p className="text-center text-gray-400 py-8">No claims yet</p>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {overview?.recent_claims?.map((c, i) => (
                                    <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{triggerIcon(c.trigger_type)}</span>
                                            <div>
                                                <p className="text-sm font-bold text-[#0A1628] capitalize">{c.trigger_type}</p>
                                                <p className="text-xs text-gray-400 font-mono">{c.reference_id}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[#2563EB] font-black">₹{c.payout_amount}</p>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold capitalize ${c.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                        c.status === 'approved' ? 'bg-yellow-100 text-yellow-700' :
                                                            c.status === 'flagged' ? 'bg-red-100 text-red-700' :
                                                                'bg-gray-100 text-gray-600'
                                                    }`}>{c.status}</span>
                                                <span className={`text-xs ${c.fraud_score > 0.5 ? 'text-red-500' : 'text-green-500'}`}>
                                                    {c.fraud_score > 0.5 ? '⚠️' : '✅'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    )
}

function KPI({ label, value, icon, color, extra }) {
    const colors = {
        blue: 'bg-blue-50',
        green: 'bg-green-50',
        amber: 'bg-amber-50',
        red: 'bg-red-50',
        purple: 'bg-purple-50',
    }
    return (
        <div className={`${colors[color]} rounded-2xl p-4 shadow-sm`}>
            <p className="text-xs text-gray-500 mb-1">{icon} {label}</p>
            <p className="text-xl font-black text-[#0A1628]">{value ?? '—'}</p>
            {extra && <div className="mt-1">{extra}</div>}
        </div>
    )
}

function triggerIcon(t) {
    return { rain: '🌧️', heat: '🌡️', aqi: '😷', curfew: '🚧', flood: '🌊' }[t] || '⚡'
}
