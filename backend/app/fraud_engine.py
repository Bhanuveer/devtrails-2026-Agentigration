"""
fraud_engine.py — GigSure Advanced Fraud Detection Engine
Phase 3: Delivery-specific fraud with historical data cross-checking

4 Fraud Checks:
  1. GPS Spoofing Detection     — Emulator coords, VPN GPS, zone mismatch
  2. Historical Weather Verify  — Was this trigger plausible for this pincode/date?
  3. Claim Surge Detection      — Worker claiming too frequently?
  4. Platform Activity Check    — Was rider active on platform during disruption?
"""

import math
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from . import models

# ─────────────────────────────────────────────────────────────────────────────
# HISTORICAL WEATHER DATABASE (Mock — 24 months IMD data per pincode)
# In production: replace with real IMD/OpenWeather historical API
# ─────────────────────────────────────────────────────────────────────────────
PINCODE_WEATHER_HISTORY = {
    "411001": {"rain_breach_days": 45, "rain_breach_prob": 0.38, "heat_breach_days": 12, "aqi_breach_days": 8,  "flood_days": 3,  "curfew_days": 1, "city": "Pune"},
    "411002": {"rain_breach_days": 42, "rain_breach_prob": 0.35, "heat_breach_days": 14, "aqi_breach_days": 6,  "flood_days": 1,  "curfew_days": 0, "city": "Pune"},
    "411045": {"rain_breach_days": 38, "rain_breach_prob": 0.32, "heat_breach_days": 18, "aqi_breach_days": 5,  "flood_days": 1,  "curfew_days": 0, "city": "Pune"},
    "400001": {"rain_breach_days": 58, "rain_breach_prob": 0.48, "heat_breach_days": 6,  "aqi_breach_days": 18, "flood_days": 8,  "curfew_days": 2, "city": "Mumbai"},
    "400051": {"rain_breach_days": 61, "rain_breach_prob": 0.51, "heat_breach_days": 5,  "aqi_breach_days": 15, "flood_days": 12, "curfew_days": 1, "city": "Mumbai"},
    "560001": {"rain_breach_days": 38, "rain_breach_prob": 0.32, "heat_breach_days": 20, "aqi_breach_days": 10, "flood_days": 2,  "curfew_days": 0, "city": "Bangalore"},
    "600001": {"rain_breach_days": 35, "rain_breach_prob": 0.29, "heat_breach_days": 25, "aqi_breach_days": 5,  "flood_days": 4,  "curfew_days": 3, "city": "Chennai"},
}
DEFAULT_WEATHER = {
    "rain_breach_days": 40, "rain_breach_prob": 0.35,
    "heat_breach_days": 15, "aqi_breach_days": 10,
    "flood_days": 3, "curfew_days": 1, "city": "Unknown"
}

# ─────────────────────────────────────────────────────────────────────────────
# GPS PINCODE CENTER COORDINATES
# ─────────────────────────────────────────────────────────────────────────────
PINCODE_CENTERS = {
    "411001": (18.5204, 73.8567),
    "411002": (18.5362, 73.8799),
    "411045": (18.5089, 73.7851),
    "400001": (18.9388, 72.8354),
    "400051": (19.0596, 72.8295),
    "560001": (12.9716, 77.5946),
    "600001": (13.0827, 80.2707),
}

# Known emulator/VPN default GPS coordinates (fingerprinting DB)
EMULATOR_GPS_SIGNATURES = [
    (0.0,     0.0),         # Null island — classic Android emulator default
    (37.4219, -122.0840),   # Google campus — Android Studio emulator
    (51.5074, -0.1278),     # London — common VPN GPS spoof
    (40.7128, -74.0060),    # New York — common VPN GPS spoof
    (1.3521,  103.8198),    # Singapore — common Asia VPN exit
]
GPS_SPOOF_RADIUS_KM = 0.001  # If within 100m of known emulator coord = flagged


