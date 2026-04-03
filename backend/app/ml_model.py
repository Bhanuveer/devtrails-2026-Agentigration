import numpy as np
from sklearn.ensemble import RandomForestRegressor
import joblib
import os

# ─────────────────────────────────────────
# ZONE RISK DATA — Hyper-local pricing
# ─────────────────────────────────────────

ZONE_RISK_DATA = {
    # High risk zones — monsoon prone
    "411001": {"risk_score": 85, "city": "Pune",      "waterlogging": True,  "trigger_prob": 0.72},
    "411002": {"risk_score": 78, "city": "Pune",      "waterlogging": True,  "trigger_prob": 0.65},
    "411045": {"risk_score": 90, "city": "Pune",      "waterlogging": True,  "trigger_prob": 0.80},
    "400001": {"risk_score": 88, "city": "Mumbai",    "waterlogging": True,  "trigger_prob": 0.78},
    "400050": {"risk_score": 92, "city": "Mumbai",    "waterlogging": True,  "trigger_prob": 0.85},
    "110001": {"risk_score": 70, "city": "Delhi",     "waterlogging": False, "trigger_prob": 0.55},
    "110045": {"risk_score": 75, "city": "Delhi",     "waterlogging": True,  "trigger_prob": 0.62},
    "500001": {"risk_score": 60, "city": "Hyderabad", "waterlogging": False, "trigger_prob": 0.45},
    "600001": {"risk_score": 65, "city": "Chennai",   "waterlogging": True,  "trigger_prob": 0.50},
    # Low risk zones — safe from waterlogging
    "411057": {"risk_score": 30, "city": "Pune",      "waterlogging": False, "trigger_prob": 0.18},
    "411021": {"risk_score": 25, "city": "Pune",      "waterlogging": False, "trigger_prob": 0.15},
    "110090": {"risk_score": 35, "city": "Delhi",     "waterlogging": False, "trigger_prob": 0.22},
}

# ─────────────────────────────────────────
# ACTUARIAL CONSTANTS (Disclosed assumptions)
# BCR target: 0.55–0.70 (65p per ₹1 → payouts)
# ─────────────────────────────────────────

AVG_INCOME_LOST_PER_DAY = 650.0   # ₹ — avg across all workers (disclosed)
AVG_DAYS_EXPOSED        = 1.4     # avg trigger duration in days (historical)
COVERAGE_RATIO          = 0.65    # BCR target — 65% of premium goes to payouts
PLAN_MAX_PAYOUT = {
    "basic"   : 300.0,
    "standard": 450.0,
    "premium" : 650.0,
}

# Plan base prices
PLAN_BASE_PRICE = {
    "basic"   : 29.0,
    "standard": 49.0,
    "premium" : 79.0,
}

# ─────────────────────────────────────────
# ACTUARIAL FORMULA (Transparent)
# Base = P(trigger) × Avg_Income_Loss × Days_Exposed
# This is the formula DEVTrails workshop taught
# ─────────────────────────────────────────

def calculate_actuarial_base(trigger_prob: float, plan_type: str) -> dict:
    """
    Actuarial base premium formula:
    Base = P(trigger) × avg_income_lost_per_day × avg_days_exposed
    Then capped to plan payout limits and BCR targets
    """
    actuarial_pure_premium = trigger_prob * AVG_INCOME_LOST_PER_DAY * AVG_DAYS_EXPOSED
    # Apply coverage ratio — premium must collect enough to fund payouts
    loaded_premium = actuarial_pure_premium / COVERAGE_RATIO
    # Cap to plan base price range (₹20–₹80)
    capped_base = max(20.0, min(PLAN_BASE_PRICE[plan_type] * 1.3, loaded_premium))
    return {
        "trigger_probability"        : round(trigger_prob, 2),
        "avg_income_lost_per_day"    : AVG_INCOME_LOST_PER_DAY,
        "avg_days_exposed"           : AVG_DAYS_EXPOSED,
        "actuarial_pure_premium"     : round(actuarial_pure_premium, 2),
        "coverage_ratio_bcr_target"  : COVERAGE_RATIO,
        "loaded_premium"             : round(loaded_premium, 2),
    }

# ─────────────────────────────────────────
# TRAIN ML MODEL (Random Forest)
# Used for final fine-tuning after actuarial base
# ─────────────────────────────────────────

def train_model():
    X_train = np.array([
        [85, 40,  1, 29, 0.72],
        [85, 40,  1, 49, 0.72],
        [85, 40,  1, 79, 0.72],
        [90, 40,  1, 29, 0.80],
        [90, 75,  1, 49, 0.80],
        [90, 95,  1, 79, 0.80],
        [30, 40,  0, 29, 0.18],
        [30, 75,  0, 49, 0.18],
        [25, 95,  0, 79, 0.15],
        [60, 50,  0, 29, 0.45],
        [70, 60,  1, 49, 0.55],
        [75, 80,  1, 79, 0.62],
        [50, 40,  0, 29, 0.35],
        [65, 65,  1, 49, 0.50],
        [80, 90,  1, 79, 0.72],
    ])
    y_train = np.array([
        1.35, 1.30, 1.25,
        1.40, 1.20, 1.15,
        0.90, 0.85, 0.80,
        1.00, 1.15, 1.10,
        0.95, 1.10, 1.20,
    ])
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    return model

_model = train_model()

# ─────────────────────────────────────────
# MAIN — Calculate Premium (Full transparent)
# Returns formula breakdown + ML adjustment
# ─────────────────────────────────────────

