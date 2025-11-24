// src/App.js

import React, { useEffect, useState } from "react";

function App() {
  const [weather, setWeather] = useState(null); // backend response
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch once on mount
  useEffect(() => {
    fetchWeather();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError("");
      setWeather(null);

      const res = await fetch("http://localhost:5000/weather");

      if (!res.ok) {
        throw new Error(`Backend error: ${res.status}`);
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error + (data.details ? `: ${data.details}` : ""));
      }

      setWeather(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Decide card color:
  // - RED if raining now OR it will rain within the window
  // - GREEN only if dry now and no rain in the window
  const isRainingNow = weather?.raining_now;
  const hasFutureRain = Boolean(weather?.next_rain_time);
  const rainNowOrSoon = isRainingNow || hasFutureRain;

  const bgColor =
    weather == null
      ? "#444"
      : rainNowOrSoon
      ? "#b71c1c" 
      : "#1b5e20"; 

  let statusText = "No data yet";

  if (weather) {
    const windowLabel =
      weather.window_hours === 1
        ? "1 hour"
        : `${weather.window_hours} hours`;

    if (rainNowOrSoon) {
      if (isRainingNow) {
        statusText = `It's raining now in ${weather.location}`;
      } else {
        statusText = `Rain expected in the next ${windowLabel}`;
      }
    } else {
      statusText = `No rain expected in the next ${windowLabel}`;
    }
  }

  // Extra detail line explaining start/stop times
  let detailLine = "";
  if (weather) {
    if (isRainingNow) {
      if (weather.rain_stop_time) {
        detailLine = `🌤️ It should stop around ${weather.rain_stop_time}`;
      } else {
        detailLine = `🌧️ It looks like it will keep raining for at least the next ${weather.window_hours} hours.`;
      }
    } else {
      if (weather.next_rain_time) {
        detailLine = `🌧️ Rain is expected to start around ${weather.next_rain_time}.`;
      } else {
        detailLine = `🌤️ No rain expected in the next ${weather.window_hours} hours.`;
      }
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#111",
        color: "#fff",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          padding: "2rem",
          borderRadius: "1rem",
          backgroundColor: "#1e1e1e",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          width: "360px",
          textAlign: "center",
        }}
      >
        <h1 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>
          Bergen Rain Checker 🌧️
        </h1>

        {/* Refresh button */}
        <button
          onClick={fetchWeather}
          disabled={loading}
          style={{
            width: "100%",
            padding: "0.6rem",
            borderRadius: "0.6rem",
            border: "none",
            cursor: loading ? "wait" : "pointer",
            opacity: loading ? 0.7 : 1,
            fontWeight: 600,
            marginBottom: "1rem",
          }}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>

        {/* Error */}
        {error && (
          <p
            style={{
              color: "#ff8a80",
              marginBottom: "1rem",
              fontSize: "0.9rem",
            }}
          >
            {error}
          </p>
        )}

        {/* Result card */}
        <div
          style={{
            padding: "1.2rem",
            borderRadius: "0.9rem",
            backgroundColor: bgColor,
            transition: "background-color 0.3s ease",
          }}
        >
          <div style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 8 }}>
            {statusText}
          </div>

          {weather && (
            <>
              <div style={{ fontSize: "0.9rem" }}>
                {weather.location}
                {weather.country ? `, ${weather.country}` : ""}
              </div>
              <div style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                Current: {weather.temp_c}°C, {weather.condition}
              </div>
              {detailLine && (
                <div style={{ fontSize: "0.85rem" }}>{detailLine}</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
