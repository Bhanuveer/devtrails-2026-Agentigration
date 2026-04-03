import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("OPENWEATHER_API_KEY")

# ─────────────────────────────────────────
# TRIGGER THRESHOLDS
# ─────────────────────────────────────────

THRESHOLDS = {
    "rain"   : 50.0,   # mm per day
    "heat"   : 43.0,   # feels like °C
    "aqi"    : 300.0,  # AQI index
    "curfew" : 1,      # 1 = active curfew
    "flood"  : 1,      # 1 = red/orange alert active
}

# City coordinates for OpenWeatherMap
CITY_COORDS = {
    "pune"     : {"lat": 18.5204, "lon": 73.8567},
    "mumbai"   : {"lat": 19.0760, "lon": 72.8777},
    "delhi"    : {"lat": 28.6139, "lon": 77.2090},
    "hyderabad": {"lat": 17.3850, "lon": 78.4867},
    "chennai"  : {"lat": 13.0827, "lon": 80.2707},
    "bangalore": {"lat": 12.9716, "lon": 77.5946},
}

# ─────────────────────────────────────────
# TRIGGER 1 — RAIN (Live API)
# ─────────────────────────────────────────

def check_rain_trigger(lat: float, lon: float) -> dict:
    try:
        url = "https://api.openweathermap.org/data/2.5/forecast"
        params = {"lat": lat, "lon": lon, "appid": API_KEY, "units": "metric"}
        response = requests.get(url, params=params, timeout=5)
        data = response.json()

        total_rain = 0
        for item in data.get("list", [])[:8]:   # 8 × 3hr = 24 hours
            rain = item.get("rain", {}).get("3h", 0)
            total_rain += rain

        triggered = total_rain >= THRESHOLDS["rain"]
        return {
            "triggered"     : triggered,
            "trigger_type"  : "rain",
            "trigger_value" : round(total_rain, 2),
            "threshold"     : THRESHOLDS["rain"],
            "unit"          : "mm/24hr",
            "payout_amount" : 400,
            "message"       : f"{'Heavy rain detected' if triggered else 'Rain normal'}: {round(total_rain, 2)}mm in 24hrs (threshold: {THRESHOLDS['rain']}mm)",
            "source"        : "OpenWeatherMap Live API"
        }
    except Exception as e:
        print(f"Rain API error: {e}")
    return {
        "triggered": False, "trigger_type": "rain", "trigger_value": 0,
        "threshold": THRESHOLDS["rain"], "unit": "mm/24hr",
        "payout_amount": 400, "message": "Rain API unavailable", "source": "OpenWeatherMap"
    }


# ─────────────────────────────────────────
# TRIGGER 2 — HEAT (Live API)
# ─────────────────────────────────────────

def check_heat_trigger(lat: float, lon: float) -> dict:
    try:
        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {"lat": lat, "lon": lon, "appid": API_KEY, "units": "metric"}
        response = requests.get(url, params=params, timeout=5)
        data = response.json()

        feels_like = data.get("main", {}).get("feels_like", 0)
        triggered  = feels_like >= THRESHOLDS["heat"]
        return {
            "triggered"     : triggered,
            "trigger_type"  : "heat",
            "trigger_value" : round(feels_like, 1),
            "threshold"     : THRESHOLDS["heat"],
            "unit"          : "°C feels-like",
            "payout_amount" : 300,
            "message"       : f"{'Extreme heat' if triggered else 'Heat normal'}: {round(feels_like,1)}°C feels-like (threshold: {THRESHOLDS['heat']}°C)",
            "source"        : "OpenWeatherMap Live API"
        }
    except Exception as e:
        print(f"Heat API error: {e}")
    return {
        "triggered": False, "trigger_type": "heat", "trigger_value": 0,
        "threshold": THRESHOLDS["heat"], "unit": "°C", "payout_amount": 300,
        "message": "Heat API unavailable", "source": "OpenWeatherMap"
    }


# ─────────────────────────────────────────
# TRIGGER 3 — AQI (Mocked — CPCB API)
# Phase 2: Mock data per city
# Phase 3: Replace with live CPCB API
# ─────────────────────────────────────────

MOCK_AQI = {
    "delhi"    : 320,
    "mumbai"   : 150,
    "pune"     : 95,
    "hyderabad": 110,
    "chennai"  : 130,
    "bangalore": 85,
}

def check_aqi_trigger(city: str) -> dict:
    aqi_value = MOCK_AQI.get(city.lower(), 100)
    triggered  = aqi_value >= THRESHOLDS["aqi"]
    return {
        "triggered"     : triggered,
        "trigger_type"  : "aqi",
        "trigger_value" : aqi_value,
        "threshold"     : THRESHOLDS["aqi"],
        "unit"          : "AQI index",
        "payout_amount" : 350,
        "message"       : f"{'Severe AQI' if triggered else 'AQI normal'}: {aqi_value} in {city} (threshold: {THRESHOLDS['aqi']})",
        "source"        : "CPCB API (mocked — Phase 2)"
    }


# ─────────────────────────────────────────
# TRIGGER 4 — CURFEW / BANDH (Mocked)
# Mock: Government Alert API
# In production: Official disaster mgmt API
# ─────────────────────────────────────────

MOCK_CURFEW = {
    "delhi"    : {"active": False, "reason": "No active curfew"},
    "mumbai"   : {"active": False, "reason": "No active curfew"},
    "pune"     : {"active": False, "reason": "No active curfew"},
    "hyderabad": {"active": False, "reason": "No active restrictions"},
    "chennai"  : {"active": False, "reason": "No active restrictions"},
    "bangalore": {"active": False, "reason": "No active restrictions"},
}

