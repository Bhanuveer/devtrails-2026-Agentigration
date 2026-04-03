import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("OPENWEATHER_API_KEY")

# ─────────────────────────────────────────
# TRIGGER THRESHOLDS
# ─────────────────────────────────────────

THRESHOLDS = {
    "rain" : 50.0,   # mm per day
    "heat" : 43.0,   # feels like °C
    "aqi"  : 300.0,  # AQI index
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
# RAIN TRIGGER
# ─────────────────────────────────────────

def check_rain_trigger(lat: float, lon: float) -> dict:
    try:
        url = f"https://api.openweathermap.org/data/2.5/forecast"
        params = {
            "lat"  : lat,
            "lon"  : lon,
            "appid": API_KEY,
            "units": "metric"
        }
        response = requests.get(url, params=params, timeout=5)
        data = response.json()

        # Check next 24 hours rainfall
        total_rain = 0
        for item in data.get("list", [])[:8]:  # 8 x 3hr = 24 hours
            rain = item.get("rain", {}).get("3h", 0)
            total_rain += rain

        if total_rain >= THRESHOLDS["rain"]:
            return {
                "triggered"    : True,
                "trigger_type" : "rain",
                "trigger_value": round(total_rain, 2),
                "threshold"    : THRESHOLDS["rain"],
                "message"      : f"Heavy rain detected: {round(total_rain, 2)}mm in 24hrs"
            }
    except Exception as e:
        print(f"Rain API error: {e}")

    return {"triggered": False, "trigger_type": "rain", "trigger_value": 0}


# ─────────────────────────────────────────
# HEAT TRIGGER
# ─────────────────────────────────────────

def check_heat_trigger(lat: float, lon: float) -> dict:
    try:
        url = f"https://api.openweathermap.org/data/2.5/weather"
        params = {
            "lat"  : lat,
            "lon"  : lon,
            "appid": API_KEY,
            "units": "metric"
        }
        response = requests.get(url, params=params, timeout=5)
        data = response.json()

        feels_like = data.get("main", {}).get("feels_like", 0)

        if feels_like >= THRESHOLDS["heat"]:
            return {
                "triggered"    : True,
                "trigger_type" : "heat",
                "trigger_value": feels_like,
                "threshold"    : THRESHOLDS["heat"],
                "message"      : f"Extreme heat detected: {feels_like}°C feels like"
            }
    except Exception as e:
        print(f"Heat API error: {e}")

    return {"triggered": False, "trigger_type": "heat", "trigger_value": 0}


# ─────────────────────────────────────────
# AQI TRIGGER — Mocked (CPCB API needs key)
# ─────────────────────────────────────────

def check_aqi_trigger(city: str) -> dict:
    # Mocked AQI data — replace with real CPCB API in Phase 3
    mock_aqi = {
        "delhi"    : 320,  # Severe — above threshold
        "mumbai"   : 150,  # Moderate — below threshold
        "pune"     : 95,   # Good — below threshold
        "hyderabad": 110,  # Moderate
        "chennai"  : 130,  # Moderate
        "bangalore": 85,   # Good
    }

    aqi_value = mock_aqi.get(city.lower(), 100)

    if aqi_value >= THRESHOLDS["aqi"]:
        return {
            "triggered"    : True,
            "trigger_type" : "aqi",
            "trigger_value": aqi_value,
            "threshold"    : THRESHOLDS["aqi"],
            "message"      : f"Severe AQI detected: {aqi_value} in {city}"
        }

    return {"triggered": False, "trigger_type": "aqi", "trigger_value": aqi_value}


# ─────────────────────────────────────────
# MAIN FUNCTION — Check All Triggers
# ─────────────────────────────────────────

def check_weather_trigger(pincode: str, city: str) -> dict:

    city_lower = city.lower()
    coords     = CITY_COORDS.get(city_lower, {"lat": 18.5204, "lon": 73.8567})
    lat        = coords["lat"]
    lon        = coords["lon"]

    # Check Rain first
    rain_result = check_rain_trigger(lat, lon)
    if rain_result["triggered"]:
        return rain_result

    # Check Heat
    heat_result = check_heat_trigger(lat, lon)
    if heat_result["triggered"]:
        return heat_result

    # Check AQI
    aqi_result = check_aqi_trigger(city)
    if aqi_result["triggered"]:
        return aqi_result

    # No trigger
    return {
        "triggered"    : False,
        "trigger_type" : None,
        "trigger_value": 0,
        "message"      : "No disruption detected in your zone",
        "rain_mm"      : rain_result["trigger_value"],
        "heat_c"       : heat_result["trigger_value"],
        "aqi"          : aqi_result["trigger_value"]
    }

