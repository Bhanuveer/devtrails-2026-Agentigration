import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { calcPremium, createPolicy } from '../services/api'

const PLANS = [
    { type: 'basic', base: 29, payout: 300, label: 'Basic', color: 'border-gray-500' },
    { type: 'standard', base: 49, payout: 450, label: 'Standard', color: 'border-[#2563EB]' },
    { type: 'premium', base: 79, payout: 650, label: 'Premium', color: 'border-[#F59E0B]' },
]

export default function Policy() {
    const navigate = useNavigate()
    const workerId = localStorage.getItem('worker_id')
    const [selected, setSelected] = useState('standard')
    const [premiums, setPremiums] = useState({})
    const [loading, setLoading] = useState(false)
    const [buying, setBuying] = useState(false)

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

    return (
        <div className="min-h-screen bg-[#0A1628] p-4">
            <div className="max-w-md mx-auto">

                <div className="text-center py-8">
                    <h2 className="text-white text-2xl font-bold">Choose Your Plan</h2>
                    <p className="text-[#64748B] text-sm mt-1">AI-calculated premium for your zone</p>
                </div>

                {loading ? (
                    <p className="text-center text-[#38BDF8]">Calculating your premium...</p>
                ) : (
                    <div className="space-y-4">
                        {PLANS.map(plan => {
                            const data = premiums[plan.type]
                            const isSelected = selected === plan.type
                            return (
                                <div key={plan.type} onClick={() => setSelected(plan.type)}
                                    className={`bg-[#1E3A5F] rounded-2xl p-5 border-2 cursor-pointer transition-all
                    ${isSelected ? plan.color : 'border-transparent'}`}>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-white font-bold text-lg">{plan.label}</h3>
                                            <p className="text-[#64748B] text-xs">Max payout: ₹{plan.payout}/day</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[#F59E0B] text-2xl font-black">
                                                ₹{data ? data.final_premium : plan.base}
                                            </p>
                                            <p className="text-[#64748B] text-xs">/week</p>
                                        </div>
                                    </div>

                                    {data && isSelected && (
                                        <div className="mt-3 pt-3 border-t border-[#0A1628] text-xs text-[#94A3B8] space-y-1">
                                            <div className="flex justify-between">
                                                <span>Base price</span>
                                                <span>₹{data.breakdown.base_price}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Zone risk adjustment</span>
                                                <span className={data.breakdown.zone_adjustment > 0 ? 'text-red-400' : 'text-green-400'}>
                                                    {data.breakdown.zone_adjustment > 0 ? '+' : ''}₹{data.breakdown.zone_adjustment}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Waterlogging zone</span>
                                                <span className={data.breakdown.waterlogging_zone ? 'text-red-400' : 'text-green-400'}>
                                                    {data.breakdown.waterlogging_zone ? 'Yes ⚠️' : 'No ✅'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between font-bold text-white">
                                                <span>Final premium</span>
                                                <span>₹{data.final_premium}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                <button onClick={handleBuy} disabled={buying}
                    className="w-full mt-6 bg-[#2563EB] hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all">
                    {buying ? 'Activating...' : `Activate ${selected} Plan →`}
                </button>

                <p className="text-center text-[#475569] text-xs mt-3">
                    Premium auto-renews every Monday
                </p>
            </div>
        </div>
    )
}