def check_curfew_trigger(city: str) -> dict:
    curfew_data = MOCK_CURFEW.get(city.lower(), {"active": False, "reason": "No data"})
    triggered   = curfew_data["active"]
    return {
        "triggered"     : triggered,
        "trigger_type"  : "curfew",
        "trigger_value" : 1 if triggered else 0,
        "threshold"     : 1,
        "unit"          : "Active Alert",
        "payout_amount" : 500,
        "message"       : curfew_data["reason"] if not triggered else f"⚠️ Curfew active in {city}: {curfew_data['reason']}",
        "source"        : "Government Alert API (mocked — Phase 2)"
    }


# ─────────────────────────────────────────
# TRIGGER 5 — FLASH FLOOD (Mocked)
# Mock: IMD Alert Feed
# In production: IMD RSS / official API
# ─────────────────────────────────────────

MOCK_FLOOD = {
    "mumbai"   : {"alert": "Red",    "active": True,  "reason": "IMD Red Alert: Extreme flooding expected in coastal zones"},
    "pune"     : {"alert": "Orange", "active": False, "reason": "IMD Orange Alert: Watch for flash flooding"},
    "delhi"    : {"alert": "None",   "active": False, "reason": "No flood alert"},
    "hyderabad": {"alert": "None",   "active": False, "reason": "No flood alert"},
    "chennai"  : {"alert": "None",   "active": False, "reason": "No flood alert"},
    "bangalore": {"alert": "None",   "active": False, "reason": "No flood alert"},
}

def check_flood_trigger(city: str) -> dict:
    flood_data = MOCK_FLOOD.get(city.lower(), {"alert": "None", "active": False, "reason": "No data"})
    triggered  = flood_data["active"] and flood_data["alert"] in ["Red", "Orange"]
    return {
        "triggered"     : triggered,
        "trigger_type"  : "flood",
        "trigger_value" : 1 if triggered else 0,
        "threshold"     : 1,
        "unit"          : "IMD Alert Level",
        "payout_amount" : 450,
        "message"       : flood_data["reason"],
        "alert_level"   : flood_data["alert"],
        "source"        : "IMD Alert Feed (mocked — Phase 2)"
    }


# ─────────────────────────────────────────
# SIMULATION — For Demo (Force trigger any type)
# Used by POST /trigger/simulate endpoint
# ─────────────────────────────────────────

SIMULATED_TRIGGERS = {
    "rain": {
        "triggered": True, "trigger_type": "rain",
        "trigger_value": 68.0, "threshold": 50.0,
        "unit": "mm/24hr", "payout_amount": 400,
        "message": "🌧️ SIMULATED: Heavy rain 68mm detected in your zone (threshold: 50mm)",
        "source": "Demo Simulation"
    },
    "heat": {
        "triggered": True, "trigger_type": "heat",
        "trigger_value": 46.5, "threshold": 43.0,
        "unit": "°C feels-like", "payout_amount": 300,
        "message": "🌡️ SIMULATED: Extreme heat 46.5°C feels-like (threshold: 43°C)",
        "source": "Demo Simulation"
    },
    "aqi": {
        "triggered": True, "trigger_type": "aqi",
        "trigger_value": 380, "threshold": 300,
        "unit": "AQI index", "payout_amount": 350,
        "message": "😷 SIMULATED: Severe AQI 380 detected in your zone (threshold: 300)",
        "source": "Demo Simulation"
    },
    "curfew": {
        "triggered": True, "trigger_type": "curfew",
        "trigger_value": 1, "threshold": 1,
        "unit": "Active Alert", "payout_amount": 500,
        "message": "🚧 SIMULATED: Government curfew issued — all mobility restricted in your zone",
        "source": "Demo Simulation"
    },
    "flood": {
        "triggered": True, "trigger_type": "flood",
        "trigger_value": 1, "threshold": 1,
        "unit": "IMD Alert Level", "payout_amount": 450,
        "message": "🌊 SIMULATED: IMD Red Alert — Flash flood warning issued for your zone",
        "alert_level": "Red",
        "source": "Demo Simulation"
    }
}

def get_simulated_trigger(trigger_type: str) -> dict:
    return SIMULATED_TRIGGERS.get(trigger_type, SIMULATED_TRIGGERS["rain"])


# ─────────────────────────────────────────
# MAIN — Check All 5 Triggers (Real data)
# Returns all statuses + first triggered one
# ─────────────────────────────────────────

def check_weather_trigger(pincode: str, city: str) -> dict:
    city_lower = city.lower()
    coords     = CITY_COORDS.get(city_lower, {"lat": 18.5204, "lon": 73.8567})
    lat        = coords["lat"]
    lon        = coords["lon"]

    # Run all 5 checks
    rain_result   = check_rain_trigger(lat, lon)
    heat_result   = check_heat_trigger(lat, lon)
    aqi_result    = check_aqi_trigger(city)
    curfew_result = check_curfew_trigger(city)
    flood_result  = check_flood_trigger(city)

    all_triggers = {
        "rain"  : rain_result,
        "heat"  : heat_result,
        "aqi"   : aqi_result,
        "curfew": curfew_result,
        "flood" : flood_result,
    }

    # Find first active trigger
    for trigger_type, result in all_triggers.items():
        if result["triggered"]:
            return {**result, "all_triggers": all_triggers}

    # None triggered — return full status object
    return {
        "triggered"   : False,
        "trigger_type": None,
        "trigger_value": 0,
        "message"     : "No disruption detected in your zone",
        "all_triggers": all_triggers
    }
