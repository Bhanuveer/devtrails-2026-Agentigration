import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerWorker, loginWorker } from '../services/api'

export default function Onboarding() {
    const navigate = useNavigate()
    const [tab, setTab] = useState('register')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [form, setForm] = useState({
        name: '', phone: '', partner_id: '',
        pincode: '', city: 'Pune',
        language: 'hindi', upi_id: ''
    })

    const cities = ['Pune', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Bangalore']
    const languages = ['hindi', 'marathi', 'tamil', 'telugu', 'english']
    const handle = e => setForm({ ...form, [e.target.name]: e.target.value })

    const handleRegister = async () => {
        setLoading(true); setError('')
        try {
            const res = await registerWorker(form)
            localStorage.setItem('worker_id', res.data.id)
            localStorage.setItem('worker_name', res.data.name)
            navigate('/policy')
        } catch (e) {
            setError(e.response?.data?.detail || 'Registration failed')
        } finally { setLoading(false) }
    }

    const handleLogin = async () => {
        setLoading(true); setError('')
        try {
            const res = await loginWorker({ phone: form.phone })
            localStorage.setItem('worker_id', res.data.worker_id)
            localStorage.setItem('worker_name', res.data.name)
            navigate('/dashboard')
        } catch (e) {
            setError(e.response?.data?.detail || 'Worker not found')
        } finally { setLoading(false) }
    }

    return (
        <div className="min-h-screen bg-[#0A1628] flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#F59E0B] rounded-2xl mb-4">
                        <span className="text-3xl">⚡</span>
                    </div>
                    <h1 className="text-4xl font-black text-white">GigSure</h1>
                    <p className="text-[#38BDF8] mt-1 text-sm">Income Protection for Delivery Workers</p>
                    <div className="flex justify-center gap-4 mt-3 text-xs text-[#64748B]">
                        <span>🛵 Zepto</span><span>•</span>
                        <span>Blinkit</span><span>•</span>
                        <span>BigBasket</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex mb-5 bg-[#1E3A5F] rounded-xl p-1">
                    {['register', 'login'].map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-bold capitalize transition-all
                ${tab === t ? 'bg-[#2563EB] text-white shadow-lg' : 'text-[#94A3B8] hover:text-white'}`}>
                            {t === 'register' ? '✨ Register' : '🔑 Login'}
                        </button>
                    ))}
                </div>

                <div className="bg-[#1E3A5F] rounded-2xl p-6 space-y-4 border border-[#2563EB]/30">
                    {tab === 'register' ? (
                        <>
                            <Field name="name" label="Full Name" value={form.name} onChange={handle} placeholder="Ramesh Kumar" icon="👤" />
                            <Field name="phone" label="Phone Number" value={form.phone} onChange={handle} placeholder="9876543210" icon="📱" />
                            <Field name="partner_id" label="Delivery Partner ID" value={form.partner_id} onChange={handle} placeholder="ZPT001" icon="🪪" />
                            <div className="grid grid-cols-2 gap-3">
                                <Field name="pincode" label="Pincode" value={form.pincode} onChange={handle} placeholder="411001" icon="📍" />
                                <Field name="upi_id" label="UPI ID" value={form.upi_id} onChange={handle} placeholder="name@upi" icon="💸" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Select name="city" value={form.city} onChange={handle} label="City" options={cities} />
                                <Select name="language" value={form.language} onChange={handle} label="Language" options={languages} />
                            </div>
                        </>
                    ) : (
                        <Field name="phone" label="Registered Phone Number" value={form.phone} onChange={handle} placeholder="9876543210" icon="📱" />
                    )}

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                            <p className="text-red-400 text-xs text-center">⚠️ {error}</p>
                        </div>
                    )}

                    <button onClick={tab === 'register' ? handleRegister : handleLogin} disabled={loading}
                        className="w-full bg-gradient-to-r from-[#2563EB] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#1e40af]
              text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/40
              disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading ? '⏳ Please wait...' : tab === 'register' ? 'Get Protected →' : 'Login to GigSure →'}
                    </button>

                    <div className="flex items-center justify-center gap-2 text-[#475569] text-xs">
                        <span>🔒</span><span>Secured · Zero paperwork · IRDAI compliant</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

function Field({ name, label, value, onChange, placeholder, icon }) {
    return (
        <div>
            <label className="text-[#94A3B8] text-xs font-medium mb-1.5 block">{label}</label>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">{icon}</span>
                <input name={name} value={value} onChange={onChange} placeholder={placeholder}
                    className="w-full bg-[#0A1628] text-white rounded-xl pl-9 pr-4 py-3 text-sm
            border border-[#1E3A5F] focus:border-[#2563EB] focus:outline-none
            placeholder-[#334155] transition-colors" />
            </div>
        </div>
    )
}

function Select({ name, value, onChange, label, options }) {
    return (
        <div>
            <label className="text-[#94A3B8] text-xs font-medium mb-1.5 block">{label}</label>
            <select name={name} value={value} onChange={onChange}
                className="w-full bg-[#0A1628] text-white rounded-xl px-3 py-3 text-sm
          border border-[#1E3A5F] focus:border-[#2563EB] focus:outline-none capitalize">
                {options.map(o => <option key={o} value={o} className="capitalize">{o}</option>)}
            </select>
        </div>
    )
}