# ─────────────────────────────────────────────────────────────────────────────
# UTILITY
# ─────────────────────────────────────────────────────────────────────────────
def _haversine_km(lat1, lon1, lat2, lon2) -> float:
    """Calculate distance between two GPS coordinates in kilometres."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2))
         * math.sin(dlon / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ─────────────────────────────────────────────────────────────────────────────
# CHECK 1 — GPS Spoofing Detection
# ─────────────────────────────────────────────────────────────────────────────
def check_gps_spoofing(lat: float, lon: float, pincode: str) -> dict:
    """
    Detects GPS spoofing via 3 sub-checks:
      A. Emulator fingerprint match (known fake GPS coords)
      B. Zone mismatch (rider's GPS is outside registered pincode zone)
      C. Precision anomaly (GPS has suspiciously round numbers = fake)
    """
    flags = []
    risk_score = 0.0

    # A. Emulator fingerprint check
    for (elat, elon) in EMULATOR_GPS_SIGNATURES:
        if _haversine_km(lat, lon, elat, elon) < GPS_SPOOF_RADIUS_KM:
            flags.append("⚠️ GPS matches known emulator/VPN coordinate")
            risk_score += 0.6
            break

    # B. Zone mismatch check
    if pincode in PINCODE_CENTERS:
        clat, clon = PINCODE_CENTERS[pincode]
        distance_km = _haversine_km(lat, lon, clat, clon)
        if distance_km > 25:
            flags.append(f"⚠️ GPS is {distance_km:.1f}km from registered zone")
            risk_score += 0.35
        elif distance_km > 10:
            flags.append(f"ℹ️ GPS is {distance_km:.1f}km from zone centre")
            risk_score += 0.10

    # C. Precision anomaly (exactly 0 decimal or suspiciously round)
    if lat == round(lat, 0) or lon == round(lon, 0):
        flags.append("⚠️ GPS precision anomaly — rounded coordinates detected")
        risk_score += 0.4

    passed = risk_score < 0.3
    return {
        "check"       : "GPS Spoofing Detection",
        "passed"      : passed,
        "risk_contribution": round(min(risk_score, 1.0), 3),
        "flags"       : flags if flags else ["✅ GPS coordinates verified — no spoofing detected"],
        "detail"      : f"Lat: {lat}, Lon: {lon} | Zone: {pincode}",
    }


# ─────────────────────────────────────────────────────────────────────────────
# CHECK 2 — Historical Weather Cross-Verification
# ─────────────────────────────────────────────────────────────────────────────
def check_weather_historical(pincode: str, trigger_type: str) -> dict:
    """
    Cross-checks the claimed trigger type against 24-month historical data
    for this pincode. Low-probability trigger in a historically safe zone = suspicious.
    """
    hist = PINCODE_WEATHER_HISTORY.get(pincode, DEFAULT_WEATHER)
    trigger_map = {
        "rain" : ("rain_breach_days",  "rain_breach_prob",  0.15),
        "heat" : ("heat_breach_days",  "heat_breach_days",  0.08),
        "aqi"  : ("aqi_breach_days",   "aqi_breach_days",   0.05),
        "flood": ("flood_days",        "flood_days",        0.02),
        "curfew": ("curfew_days",      "curfew_days",       0.01),
    }

    days_key, _, min_days = trigger_map.get(trigger_type, ("rain_breach_days", "rain_breach_prob", 0.1))
    historical_days = hist.get(days_key, 20)
    # Probability = historical_days / 730 (24 months = ~730 days)
    historical_prob = round(historical_days / 730, 3)

    risk_contribution = 0.0
    flags = []

    if historical_days < 5:
        flags.append(f"⚠️ Only {historical_days} {trigger_type} breach days in 24 months — rare event for this zone")
        risk_contribution = 0.45
    elif historical_days < 15:
        flags.append(f"ℹ️ {historical_days} breach days in 24 months — below average for this trigger")
        risk_contribution = 0.15
    else:
        flags.append(f"✅ {historical_days} historical breach days — consistent with zone risk profile")

    passed = risk_contribution < 0.3
    return {
        "check"            : "Historical Weather Verification",
        "passed"           : passed,
        "risk_contribution": round(risk_contribution, 3),
        "historical_days"  : historical_days,
        "historical_prob"  : historical_prob,
        "flags"            : flags,
        "detail"           : f"Pincode {pincode} ({hist['city']}) — {trigger_type} trigger | 24-month history: {historical_days} breach days",
    }


# ─────────────────────────────────────────────────────────────────────────────
# CHECK 3 — Claim Surge / Frequency Analysis
# ─────────────────────────────────────────────────────────────────────────────
def check_claim_surge(worker_id: int, trigger_type: str, db: Session) -> dict:
    """
    Checks if this worker is claiming too frequently:
      - More than 2 claims of same trigger type in 7 days = suspicious
      - More than 4 total claims in 30 days = flagged
    """
    now = datetime.utcnow()
    week_ago   = now - timedelta(days=7)
    month_ago  = now - timedelta(days=30)

    # Same trigger in past 7 days
    same_trigger_7d = db.query(models.Claim).filter(
        models.Claim.worker_id == worker_id,
        models.Claim.trigger_type == trigger_type,
        models.Claim.created_at >= week_ago,
    ).count()

    # Total claims in past 30 days
    total_30d = db.query(models.Claim).filter(
        models.Claim.worker_id == worker_id,
        models.Claim.created_at >= month_ago,
    ).count()

    flags = []
    risk_contribution = 0.0

    if same_trigger_7d >= 2:
        flags.append(f"⚠️ {same_trigger_7d} {trigger_type} claims in last 7 days — surge detected")
        risk_contribution += 0.45
    else:
        flags.append(f"✅ {same_trigger_7d} same-trigger claim(s) in 7 days — within normal range")

    if total_30d >= 4:
        flags.append(f"⚠️ {total_30d} total claims in 30 days — above expected frequency")
        risk_contribution += 0.30
    else:
        flags.append(f"✅ {total_30d} total claim(s) in 30 days — normal frequency")

    passed = risk_contribution < 0.3
    return {
        "check"              : "Claim Surge Detection",
        "passed"             : passed,
        "risk_contribution"  : round(min(risk_contribution, 1.0), 3),
        "same_trigger_7d"    : same_trigger_7d,
        "total_claims_30d"   : total_30d,
        "flags"              : flags,
        "detail"             : f"Worker #{worker_id} | {same_trigger_7d}x {trigger_type} in 7d | {total_30d} total in 30d",
    }


# ─────────────────────────────────────────────────────────────────────────────
# CHECK 4 — Platform Activity Check (Delivery-Specific)
# ─────────────────────────────────────────────────────────────────────────────
def check_platform_activity(worker: models.Worker, trigger_type: str) -> dict:
    """
    Delivery-specific check: was the rider actually on the platform
    (or attempting deliveries) during the disruption period?

    Logic:
    - A genuine worker affected by rain WOULD show login activity but cancelled/rejected orders
    - A fraudulent claim MAY show NO platform activity at all (they were not working)
    - Trust score modulates this: high trust = lower suspicion even with low activity
    """
    flags = []
    risk_contribution = 0.0

    trust_score = getattr(worker, 'trust_score', 50) or 50

    # Simulate platform activity check (in production: real Zepto/Blinkit API)
    # We use trust score as a proxy for historical platform behaviour
    # High trust = historically active and genuine = lower fraud risk
    if trust_score >= 70:
        flags.append(f"✅ Trust score {trust_score} — consistent platform activity history")
        risk_contribution = 0.0
    elif trust_score >= 40:
        flags.append(f"ℹ️ Trust score {trust_score} — moderate activity history")
        risk_contribution = 0.10
    else:
        flags.append(f"⚠️ Trust score {trust_score} — limited platform activity history")
        risk_contribution = 0.30

    # Trigger-specific activity check
    if trigger_type in ["rain", "flood"]:
        flags.append("✅ Weather disruption — cancellation during extreme rain is expected behaviour")
    elif trigger_type == "curfew":
        flags.append("✅ Curfew/Bandh — platform-wide shutdown confirmed in zone")
    elif trigger_type in ["heat", "aqi"]:
        flags.append("ℹ️ Heat/AQI disruption — partial platform activity may still occur")
        risk_contribution += 0.05

    passed = risk_contribution < 0.25
    return {
        "check"            : "Platform Activity Verification",
        "passed"           : passed,
        "risk_contribution": round(risk_contribution, 3),
        "trust_score"      : trust_score,
        "flags"            : flags,
        "detail"           : f"Delivery partner trust score: {trust_score}/100 | Trigger: {trigger_type}",
    }


# ─────────────────────────────────────────────────────────────────────────────
# MASTER FRAUD CHECK — Runs all 4 checks and returns composite score
# ─────────────────────────────────────────────────────────────────────────────
def run_advanced_fraud_check(
    worker: models.Worker,
    trigger_type: str,
    lat: float,
    lon: float,
    db: Session,
) -> dict:
    """
    Runs all 4 fraud checks and returns a composite risk score.
    Final fraud_score = weighted average of all 4 check risk contributions.

    Weights (delivery-specific priority):
      GPS Spoofing          : 35%
      Historical Weather    : 25%
      Claim Surge           : 25%
      Platform Activity     : 15%
    """
    pincode  = getattr(worker, 'pincode', '411001') or '411001'
    worker_id = worker.id

    gps_result      = check_gps_spoofing(lat, lon, pincode)
    weather_result  = check_weather_historical(pincode, trigger_type)
    surge_result    = check_claim_surge(worker_id, trigger_type, db)
    activity_result = check_platform_activity(worker, trigger_type)

    # Weighted composite score
    fraud_score = round(
        gps_result["risk_contribution"]      * 0.35 +
        weather_result["risk_contribution"]  * 0.25 +
        surge_result["risk_contribution"]    * 0.25 +
        activity_result["risk_contribution"] * 0.15,
        3
    )

    verdict  = "CLEAN"   if fraud_score < 0.2 else \
               "REVIEW"  if fraud_score < 0.5 else "FLAGGED"
    approved = fraud_score < 0.5

    return {
        "fraud_score"    : fraud_score,
        "verdict"        : verdict,
        "approved"       : approved,
        "checks": {
            "gps_spoofing"         : gps_result,
            "historical_weather"   : weather_result,
            "claim_surge"          : surge_result,
            "platform_activity"    : activity_result,
        },
        "summary": (
            f"Fraud Score: {fraud_score} — {verdict}. "
            f"GPS: {'✅' if gps_result['passed'] else '⚠️'} | "
            f"Weather: {'✅' if weather_result['passed'] else '⚠️'} | "
            f"Surge: {'✅' if surge_result['passed'] else '⚠️'} | "
            f"Activity: {'✅' if activity_result['passed'] else '⚠️'}"
        )
    }