def calculate_premium(plan_type: str, pincode: str, trust_score: float, city: str) -> dict:
    base_price = PLAN_BASE_PRICE.get(plan_type, 49.0)

    zone_data = ZONE_RISK_DATA.get(pincode, {
        "risk_score"  : 50.0,
        "waterlogging": False,
        "trigger_prob": 0.40,
    })

    zone_risk    = zone_data["risk_score"]
    waterlogging = 1 if zone_data["waterlogging"] else 0
    trigger_prob = zone_data.get("trigger_prob", 0.40)

    # ── Step 1: Actuarial base ──────────────────
    actuarial_data = calculate_actuarial_base(trigger_prob, plan_type)

    # ── Step 2: ML fine-tuning adjustment ──────
    features = np.array([[zone_risk, trust_score, waterlogging, base_price, trigger_prob]])
    adjustment_factor = float(_model.predict(features)[0])
    adjustment_factor = max(0.7, min(1.4, adjustment_factor))

    # ── Step 3: Manual adjustments (transparent) ─
    loyalty_discount   = round(min((trust_score - 40) / 100 * 5, 5), 2) if trust_score > 40 else 0
    waterlogging_adj   = +5.0 if waterlogging else -2.0
    zone_adjustment    = round((adjustment_factor - 1.0) * base_price, 2)

    # ── Step 4: Final premium ───────────────────
    final_premium = round(base_price * adjustment_factor, 2)

    # ── Stress Scenario: 14-day monsoon ────────
    stress_scenario = {
        "scenario"              : "14-day monsoon (worst case)",
        "trigger_days"          : 14,
        "max_payout_per_day"    : PLAN_MAX_PAYOUT.get(plan_type, 300),
        "total_exposure"        : round(14 * PLAN_MAX_PAYOUT.get(plan_type, 300), 2),
        "weeks_premium_needed"  : round((14 * PLAN_MAX_PAYOUT.get(plan_type, 300)) / (final_premium * 52 / 12), 1),
        "bcr_in_stress"         : round((14 * PLAN_MAX_PAYOUT.get(plan_type, 300)) / (final_premium * 4), 2),
        "verdict"               : "Reserves needed" if (14 * PLAN_MAX_PAYOUT.get(plan_type, 300)) / (final_premium * 4) > 0.85 else "Within sustainable BCR"
    }

    return {
        "base_premium"      : base_price,
        "final_premium"     : final_premium,
        "zone_risk"         : zone_risk,
        "adjustment_factor" : round(adjustment_factor, 3),

        # Transparent formula breakdown (for Policy page UI)
        "formula_breakdown" : {
            "step1_actuarial": {
                "label"     : "Step 1 — Actuarial Base",
                "formula"   : "P(trigger) × avg_income_loss × days_exposed",
                "values"    : actuarial_data,
                "result"    : f"₹{actuarial_data['actuarial_pure_premium']}"
            },
            "step2_ml": {
                "label"     : "Step 2 — ML Risk Adjustment",
                "model"     : "Random Forest (zone_risk, trust_score, waterlogging, trigger_prob)",
                "factor"    : round(adjustment_factor, 3),
                "result"    : f"Base ₹{base_price} × {round(adjustment_factor, 3)} = ₹{final_premium}"
            },
            "step3_adjustments": {
                "label"            : "Step 3 — Personalised Adjustments",
                "zone_adjustment"  : zone_adjustment,
                "waterlogging_adj" : waterlogging_adj,
                "loyalty_discount" : -loyalty_discount,
                "waterlogging_zone": zone_data["waterlogging"],
                "trust_score"      : trust_score,
                "plan_type"        : plan_type,
            }
        },

        # Actuarial health metrics
        "actuarial": {
            "trigger_probability"   : trigger_prob,
            "bcr_target"            : COVERAGE_RATIO,
            "bcr_label"             : f"{int(COVERAGE_RATIO*100)}p per ₹1 goes to payouts",
            "assumptions_disclosed" : True,
            "stress_scenario"       : stress_scenario,
        },

        # Legacy breakdown key (keeps Policy.jsx working)
        "breakdown": {
            "base_price"        : base_price,
            "zone_adjustment"   : zone_adjustment,
            "loyalty_discount"  : -loyalty_discount,
            "waterlogging_zone" : zone_data["waterlogging"],
            "trust_score"       : trust_score,
            "plan_type"         : plan_type,
            "trigger_prob"      : trigger_prob,
        }
    }

# ─────────────────────────────────────────
# ACTUARIAL HEALTH — For dashboard widget
# BCR = total_claims_paid / total_premium_collected
# ─────────────────────────────────────────

def calculate_bcr(total_claims_paid: float, total_premium_collected: float) -> dict:
    if total_premium_collected == 0:
        return {
            "bcr"          : 0,
            "loss_ratio"   : 0,
            "status"       : "No data yet",
            "health"       : "neutral",
            "bcr_label"    : "BCR = Total Claims ÷ Total Premium",
            "target"       : "Target: 0.55–0.70"
        }

    bcr         = round(total_claims_paid / total_premium_collected, 3)
    loss_ratio  = round(bcr * 100, 1)

    if bcr < 0.55:
        status = "Under-utilized — premium may be too high"
        health = "warning"
    elif bcr <= 0.70:
        status = "✅ Healthy — within BCR target"
        health = "good"
    elif bcr <= 0.85:
        status = "⚠️ Elevated — monitor closely"
        health = "warning"
    else:
        status = "🚨 Critical — suspend new enrolments (Loss Ratio > 85%)"
        health = "critical"

    return {
        "bcr"               : bcr,
        "loss_ratio"        : loss_ratio,
        "status"            : status,
        "health"            : health,
        "total_claims_paid" : total_claims_paid,
        "total_premium"     : total_premium_collected,
        "paise_per_rupee"   : round(bcr * 100, 1),
        "bcr_label"         : "BCR = Total Claims ÷ Total Premium",
        "target"            : "Target BCR: 0.55–0.70"
    }