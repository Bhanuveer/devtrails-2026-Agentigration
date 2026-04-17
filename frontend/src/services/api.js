import axios from 'axios'

const API = axios.create({
    baseURL: 'http://localhost:8000',
    headers: { 'Content-Type': 'application/json' }
})

// ── Auth ─────────────────────────────────
export const registerWorker = (data) => API.post('/worker/register', data)
export const loginWorker    = (data) => API.post('/worker/login', data)
export const getWorker      = (id)   => API.get(`/worker/${id}`)

// ── Policy ───────────────────────────────
export const calcPremium    = (data) => API.post('/premium/calculate', data)
export const createPolicy   = (data) => API.post('/policy/create', data)
export const getActivePolicy = (id)  => API.get(`/policy/active/${id}`)

// ── Triggers ─────────────────────────────
export const checkTrigger    = (id)  => API.post(`/trigger/check/${id}`)
export const getLiveTriggers = (id)  => API.get(`/triggers/live/${id}`)

// New: simulate any of the 5 triggers for demo
// triggerType: "rain" | "heat" | "aqi" | "curfew" | "flood"
export const simulateTrigger = (workerId, triggerType) =>
    API.post('/trigger/simulate', { worker_id: parseInt(workerId), trigger_type: triggerType })

// ── Claims ───────────────────────────────
export const getClaims      = (id)      => API.get(`/claims/${id}`)
export const simulatePayout = (claimId) => API.post(`/payout/simulate/${claimId}`)

// ── Dashboard ────────────────────────────
export const getDashboard   = (id)  => API.get(`/dashboard/${id}`)

// ── Actuarial ─────────────────────────────
// Returns: BCR, Loss Ratio, Stress Scenario, Formula explanation
export const getActuarial = (id) => API.get(`/actuarial/${id}`)

// admin panel
export const getAdminOverview = () => API.get('/admin/overview')
export const getAdminPredictive = () => API.get('/admin/predictive')
export const getAdminFraud = () => API.get('/admin/fraud-summary')

// ── Razorpay Test Mode (Phase 3) ──────────
export const razorpayCreateOrder = (data) => API.post('/payment/razorpay/create-order', data)
export const razorpayVerify      = (data) => API.post('/payment/razorpay/verify', data)