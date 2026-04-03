import axios from 'axios'

const API = axios.create({
    baseURL: 'http://localhost:8000',
    headers: { 'Content-Type': 'application/json' }
})

export const registerWorker = (data) => API.post('/worker/register', data)
export const loginWorker = (data) => API.post('/worker/login', data)
export const getWorker = (id) => API.get(`/worker/${id}`)
export const calcPremium = (data) => API.post('/premium/calculate', data)
export const createPolicy = (data) => API.post('/policy/create', data)
export const getActivePolicy = (id) => API.get(`/policy/active/${id}`)
export const checkTrigger = (id) => API.post(`/trigger/check/${id}`)
export const getClaims = (id) => API.get(`/claims/${id}`)
export const getDashboard = (id) => API.get(`/dashboard/${id}`)
export const simulatePayout = (claimId) => API.post(`/payout/simulate/${claimId}`)