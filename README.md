#  GigSure — AI-Powered Parametric Income Insurance
### Guidewire DEVTrails 2026 | Team Agentigration

> *"When it rains in Pune, thousands of Zepto and Blinkit delivery partners stop earning — not by choice, but because the roads flood and the orders stop. GigSure fixes that. Automatically. Instantly. Fairly."*

---

##  Table of Contents
- [Quick Overview](#-quick-overview)
- [Problem Statement](#-problem-statement)
- [Our Solution](#-our-solution)
- [Persona & Scenarios](#-persona--scenarios)
- [Parametric Triggers](#-parametric-triggers)
- [Weekly Premium Model](#-weekly-premium-model)
- [AI / ML Integration](#-ai--ml-integration)
- [System Architecture](#-system-architecture)
- [Core Features](#-core-features)
- [Innovative Features](#-innovative-features)
- [Tech Stack](#-tech-stack)
- [Platform Choice](#-platform-choice)
- [Application Workflow](#-application-workflow)
- [Regulatory Compliance & Market Crash Preparedness](#-regulatory-compliance--market-crash-preparedness)
- [6-Week Development Plan](#-6-week-development-plan)
- [Demo Video](#-demo-video)
- [Team](#-team)

---

## Quick Overview

| | |
|---|---|
| **Product** | GigSure — Weekly Parametric Income Insurance |
| **Persona** | Q-Commerce delivery partners across all platforms (Zepto, Blinkit, BigBasket) |
| **Problem** | Workers lose 20–30% of monthly income to external disruptions with zero protection |
| **Solution** | Auto-detects disruptions → Auto-triggers claim → UPI payout in under 10 minutes |
| **Weekly Premium** | Starts at ₹29/week — AI-adjusted every Monday |
| **Coverage** | Lost daily income only — not health, vehicle, or accident |
| **Tech Stack** | React.js + FastAPI (Python) + PostgreSQL + scikit-learn + Prophet |
| **Platform** | Mobile-first responsive web app |
| **Insurer Model** | Designed to integrate with licensed insurers via API-driven underwriting |

### How It Works — 3 Steps

```
  Step 1 → Worker pays ₹29–₹79/week
  Step 2 → System monitors weather, AQI & alerts 24/7 in worker's delivery zone
  Step 3 → Threshold crossed → AI verifies → UPI payout in under 10 minutes
                    (Zero action required from the worker)
```

### What Makes GigSure Different

| Feature | What It Does |
|---------|-------------|
| Predictive Alert System | Warns workers every Sunday before a dangerous week arrives |
| Transparent Dynamic Pricing | Premium adjusts weekly based on risk forecast — always notified in advance |
| Rewards & Coins System | Workers earn coins for consistency and honest claims — redeemable as discounts |
| Vernacular Language Support | Full app in Hindi, Marathi, Tamil, and Telugu |
| Hyper-Local Zone Risk Map | Live heatmap showing red/green risk zones for current and next week |
| Claim Transparency Feed | Real-time 5-step claim status — like order tracking, but for insurance payouts |

---

##  Problem Statement

India's Q-Commerce delivery partners (Zepto, Blinkit, BigBasket) earn between ₹15,000–₹22,000/month. Their income is entirely dependent on one thing — being able to ride.

When external disruptions hit — heavy rain, floods, dangerous air quality, or a sudden curfew — their earnings drop to zero. There is no paid leave, no employer support, and no insurance product in India that covers lost daily wages caused by events outside a worker's control.

**The impact:**
- 1 day of heavy rain = ₹500–₹800 in lost income
- A 2-day flood or curfew = ₹1,000–₹1,500 gone instantly
- Workers have **zero financial safety net**
- No existing product covers **lost daily income** from external disruptions
- Filing a traditional claim requires documents and follow-ups most workers cannot manage

> **20–30% of a delivery partner's monthly income is at risk** every time an external disruption hits their zone.

---

##  Our Solution

**GigSure** is an AI-enabled parametric income insurance platform built for Q-commerce delivery partners across platforms such as Zepto, Blinkit, and BigBasket.

**How it works in 3 steps:**
1. Worker subscribes for **₹29–₹79/week** (auto-renews every Monday)
2. Our system **monitors real-time weather, AQI, and government alerts** 24/7 per zone
3. Threshold crossed → **claim auto-triggers → AI verifies → UPI payout in 10 minutes** — no forms, no calls

> **What is Parametric Insurance?**
> It pays automatically when a measurable real-world event — like rainfall exceeding 50mm — crosses a defined threshold. The event itself is the proof. Zero paperwork. Zero waiting. Zero manual claims.

**Coverage scope:**
- Lost daily income due to external disruptions
- NOT health or medical insurance
- NOT vehicle repair or damage
- NOT accident or life insurance

---

##  Persona & Scenarios

### Primary Persona

| | |
|---|---|
| **Name** | Ramesh Kumar |
| **Age** | 26 years |
| **City** | Pune, Maharashtra |
| **Platform** | Zepto delivery partner |
| **Daily Earnings** | ₹600–₹850 per day (8–10 hours) |
| **Monthly Income** | ~₹18,000 |
| **Payment Method** | UPI — PhonePe |
| **Education** | Class 10 graduate |
| **Language** | Hindi, basic Marathi |
| **Financial Safety Net** | None |
| **Banking** | Basic Jan Dhan account — no credit history, no savings buffer |
| **Phone** | Android entry-level — uses apps entirely in Hindi |

### Daily Reality

Ramesh wakes at 6AM and starts deliveries by 7AM. He checks his earnings on the Zepto app every evening. All household expenses — grocery, rent, children's school fees — are paid weekly from that week's cash earnings. There is no monthly salary, no employer benefits, and no buffer for emergencies.

When it rains, Ramesh does not decide to take a day off. The orders simply stop coming. Zepto suspends operations in waterlogged zones. He sits at home and watches his daily earning go to zero — with no way to recover that loss. In the past, he has borrowed from a relative or a local moneylender to cover the shortfall. The interest on that loan costs him more than the rain already did.

He has never purchased insurance. Not because he does not need it — but because every product he has seen requires English literacy, long forms, physical documents, and a waiting period that can stretch to weeks. None of that is possible for someone who needs money today, not next month.

**Why Ramesh would use GigSure:**
- Weekly ₹29 feels like a manageable daily chai expense — not a big financial commitment
- Zero paperwork — he does not have time or literacy for forms
- Payout in 10 minutes — he needs money now, not in 2 weeks
- Hindi interface — he can actually understand every screen without help
- Predictive alerts — he can plan his week before rain arrives, not after

---

### Real-World Scenarios

#### Scenario 1 — Heavy Rain
> *It is July in Pune. IMD issues a Red Alert — rainfall exceeds 65mm in Ramesh's zone (Kothrud). Zepto suspends deliveries for 2 days. Ramesh stands to lose ₹1,400.*
>
> **GigSure Response:** Three days earlier, Ramesh received a Predictive Alert warning him about incoming heavy rain. When the 50mm threshold is crossed, the system auto-triggers a claim, runs AI fraud verification, and sends ₹800 to his UPI within 10 minutes — on both affected days. No action needed from Ramesh.

#### Scenario 2 — AQI Emergency
> *November in Delhi. AQI crosses 350 in Ramesh's zone (Dwarka). The government issues an outdoor work advisory. Ramesh cannot safely work for 3 days.*
>
> **GigSure Response:** AQI threshold (> 300) crossed → Claim auto-triggered for all eligible workers in the zone → AI verification passed → ₹700/day credited for 3 days = **₹2,100 total payout**. The Claim Transparency Feed updates every step in real time: Trigger Detected → Claim Initiated → AI Verified → Payout Sent.

#### Scenario 3 — Sudden Curfew
> *An unannounced 24-hour curfew is imposed in Ramesh's area due to a local political event. All deliveries halt immediately.*
>
> **GigSure Response:** Official curfew notification detected → Same-day income replacement of ₹650 sent to Ramesh's UPI instantly. He also earns **25 GigSure Coins** for holding an active policy during a verified disruption — redeemable as a discount on next week's premium.

#### Scenario 4 — Dangerous Week Forecast
> *The forecasting model identifies that 4 days of heavy rain are predicted for Ramesh's zone next week.*
>
> **GigSure Response:** Every Sunday, Ramesh receives a Predictive Alert: *"Heavy rain is forecast in your delivery zone for 4 days next week. Your GigSure policy is active — your income is protected. This week's adjusted premium is ₹58."* Ramesh can plan his week, manage expenses, and inform his family — before a single drop falls.

---

##  Parametric Triggers

Our system monitors **5 disruption triggers** in real time, mapped to each worker's registered pincode zone.

| # | Trigger | Data Source | Threshold | Daily Payout |
|---|---------|-------------|-----------|--------------|
| 1 | Heavy Rain / Flood | OpenWeatherMap API + IMD | > 50mm rainfall/day in worker's zone | ₹400/day |
| 2 | Extreme Heat | OpenWeatherMap API | Feels-like temperature > 45°C | ₹300/day |
| 3 | Severe AQI Alert | CPCB / AQI India API | AQI > 300 (Severe category) | ₹350/day |
| 4 | Government Curfew / Bandh | Government Alert API (mocked) | Official curfew notification issued | ₹500/day |
| 5 | Flash Flood Warning | IMD Alert Feed (mocked) | Red or Orange flood alert issued | ₹450/day |

**Automated trigger pipeline:**
```
External API reading received for worker's pincode zone
                  ↓
Is the reading above the defined threshold?
                  ↓
Does the worker have an active policy this week?
                  ↓
Has a claim already been filed for this event window? (duplicate check)
                  ↓
AI fraud verification → GPS activity + platform login cross-check
                  ↓
Claim approved → Payout initiated via Razorpay UPI → Worker notified
```

---

##  Weekly Premium Model

GigSure uses a **weekly subscription model** because delivery partners earn and budget week to week. A weekly premium of ₹29–₹79 is a low-friction decision that aligns with how workers actually manage money.

### Plan Tiers

| Plan | Weekly Premium | Max Daily Payout | Max Weekly Coverage |
|------|---------------|-----------------|---------------------|
| Basic | ₹29 / week | ₹300 / day | ₹900 / week |
| Standard | ₹49 / week | ₹450 / day | ₹1,350 / week |
| Premium | ₹79 / week | ₹650 / day | ₹1,950 / week |

### AI Dynamic Pricing Formula

The weekly premium is **not fixed** — it recalculates every Monday based on real-time and historical factors:

```
Final Premium = Base Premium
              ± Zone Risk Adjustment    ( ±₹10 based on zone's historical disruption frequency )
              ± Weather Forecast Risk   ( +₹10 if next week is high-risk / -₹5 if forecast is safe )
              - Loyalty Discount        ( ₹5 off for workers with 4+ consecutive active weeks )
              - Weekly Login Bonus      ( ₹3 off for workers who log in every week )
              - Clean History Bonus     ( ₹3 off for workers with zero fraudulent claims )
              - Coins Redemption        ( Worker may optionally redeem earned coins as discount )
```

**Example Calculations:**

> Ramesh — Pune, July (monsoon peak, dangerous week forecast):
> Base ₹49 + Zone +₹8 + Forecast +₹10 − Loyalty −₹5 − Login −₹3
> **Final = ₹59/week** — Worker notified every Sunday with full breakdown

> Ramesh — Pune, February (dry season, safe forecast):
> Base ₹49 − Zone −₹6 − Forecast −₹5 − Loyalty −₹5 − Login −₹3
> **Final = ₹30/week** — Lower risk, consistent behaviour rewarded

Every premium change is communicated in advance — no surprises, no hidden charges.

---

##  AI / ML Integration

Three distinct ML systems form the intelligence core of GigSure. Each is described below with its inputs, processing logic, output, and schedule — not just algorithm names.

### 1. Dynamic Premium Calculation

- **Algorithm:** Random Forest Regressor
- **When it runs:** Every Sunday at 11:00 PM for all active workers
- **Input Features (14 total):**
  - zone_risk_score (historical disruption frequency over 24 months)
  - rainfall_7day_forecast (mm — from OpenWeatherMap)
  - aqi_forecast_score (predicted AQI for next 7 days)
  - temperature_forecast (feels-like max for next 7 days)
  - worker_claim_count_30days (personal claim history)
  - zone_claim_rate_30days (zone-level claim frequency)
  - login_streak_weeks (consecutive weekly logins)
  - plan_tier (Basic / Standard / Premium)
  - seasonality_factor (monsoon, heatwave, winter scoring)
  - days_since_last_disruption (zone recency score)
  - worker_tenure_weeks (how long on platform)
  - clean_history_flag (zero fraud history = 1)
  - pending_coins_balance (available for redemption)
  - forecast_confidence_score (API reliability rating)
- **Output:** premium_adjustment_factor (range: 0.7 to 1.4)
- **Final Calculation:** `final_premium = base_plan_price × adjustment_factor`
- **Training Data:** 24 months of historical IMD weather data combined with simulated disruption event records
- **Retraining Schedule:** Monthly — on new disruption and claim data

### 2. Fraud Detection System

- **Algorithm:** Isolation Forest (Unsupervised Anomaly Detection)
- **When it runs:** Silently on every claim before payout is approved — target completion under 30 seconds
- **How it builds a baseline:** Over the first 30 days of a worker's activity, the model builds a normal behaviour profile — typical GPS movement range, login patterns, claim frequency relative to zone average
- **Checks performed on every claim:**
  - GPS activity analysis — if device shows movement > 2km from home zone during the disruption window, the claim is flagged
  - Platform login gap — if worker was not logged into the delivery platform for > 4 hours during the claimed disruption period, the claim is flagged
  - Claim frequency check — if worker's claim rate exceeds 2.5x the zone average for the same event type, the claim is flagged
  - Zone cluster detection — if > 40% of workers in a single zone file simultaneous claims for an event not confirmed by external API data, the entire batch is flagged
- **Outcome of a flag:** Flagged claims are moved to a manual review queue — they are never auto-rejected. A human reviewer makes the final call with full evidence attached.
- **Red flags raised when:**
  - Worker claims disruption but GPS shows active city movement
  - Worker was not logged into the delivery platform during the claimed period
  - Unusually high cluster of claims from one zone without matching API confirmation

### 3. Predictive Risk Forecasting

- **Algorithm:** Time Series Forecasting — Facebook Prophet
- **When it runs:** Every Sunday at 10:00 PM — before premium recalculation and before Predictive Alerts are sent
- **Input:** 7-day weather forecast data from IMD + OpenWeatherMap per pincode zone, combined with 24 months of historical disruption frequency for that zone
- **Output:** disruption_probability_score per zone — a value from 0 to 100
- **Decision thresholds:**
  - Score > 65 → Predictive Alert sent to all active workers in that zone
  - Score > 75 → +10% premium surcharge applied for the coming week
  - Score < 35 → -5% premium reduction applied for the coming week
- **Use Case 1:** Powers the Predictive Alert System — workers receive advance warning every Sunday before a dangerous week
- **Use Case 2:** Feeds the dynamic premium adjustment — making pricing fair and forecast-aware
- **Use Case 3:** Admin dashboard displays expected claim volume and estimated payout obligations for the coming week — enabling the insurer to maintain appropriate reserves

---

##  System Architecture

GigSure is built as a modular, event-driven system where each component has a single responsibility and communicates through well-defined interfaces.

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                           │
│           React.js (Vite) + Tailwind CSS + i18next              │
│     Worker App (mobile-first) + Admin Dashboard (desktop)       │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS / REST API (Axios)
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND LAYER                            │
│              FastAPI (Python) + PostgreSQL                      │
│   Auth (JWT) | Policy API | Claims API | Dashboard API          │
└──────┬───────────────────┬────────────────────┬─────────────────┘
       │                   │                    │
       ↓                   ↓                    ↓
┌────────────┐   ┌──────────────────┐   ┌──────────────────────┐
│ SCHEDULER  │   │   ML ENGINE      │   │   PAYOUT ENGINE      │
│APScheduler │   │ Random Forest    │   │ Razorpay UPI API     │
│            │   │ Isolation Forest │   │ (Sandbox mode)       │
│Every hour: │   │ Prophet          │   │                      │
│ Weather API│   │                  │   │ Processes approved   │
│ AQI API    │   │ Runs on:         │   │ claims automatically │
│ Govt alerts│   │ Every claim      │   └──────────────────────┘
│            │   │ Every Sunday     │
│Every Sunday│   └──────────────────┘
│ Forecasts  │
│ Premiums   │
│ Alerts     │
└────────────┘
       │
       ↓
┌─────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION LAYER                           │
│         Firebase Cloud Messaging → Worker's phone               │
│   Predictive Alerts | Claim Updates | Payout Confirmations      │
└─────────────────────────────────────────────────────────────────┘
```

**Data flow for a triggered claim:**
```
OpenWeatherMap API → Scheduler detects threshold crossed
        ↓
Trigger Engine identifies all eligible workers in affected zone
        ↓
Isolation Forest fraud check runs per worker (< 30 sec)
        ↓
Clean claims → auto-approved → Razorpay payout initiated
Flagged claims → manual review queue
        ↓
Claim Transparency Feed updated in real time
        ↓
Firebase push notification sent in worker's preferred language
        ↓
Worker dashboard updated — earnings protected, coins awarded
```

---

##  Core Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Quick Onboarding** | Phone OTP + Pincode + Delivery Partner ID — complete in under 2 minutes |
| 2 | **AI Risk Profiling** | Personalised zone risk score generated instantly after onboarding |
| 3 | **3 Weekly Plans** | Basic / Standard / Premium — recommended plan highlighted based on risk profile |
| 4 | **Dynamic ML Pricing** | Premium auto-recalculates every Monday using 14 real-time features |
| 5 | **5 Parametric Triggers** | Rain, Heat, AQI, Curfew, Flood — monitored 24/7 per worker zone |
| 6 | **Zero-Touch Claims** | System auto-files and approves the claim the moment a trigger is detected |
| 7 | **AI Fraud Detection** | GPS + platform login cross-check catches anomalous claims silently |
| 8 | **Instant UPI Payout** | Approved payout reaches worker's UPI account in under 10 minutes |
| 9 | **Worker Dashboard** | Active policy, earnings protected, claim history, coins balance |
| 10 | **Admin Dashboard** | Claim ratios, zone risk analytics, payout forecasting, fraud flag summary |

---

##  Innovative Features

Six features that go beyond the standard brief — built to address the real barriers that prevent delivery workers from trusting and using financial products.

---

### 1. Predictive Alert System

**What it does:** Instead of reacting after a disruption, GigSure predicts dangerous periods in advance and notifies workers proactively — every Sunday before the week begins.

**How it works:**
- Every Sunday at 10PM, the Prophet forecasting model analyses the 7-day weather outlook for each pincode zone
- If disruption_probability_score > 65 → Workers in that zone receive an advance alert with their coverage status and adjusted premium
- If the next month shows an elevated disruption pattern → A monthly outlook alert is sent
- Workers can plan rest days, manage household expenses, and inform family — before the disruption arrives

**Why it matters:** Most insurance is reactive — it pays after damage is done. GigSure is proactive — giving workers financial peace of mind and real planning ability before any disruption hits.

---

### 2. Dangerous Week Premium Warning

**What it does:** When the AI predicts a high-risk week ahead, the premium increases by up to +₹10 — but the worker is **always notified in advance every Sunday** with a clear explanation. No surprises, ever.

**How it works:**
- Safe week forecast (score < 35) → Premium stays low or decreases
- Dangerous week forecast (score > 75) → Premium increases up to +₹10
- Worker receives a Sunday notification: *"This week's premium is ₹58 because heavy rain is forecast in your zone."*
- Worker can choose to upgrade, maintain, or pause their plan before Monday renewal

**Why it matters:** Fully transparent and fair pricing. Workers understand exactly why their premium changed — and that trust is what keeps them subscribed long term.

---

### 3. Rewards & Coins System

**What it does:** Workers earn **GigSure Coins** for consistent, honest engagement — redeemable as premium discounts.

**How to earn coins:**

| Activity | Coins Earned |
|----------|-------------|
| Log in to the app each week | 10 coins/week |
| Maintain active policy for 4 consecutive weeks | 50 coins (one-time bonus) |
| Hold active policy during a verified disruption | 25 coins |
| Refer a fellow delivery partner | 100 coins |
| Complete profile to 100% | 20 coins |
| Maintain clean claim history for 6 months | 75 coins |

**How to redeem:**
- 100 coins = ₹5 off next week's premium
- 500 coins = 1 free week on the Basic plan

**Why it matters:** Rewards honest, consistent workers. Reduces platform churn — a real problem in the insurance industry. Weekly login incentives also create habit-forming engagement with the product.

---

### 4. Vernacular Language Support

**What it does:** The entire app — onboarding, dashboard, alerts, notifications, and claim feed — is available in regional Indian languages from the very first screen.

**Languages supported:**
- Hindi (primary — widest reach)
- Marathi (Pune / Mumbai delivery zones)
- Tamil (Chennai / Coimbatore zones)
- Telugu (Hyderabad zones)
- English (default fallback)

**Implementation:** React i18next library handles all language switching. Worker selects preferred language at first launch — saved and applied consistently to every screen, notification, and communication.

**Why it matters:** Over 80% of Zepto and Blinkit delivery partners are significantly more comfortable in their regional language than English. Requiring workers to interpret English insurance terminology is an entirely avoidable barrier. This feature removes it completely — and no competing platform addresses this gap.

---

### 5. Hyper-Local Zone Risk Map

**What it does:** A live, interactive city heatmap showing current and upcoming disruption risk levels across all active delivery zones — updated in real time from weather and AQI data.

**What workers see:**
- Their current registered zone highlighted on the map
- Red zones — High disruption risk (heavy rain / AQI / flood predicted or active)
- Orange zones — Moderate risk, caution advised
- Green zones — Safe, low disruption probability
- Toggle between "This Week" and "Next Week" forecast view

**What admin / insurer sees:**
- City-wide risk distribution with claim concentration overlay
- Expected payout volume per zone (colour intensity = claim probability)
- Historical disruption frequency heatmap per pincode

**Implementation:** Leaflet.js with OpenWeatherMap data and the platform's internally calculated zone risk scores.

**Why it matters:** The most visually powerful feature in a live demo — judges instantly understand the hyper-local, zone-based parametric approach. Workers can assess their own risk in a single glance.

---

### 6. Claim Transparency Feed

**What it does:** Workers see a real-time, step-by-step status feed of exactly what is happening with their claim — similar to how food delivery apps show order tracking, but for insurance payouts.

**What the feed looks like:**
```
 Step 1 — Trigger Detected
   Rainfall of 68mm recorded in your zone (Kothrud, Pune) at 2:30 PM.
   Your 50mm policy threshold has been crossed.

 Step 2 — Claim Initiated
   Your claim was automatically created at 2:31 PM.
   Reference: GS-2026-07-082

 Step 3 — AI Verification Complete
   Activity data reviewed. No anomalies detected. Claim approved at 2:33 PM.

 Step 4 — Payout Processing
   ₹400 is being transferred to your registered UPI ID at 2:34 PM.

 Step 5 — Payout Sent
   ₹400 credited to ****1234 at 2:41 PM.
   +25 GigSure Coins earned for active coverage during this disruption.
```

**Why it matters:** Traditional insurance is a black box — workers have no visibility into what happens after a claim. When workers can see every step as it happens, in their own language, trust in the system follows naturally — and retention improves significantly.

---

##  Tech Stack

###  Frontend
| Technology | Purpose |
|-----------|---------|
| React.js (Vite) | UI framework |
| Tailwind CSS | Responsive mobile-first styling |
| React Router v6 | Client-side navigation |
| Axios | API communication with FastAPI backend |
| Recharts | Charts for worker and admin analytics dashboards |
| Leaflet.js | Interactive hyper-local zone risk heatmap |
| i18next + react-i18next | Five-language localisation across all screens |

###  Backend
| Technology | Purpose |
|-----------|---------|
| FastAPI (Python) | High-performance REST API framework |
| PostgreSQL | Primary relational database |
| SQLAlchemy | ORM and database schema management |
| Pydantic | Request and response data validation |
| APScheduler | Scheduled jobs — trigger monitoring, Sunday forecasts, premium recalculation |
| JWT + OAuth2 | Authentication and session management |
| Firebase Cloud Messaging | Push notifications for alerts and payout confirmations |

###  AI / ML
| Technology | Purpose |
|-----------|---------|
| scikit-learn | Random Forest (premium model) + Isolation Forest (fraud detection) |
| pandas + NumPy | Data processing and feature engineering |
| Prophet (Meta) | Weekly zone disruption risk time-series forecasting |
| Joblib | ML model serialisation and loading within FastAPI |

###  External APIs & Services
| Service | Purpose | Mode |
|---------|---------|------|
| OpenWeatherMap API | Real-time weather data + 7-day zone forecasts | Live — Free tier |
| CPCB AQI API | Real-time air quality index readings | Live — Free tier |
| IMD Alert Feed | Flood and severe weather red alerts | Simulated (mocked) |
| Government Alert API | Curfew and zone closure notifications | Simulated (mocked) |
| Razorpay | UPI payout processing for all approved claims | Test / Sandbox mode |

###  DevOps & Infrastructure
| Technology | Purpose |
|-----------|---------|
| GitHub | Version control and team collaboration |
| Vercel | Frontend deployment — auto-deploys on every push to main |
| Render | Backend and ML service deployment — free tier with PostgreSQL |

---

##  Platform Choice

**GigSure is a Mobile-First Responsive Web Application.**

**Why Web over a native app?**
1. **No installation barrier** — Workers access via phone browser instantly, no Play Store download needed
2. **Demo friendly** — Judges open the live URL directly, no device setup required
3. **Single codebase** — One React app works across mobile, tablet, and desktop with responsive design
4. **Language flexibility** — i18next handles five languages seamlessly without native app complexity
5. **PWA upgrade path** — Configured as a Progressive Web App in Phase 3, installable on Android home screen with full push notification support

> **Responsive Design:** Fully optimised for screens starting at 375px — reflecting the reality that 95%+ of target users access digital services exclusively through smartphones.

---

##  Application Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                         ONBOARDING                              │
│                                                                 │
│  Worker opens GigSure in phone browser                         │
│                    ↓                                            │
│  Selects preferred language                                     │
│  [ Hindi / Marathi / Tamil / Telugu / English ]                 │
│                    ↓                                            │
│  Phone OTP verification → Zone pincode + Delivery Partner ID    │
│                    ↓                                            │
│  AI Risk Profile generated — zone risk score calculated         │
│                    ↓                                            │
│  Plan selected — Basic / Standard / Premium                     │
│                    ↓                                            │
│  Weekly premium paid via Razorpay UPI (sandbox)                │
│                    ↓                                            │
│  Policy active — Dashboard + Zone Risk Heatmap displayed        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  BACKGROUND MONITORING — 24/7                   │
│                                                                 │
│  Weather API polled every 60 minutes per zone                  │
│  AQI API polled every 2 hours per zone                         │
│  Government alert feed checked every 60 minutes                │
│                                                                 │
│  Every Sunday:                                                  │
│  → Forecast model runs for all active zones                    │
│  → Dynamic premiums recalculated for all workers               │
│  → Predictive Alerts sent to workers in high-risk zones        │
│  → Coins balances updated for eligible activities              │
└─────────────────────────────────────────────────────────────────┘
                         ↓  Threshold crossed
┌─────────────────────────────────────────────────────────────────┐
│                      CLAIM PIPELINE                             │
│                                                                 │
│  Trigger detected in worker's pincode zone                     │
│                    ↓                                            │
│  Active policy confirmed + duplicate claim check passed        │
│                    ↓                                            │
│  AI fraud verification — GPS + platform login cross-check      │
│                    ↓                                            │
│  Claim auto-approved                                           │
│                    ↓                                            │
│  Payout sent via Razorpay UPI                                  │
│                    ↓                                            │
│  Claim Transparency Feed updated — all 5 steps in real time    │
│                    ↓                                            │
│  Push notification sent in worker's preferred language         │
│                    ↓                                            │
│  Coins awarded → Worker dashboard updated                      │
└─────────────────────────────────────────────────────────────────┘
```

---

##  Regulatory Compliance & Market Crash Preparedness

GigSure is built with regulatory compliance as a core design principle — not an afterthought. The insurance industry in India is heavily regulated, and any platform operating in this space must be prepared for sudden regulatory updates. This section addresses both our compliance framework and how GigSure handles regulatory shocks.

### IRDAI Microinsurance Framework

GigSure operates under the **Insurance Regulatory and Development Authority of India (IRDAI) Microinsurance Regulations (2015)**, which specifically enable low-premium, simplified-claim products for underserved and low-income populations.

- Weekly premiums of ₹29–₹79 fall within IRDAI's prescribed microinsurance premium limits
- Parametric payout structure aligns with IRDAI's index-based insurance guidelines
- The zero-paperwork claim model is consistent with IRDAI's push for simplified insurance for informal sector workers
- GigSure would partner with a licensed insurer as the underwriter — the platform acts as a distribution and automation layer on top of a regulated insurance product

### Data Privacy — DPDP Act 2023

India's **Digital Personal Data Protection Act 2023** governs how user data must be collected, stored, and processed.

- Worker personal data is encrypted at rest using AES-256 and in transit using TLS 1.3
- Payment data is never stored on GigSure servers — all transactions are processed directly through Razorpay's PCI-DSS compliant infrastructure
- GPS data used during fraud verification is not stored beyond the claim verification window
- Workers can request full data deletion from the platform at any time through the dashboard
- Data is stored only in India-region servers — compliant with data localisation requirements

### KYC & RBI Compliance

- Phone OTP verification constitutes basic KYC for policy issuance — consistent with RBI's guidelines for low-value digital financial products
- UPI ID is verified against Razorpay's registry before the first payout is processed
- Weekly payouts of ₹300–₹1,950 are well within RBI's UPI transaction monitoring thresholds
- All payout records are maintained with full audit trails — transaction ID, timestamp, worker ID, claim reference

### Market Crash Preparedness

The DEVTrails competition includes Market Crash events — sudden regulatory compliance shocks with a 24-hour response window. GigSure's architecture is specifically designed to handle these events rapidly.

**How GigSure responds to a Market Crash:**

- Policy terms, payout caps, trigger thresholds, and premium limits are all stored as configurable parameters in the admin panel — not hardcoded
- Any IRDAI or RBI regulatory update can be applied via admin panel configuration within hours — no code redeployment required
- The modular FastAPI architecture allows individual compliance-related endpoints to be updated independently without taking the entire platform offline
- An operational reserve buffer has been allocated in our budget specifically for compliance contingencies of this nature.

**Example response to a hypothetical Market Crash:**
> *IRDAI announces that all parametric insurance platforms must cap weekly payouts at ₹1,500 within 24 hours.*
>
> GigSure admin logs in → navigates to Policy Configuration → updates max_weekly_payout parameter to 1500 → saves. The change propagates to all active policies immediately. No code change. No redeployment. Compliant within minutes.

---

##  6-Week Development Plan

###  Phase 1 — SEED | Week 1–2 | March 4 – March 20
**Goal: Foundation, Research & Planning**
- [x] GitHub repository created with public access and team collaboration configured
- [x] Complete README documented — all features, flows, technical decisions, and regulatory compliance
- [x] Team roles assigned
- [x] UI/UX wireframes in Figma — all screens including heatmap and claim transparency feed
- [ ] Database schema designed — workers, policies, claims, coins, zones, alerts
- [ ] Project folder architecture established in repository
- [ ] FastAPI project skeleton initialised — routing, database connection, auth scaffolding
- [ ] React + Vite initialised — Tailwind, React Router, i18next for all five languages configured

**Deliverable:** README.md + Public GitHub Repository Link + 2-Minute Strategy Video

---

###  Phase 2 — SCALE | Week 3–4 | March 21 – April 4
**Goal: Core Working Prototype**
- [ ] Worker onboarding flow — language selection, OTP, zone setup, plan selection (React)
- [ ] FastAPI authentication with JWT token issuance and validation
- [ ] PostgreSQL connected with all core schemas migrated
- [ ] ML premium model v1 trained and integrated (Random Forest — 14 features)
- [ ] OpenWeatherMap API integrated with zone-based real-time monitoring
- [ ] Three parametric triggers live — Heavy Rain, Extreme Heat, Severe AQI
- [ ] Automated claim trigger and approval logic implemented end-to-end
- [ ] Basic fraud detection — GPS cross-check using simulated location data
- [ ] Razorpay sandbox UPI payout integrated and tested
- [ ] Worker dashboard — policy status, claim history, coins balance
- [ ] Claim Transparency Feed — 5-step real-time status display
- [ ] Hindi language localisation fully operational across all screens
- [ ] Basic coins earning logic active for primary activities

**Deliverable:** Working Prototype + 2-Minute Demo Video

---

###  Phase 3 — SOAR | Week 5–6 | April 5 – April 17
**Goal: Innovation Features + Full Polish + Demo Ready**
- [ ] All 5 triggers complete — Government Curfew and Flash Flood Warning added
- [ ] Advanced Isolation Forest fraud detection model trained and integrated
- [ ] Predictive Alert System — Sunday forecast runs and push notifications live
- [ ] Dangerous Week Premium Warning — surcharge logic and advance notification working
- [ ] Full Rewards and Coins System — earn, balance, and redemption flows complete
- [ ] Vernacular language support extended — Marathi, Tamil, Telugu fully integrated
- [ ] Hyper-Local Zone Risk Heatmap — Leaflet.js with live risk score overlay
- [ ] Full Claim Transparency Feed — animated, timestamped, multilingual
- [ ] Admin and Insurer analytics dashboard — risk charts, claim forecasting, fraud summary
- [ ] Worker Trust Score calculated and displayed on worker profile
- [ ] Progressive Web App configured — installable from Android home screen
- [ ] Admin panel for policy configuration — supports rapid Market Crash compliance updates
- [ ] End-to-end demo recorded — disruption simulation → AI verification → UPI payout

**Deliverable:** Complete Product + 5-Minute Demo Video + Pitch Deck PDF

---

##  Performance & Evaluation Metrics

Measuring platform performance is as important as building features. The following metrics define how GigSure evaluates the effectiveness, reliability, and fairness of its core systems across each phase of development.

| Metric | Definition | Target |
|--------|-----------|--------|
| **Trigger Detection Accuracy Rate** | Percentage of real disruption events correctly detected by the monitoring engine against verified IMD / CPCB data | > 95% |
| **Average Payout Time** | Time elapsed from trigger detection to UPI payout initiation for a clean, approved claim | < 10 minutes |
| **Fraud Detection Precision** | Of all claims flagged by the Isolation Forest model, the percentage that are genuinely anomalous upon manual review | > 85% |
| **Fraud Detection Recall** | Of all genuinely fraudulent claims, the percentage successfully caught by the model before payout | > 80% |
| **Weekly Worker Retention Rate** | Percentage of workers who renew their policy in the following week after their first subscription | > 70% |
| **Zone-Level Claim Ratio Stability** | Standard deviation of claim ratios across zones for the same disruption event — measures fairness of zone-based threshold calibration | < 0.15 |
| **False Positive Rate (Fraud)** | Percentage of legitimate claims incorrectly flagged and sent to manual review — directly impacts worker trust | < 5% |
| **Predictive Alert Accuracy** | Percentage of issued Predictive Alerts that correspond to an actual disruption event occurring that week | > 75% |

These metrics will be tracked in the admin dashboard from Phase 2 onwards and reported in the Phase 3 pitch deck with real data from the platform's operation.

---

##  Demo Video

**Phase 1 — Strategy Video:** https://youtu.be/-w1VRSD8goQ

---

## 📣 Social Media

**Phase 1 — LinkedIn Post:** https://www.linkedin.com/posts/bhanuveer-singh-1368651b5_devtrails2026-devtrails-guidewire-ugcPost-7440387059355398146-PcLO?utm_source=share&utm_medium=member_desktop&rcm=ACoAADIjeHoB4uxGR4c3tFcsX4017hpKeFhkysc

---

##  Team

| Name | Role | GitHub |
|------|------|--------|
| Someya Sharma | Team Lead — Frontend Development (React, Tailwind, Leaflet.js, i18next) | @Someya222 |
| Karman Singh Chawla | Backend (FastAPI, PostgreSQL, ML Integration) | @karmansingh880-collab |
| Bhanuveer Singh | AI / ML Engineering (Fraud Detection, Premium Model, Forecasting) | @Bhanuveer |
| Ayush Kumar Saini | Full Stack, DevOps, and Documentation | @AayushKumar6465 |

---

##  Contact

**University:** Chandigarh University

**Email:** someyasharma2209@gmail.com

---

*Built with dedication for Guidewire DEVTrails 2026 — Seed. Scale. Soar.*
