import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { calcPremium, createPolicy } from '../services/api'

const PLANS = [
    { type: 'basic',    base: 29, payout: 300, label: 'Basic',    emoji: '🌱', desc: 'Essential cover for low-risk zones' },
    { type: 'standard', base: 49, payout: 450, label: 'Standard', emoji: '⚡', desc: 'Best value — recommended for most workers', recommended: true },
    { type: 'premium',  base: 79, payout: 650, label: 'Premium',  emoji: '🛡️', desc: 'Maximum protection for high-risk zones' },
]

export default function Policy() {
    const navigate    = useNavigate()
    const workerId    = localStorage.getItem('worker_id')
    const [selected, setSelected]   = useState('standard')
    const [premiums, setPremiums]   = useState({})
    const [loading, setLoading]     = useState(false)
    const [buying, setBuying]       = useState(false)
    const [showFormula, setShowFormula] = useState(false)  // "Why this price?" accordion

    useEffect(() => {
        const fetchPremiums = async () => {
            setLoading(true)
            const results = {}
            for (const plan of PLANS) {
                try {
                    const res = await calcPremium({ worker_id: parseInt(workerId), plan_type: plan.type })
                    results[plan.type] = res.data
                } catch { }
            }
            setPremiums(results)
            setLoading(false)
        }
        fetchPremiums()
    }, [workerId])

    const handleBuy = async () => {
        setBuying(true)
        try {
            await createPolicy({ worker_id: parseInt(workerId), plan_type: selected })
            navigate('/dashboard')
        } catch (e) {
            alert(e.response?.data?.detail || 'Error creating policy')
        } finally { setBuying(false) }
    }

    const selData = premiums[selected]

    return (
        <div className="min-h-screen bg-[#0A1628]">
            <div className="max-w-md mx-auto px-4">

                {/* Header */}
                <div className="text-center py-8">
                    <h1 className="text-white text-2xl font-black">Choose Your Plan</h1>
                    <p className="text-[#64748B] text-sm mt-1">AI-calculated premium · Renews every Monday</p>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="text-3xl mb-2 animate-spin">⚙️</div>
                        <p className="text-[#38BDF8] animate-pulse text-sm">Calculating your AI premium...</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {PLANS.map(plan => {
                            const data       = premiums[plan.type]
                            const isSelected = selected === plan.type
                            return (
                                <div key={plan.type} onClick={() => setSelected(plan.type)}
                                    className={`relative bg-[#1E3A5F] rounded-2xl p-5 border-2 cursor-pointer transition-all
                                    ${isSelected
                                        ? plan.type === 'premium'
                                            ? 'border-[#F59E0B] shadow-lg shadow-amber-900/20'
                                            : plan.type === 'standard'
                                                ? 'border-[#2563EB] shadow-lg shadow-blue-900/20'
                                                : 'border-[#64748B]'
                                        : 'border-transparent hover:border-white/10'}`}>

                                    {/* Recommended badge */}
                                    {plan.recommended && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2
                                            bg-[#2563EB] text-white text-xs font-black px-3 py-1 rounded-full">
                                            ⭐ Recommended
                                        </div>
                                    )}

                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xl">{plan.emoji}</span>
                                                <h3 className="text-white font-black text-lg">{plan.label}</h3>
                                            </div>
                                            <p className="text-[#64748B] text-xs">{plan.desc}</p>
                                            <p className="text-[#94A3B8] text-xs mt-1">Max payout: ₹{plan.payout}/day</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[#F59E0B] text-2xl font-black">
                                                ₹{data ? data.final_premium : plan.base}
                                            </p>
                                            <p className="text-[#64748B] text-xs">/week</p>
                                        </div>
                                    </div>

                                    {/* Basic breakdown always shown when selected */}
                                    {data && isSelected && (
                                        <div className="mt-3 pt-3 border-t border-[#0A1628] space-y-1.5">
                                            <PremiumRow label="Base price"          value={`₹${data.breakdown.base_price}`} />
                                            <PremiumRow
                                                label="Zone risk adjustment"
                                                value={`${data.breakdown.zone_adjustment > 0 ? '+' : ''}₹${data.breakdown.zone_adjustment}`}
                                                valueColor={data.breakdown.zone_adjustment > 0 ? 'text-red-400' : 'text-green-400'}
                                            />
                                            <PremiumRow
                                                label="Waterlogging zone"
                                                value={data.breakdown.waterlogging_zone ? 'Yes ⚠️' : 'No ✅'}
                                                valueColor={data.breakdown.waterlogging_zone ? 'text-red-400' : 'text-green-400'}
                                            />
                                            <PremiumRow
                                                label="Loyalty discount"
                                                value={`₹${data.breakdown.loyalty_discount}`}
                                                valueColor={data.breakdown.loyalty_discount < 0 ? 'text-green-400' : 'text-[#94A3B8]'}
                                            />
                                            <div className="flex justify-between font-black text-white pt-1 border-t border-[#0A1628]">
                                                <span className="text-sm">Your final premium</span>
                                                <span className="text-[#F59E0B]">₹{data.final_premium}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* ─── "Why This Price?" — Actuarial Formula ─── */}
                {selData && (
                    <div className="mt-4 bg-[#1E3A5F] rounded-2xl overflow-hidden border border-[#2563EB]/20">
                        <button
                            onClick={() => setShowFormula(!showFormula)}
                            className="w-full flex justify-between items-center px-5 py-4 text-left">
                            <div>
                                <p className="text-white font-bold text-sm">🧮 Why is my premium ₹{selData.final_premium}?</p>
                                <p className="text-[#64748B] text-xs mt-0.5">See the pricing formula + actuarial assumptions</p>
                            </div>
                            <span className="text-[#64748B] text-lg transition-transform duration-200"
                                style={{ transform: showFormula ? 'rotate(180deg)' : 'rotate(0)' }}>
                                ▾
                            </span>
                        </button>

                        {showFormula && (
                            <div className="px-5 pb-5 space-y-4 border-t border-[#0A1628]">

                                {/* Step 1 — Actuarial Formula */}
                                <div className="pt-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-5 h-5 rounded-full bg-[#2563EB] text-white text-xs flex items-center justify-center font-black flex-shrink-0">1</div>
                                        <p className="text-white text-xs font-bold">Actuarial Base Premium</p>
                                    </div>
                                    <div className="bg-[#0A1628] rounded-xl p-3 mb-2">
                                        <p className="text-[#38BDF8] font-mono text-xs">
                                            Base = P(trigger) × Avg_Income_Loss × Days_Exposed
                                        </p>
                                    </div>
                                    <div className="space-y-1 text-xs">
                                        <ActRow
                                            label="P(trigger) — zone disruption probability"
                                            value={selData.formula_breakdown?.step1_actuarial?.values?.trigger_probability != null
                                                ? `${Math.round(selData.formula_breakdown.step1_actuarial.values.trigger_probability * 100)}%`
                                                : '—'}
                                        />
                                        <ActRow
                                            label="Avg income lost per day"
                                            value={selData.formula_breakdown?.step1_actuarial?.values?.avg_income_lost_per_day != null
                                                ? `₹${selData.formula_breakdown.step1_actuarial.values.avg_income_lost_per_day}`
                                                : '—'}
                                        />
                                        <ActRow
                                            label="Avg days exposed"
                                            value={selData.formula_breakdown?.step1_actuarial?.values?.avg_days_exposed != null
                                                ? `${selData.formula_breakdown.step1_actuarial.values.avg_days_exposed} days`
                                                : '—'}
                                        />
                                        <ActRow
                                            label="Actuarial pure premium"
                                            value={selData.formula_breakdown?.step1_actuarial?.result || '—'}
                                            bold
                                        />
                                    </div>
                                </div>

                                {/* Step 2 — ML Adjustment */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-5 h-5 rounded-full bg-[#F59E0B] text-white text-xs flex items-center justify-center font-black flex-shrink-0">2</div>
                                        <p className="text-white text-xs font-bold">ML Risk Adjustment (Random Forest)</p>
                                    </div>
                                    <div className="bg-[#0A1628] rounded-xl p-3 mb-2">
                                        <p className="text-[#94A3B8] text-xs">Inputs: zone_risk · trust_score · waterlogging · trigger_probability</p>
                                    </div>
                                    <div className="space-y-1 text-xs">
                                        <ActRow
                                            label="ML adjustment factor"
                                            value={selData.formula_breakdown?.step2_ml?.factor != null
                                                ? `× ${selData.formula_breakdown.step2_ml.factor}`
                                                : '—'}
                                        />
                                        <ActRow
                                            label="Final calculation"
                                            value={selData.formula_breakdown?.step2_ml?.result || '—'}
                                            bold
                                        />
                                    </div>
                                </div>

                                {/* Step 3 — Personalised */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-5 h-5 rounded-full bg-[#16A34A] text-white text-xs flex items-center justify-center font-black flex-shrink-0">3</div>
                                        <p className="text-white text-xs font-bold">Personalised Adjustments</p>
                                    </div>
                                    <div className="space-y-1 text-xs">
                                        <ActRow
                                            label="Your trust score"
                                            value={selData.formula_breakdown?.step3_adjustments?.trust_score ?? '—'}
                                        />
                                        <ActRow
                                            label="Loyalty discount"
                                            value={selData.formula_breakdown?.step3_adjustments?.loyalty_discount != null
                                                ? `₹${selData.formula_breakdown.step3_adjustments.loyalty_discount}`
                                                : '—'}
                                            color={selData.formula_breakdown?.step3_adjustments?.loyalty_discount < 0 ? 'text-green-400' : 'text-[#94A3B8]'}
                                        />
                                    </div>
                                </div>

                                {/* BCR Note */}
                                <div className="bg-[#0A1628] rounded-xl p-3">
                                    <p className="text-[#38BDF8] text-xs font-bold mb-1">📊 Actuarial Target (BCR)</p>
                                    <p className="text-[#94A3B8] text-xs">{selData.actuarial?.bcr_label}</p>
                                    <p className="text-[#64748B] text-xs">{selData.actuarial?.target}</p>
                                </div>

                                {/* Disclosed Assumptions */}
                                <div>
                                    <p className="text-[#64748B] text-xs font-bold mb-2 uppercase tracking-wide">Disclosed Assumptions</p>
                                    <div className="space-y-1">
                                        {[
                                            'Avg income lost/day: ₹650 (Zepto/Blinkit partner surveys)',
                                            'Avg trigger duration: 1.4 days (24-month IMD data)',
                                            'BCR target: 0.65 — IRDAI microinsurance benchmark',
                                            'Zone probability: pincode-level 24-month disruption history',
                                        ].map((a, i) => (
                                            <p key={i} className="text-[#475569] text-xs">• {a}</p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Buy Button */}
                <button onClick={handleBuy} disabled={buying}
                    className="w-full mt-5 bg-gradient-to-r from-[#2563EB] to-[#1d4ed8]
                    hover:from-[#1d4ed8] hover:to-[#1e40af]
                    text-white font-black py-4 rounded-2xl transition-all
                    shadow-xl shadow-blue-900/40 disabled:opacity-50 mb-6">
                    {buying ? '⏳ Activating...' : `Activate ${selected.charAt(0).toUpperCase() + selected.slice(1)} Plan →`}
                </button>

                <p className="text-center text-[#475569] text-xs mb-8">
                    🔒 Premium auto-renews every Monday · IRDAI compliant · Zero paperwork
                </p>
            </div>
        </div>
    )
}

function PremiumRow({ label, value, valueColor = 'text-[#94A3B8]' }) {
    return (
        <div className="flex justify-between text-xs">
            <span className="text-[#64748B]">{label}</span>
            <span className={`font-bold ${valueColor}`}>{value}</span>
        </div>
    )
}

function ActRow({ label, value, bold, color }) {
    return (
        <div className="flex justify-between">
            <span className="text-[#64748B]">{label}</span>
            <span className={`font-${bold ? 'black' : 'bold'} ${color || 'text-[#94A3B8]'}`}>{value}</span>
        </div>
    )
}