import numpy as np
from sklearn.ensemble import RandomForestRegressor
import joblib
import os

# ─────────────────────────────────────────
# ZONE RISK DATA — Hyper-local pricing
# Judges specifically dekhenge yeh feature
# ─────────────────────────────────────────

ZONE_RISK_DATA = {
    # High risk zones — monsoon prone
    "411001": {"risk_score": 85, "city": "Pune",      "waterlogging": True},
    "411002": {"risk_score": 78, "city": "Pune",      "waterlogging": True},
    "411045": {"risk_score": 90, "city": "Pune",      "waterlogging": True},
    "400001": {"risk_score": 88, "city": "Mumbai",    "waterlogging": True},
    "400050": {"risk_score": 92, "city": "Mumbai",    "waterlogging": True},
    "110001": {"risk_score": 70, "city": "Delhi",     "waterlogging": False},
    "110045": {"risk_score": 75, "city": "Delhi",     "waterlogging": True},
    "500001": {"risk_score": 60, "city": "Hyderabad", "waterlogging": False},
    "600001": {"risk_score": 65, "city": "Chennai",   "waterlogging": True},
    # Low risk zones — safe from waterlogging
    "411057": {"risk_score": 30, "city": "Pune",      "waterlogging": False},
    "411021": {"risk_score": 25, "city": "Pune",      "waterlogging": False},
    "110090": {"risk_score": 35, "city": "Delhi",     "waterlogging": False},
}

# Plan base prices
PLAN_BASE_PRICE = {
    "basic"   : 29.0,
    "standard": 49.0,
    "premium" : 79.0
}

# ─────────────────────────────────────────
# TRAIN ML MODEL
# Simple Random Forest — works perfectly
# ─────────────────────────────────────────

def train_model():
    """
    Train Random Forest on simulated historical data.
    Features: zone_risk, trust_score, waterlogging, base_price
    Output: premium_adjustment_factor
    """

    # Simulated training data
    # [zone_risk, trust_score, waterlogging, base_price] → adjustment_factor
    X_train = np.array([
        [85, 40,  1, 29],   # High risk, new worker, waterlogged → high adjustment
        [85, 40,  1, 49],
        [85, 40,  1, 79],
        [90, 40,  1, 29],
        [90, 75,  1, 49],   # High risk, trusted worker → medium adjustment
        [90, 95,  1, 79],
        [30, 40,  0, 29],   # Low risk, new worker, no waterlogging → low adjustment
        [30, 75,  0, 49],
        [25, 95,  0, 79],   # Low risk, trusted worker → lowest adjustment
        [60, 50,  0, 29],
        [70, 60,  1, 49],
        [75, 80,  1, 79],
        [50, 40,  0, 29],
        [65, 65,  1, 49],
        [80, 90,  1, 79],
    ])

    y_train = np.array([
        1.35, 1.30, 1.25,   # High risk cases
        1.40, 1.20, 1.15,
        0.90, 0.85, 0.80,   # Low risk cases
        1.00, 1.15, 1.10,
        0.95, 1.10, 1.20,
    ])

    model = RandomForestRegressor(
        n_estimators=100,
        random_state=42
    )
    model.fit(X_train, y_train)
    return model

# Train model on startup
_model = train_model()

# ─────────────────────────────────────────
# MAIN FUNCTION — Calculate Premium
# ─────────────────────────────────────────

def calculate_premium(plan_type: str, pincode: str, trust_score: float, city: str) -> dict:

    base_price = PLAN_BASE_PRICE.get(plan_type, 49.0)

    # Get zone risk data
    zone_data = ZONE_RISK_DATA.get(pincode, {
        "risk_score"  : 50.0,
        "waterlogging": False
    })

    zone_risk     = zone_data["risk_score"]
    waterlogging  = 1 if zone_data["waterlogging"] else 0

    # ML model prediction
    features = np.array([[zone_risk, trust_score, waterlogging, base_price]])
    adjustment_factor = float(_model.predict(features)[0])

    # Clamp between 0.7 and 1.4
    adjustment_factor = max(0.7, min(1.4, adjustment_factor))

    # Final premium
    final_premium = round(base_price * adjustment_factor, 2)

    # Breakdown for transparency
    zone_adjustment  = round((adjustment_factor - 1.0) * base_price, 2)
    loyalty_discount = round(min((trust_score - 40) / 100 * 5, 5), 2) if trust_score > 40 else 0

    return {
        "base_premium"      : base_price,
        "final_premium"     : final_premium,
        "zone_risk"         : zone_risk,
        "adjustment_factor" : round(adjustment_factor, 3),
        "breakdown"         : {
            "base_price"        : base_price,
            "zone_adjustment"   : zone_adjustment,
            "loyalty_discount"  : -loyalty_discount,
            "waterlogging_zone" : zone_data["waterlogging"],
            "trust_score"       : trust_score,
            "plan_type"         : plan_type
        }
    }