# app.py
# --------------------------------------
# Flask backend that:
# - Always checks weather for Bergen, Norway
# - Uses WeatherAPI forecast.json
# - Answers:
#     * What is the current weather?
#     * Is it raining now?
#     * If not raining: when will it start raining?
#     * If raining now: when will it stop?
# - Looks ahead a fixed time window (e.g. 24 hours)

from flask import Flask, jsonify
from flask_cors import CORS
import requests
import os

app = Flask(__name__)
CORS(app)

API_KEY = "044c2a14177a4bb0b01110212253009"

BASE_URL = "https://api.weatherapi.com/v1/forecast.json"

# How many hours into the future we look
WINDOW_HOURS = 24


def is_rain_hour(hour_obj):
    """Return True if this forecast hour counts as 'rainy'."""
    condition_text = hour_obj.get("condition", {}).get("text", "") or ""
    chance = int(hour_obj.get("chance_of_rain", 0) or 0)
    will_it_rain = hour_obj.get("will_it_rain") == 1
    has_rain_word = "rain" in condition_text.lower()

    return will_it_rain or chance > 0 or has_rain_word


@app.route("/weather")
def get_weather():
    location_query = "Bergen"

    params = {
        "key": API_KEY,
        "q": location_query,
        "days": 2,       
        "aqi": "no",
        "alerts": "no",
    }

    try:
        resp = requests.get(BASE_URL, params=params, timeout=10)
    except requests.RequestException as e:
        return jsonify({
            "error": "Network error talking to WeatherAPI",
            "details": str(e),
        }), 502

    if resp.status_code != 200:
        return jsonify({
            "error": "WeatherAPI HTTP error",
            "status_code": resp.status_code,
            "body": resp.text,
        }), 500

    data = resp.json()

    if "error" in data:
        return jsonify({
            "error": "WeatherAPI returned an error",
            "details": data["error"].get("message", ""),
        }), 400

    # 2) Extract location + current weather
    location_info = data.get("location", {})
    current = data.get("current", {})
    forecast_days = data.get("forecast", {}).get("forecastday", [])

    now_epoch = location_info.get("localtime_epoch") or current.get("last_updated_epoch", 0)
    end_epoch = now_epoch + WINDOW_HOURS * 3600

    current_condition_text = current.get("condition", {}).get("text", "Unknown")
    temp_c = current.get("temp_c")
    raining_now = "rain" in current_condition_text.lower()

    #Build a flat list of hourly forecasts in the next WINDOW_HOURS
    hourly = []
    for day in forecast_days:
        for hour in day.get("hour", []):
            t = hour.get("time_epoch")
            if t is None:
                continue
            if now_epoch <= t <= end_epoch:
                hourly.append(hour)


    hourly.sort(key=lambda h: h.get("time_epoch", 0))

    #Find next rain start & stop times
    next_rain_time = None  
    rain_stop_time = None  

    if not raining_now:
        # Find first future hour that is rainy
        for h in hourly:
            if is_rain_hour(h):
                next_rain_time = h.get("time")  
                break
    else:
        # Currently raining: find first future hour that is NOT rainy
        for h in hourly:
            if not is_rain_hour(h):
                rain_stop_time = h.get("time")
                break

    # Build response for frontend
    return jsonify({
        "location": location_info.get("name", "Bergen"),
        "country": location_info.get("country"),
        "temp_c": temp_c,
        "condition": current_condition_text,
        "raining_now": raining_now,
        "next_rain_time": next_rain_time,  
        "rain_stop_time": rain_stop_time,  
        "window_hours": WINDOW_HOURS,
    })


if __name__ == "__main__":
    app.run(debug=True)
