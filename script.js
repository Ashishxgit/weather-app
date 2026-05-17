
const API_KEY = "81725f5576969c80f311b80a9460e9fd";

const SAMPLE_DATA = {
  name: "New York",
  sys: { country: "US", sunrise: 1716019200, sunset: 1716069600 },
  weather: [{ main: "Clear", description: "clear sky" }],
  main: {
    temp: 24,
    feels_like: 23,
    humidity: 55,
    pressure: 1013,
    temp_min: 20,
    temp_max: 27,
  },
  wind: { speed: 5.2, deg: 220 },
  visibility: 10000,
};

// ── LOOKUP TABLES ──────────────────────────────────────
const weatherBgMap = {
  Clear:        "bg-clear",
  Clouds:       "bg-clouds",
  Rain:         "bg-rain",
  Drizzle:      "bg-drizzle",
  Thunderstorm: "bg-thunderstorm",
  Snow:         "bg-snow",
  Mist:         "bg-mist",
  Fog:          "bg-mist",
  Haze:         "bg-haze",
};

const weatherEmojiMap = {
  Clear:        "☀️",
  Clouds:       "☁️",
  Rain:         "🌧️",
  Drizzle:      "🌦️",
  Thunderstorm: "⛈️",
  Snow:         "❄️",
  Mist:         "🌫️",
  Fog:          "🌫️",
  Haze:         "🌫️",
};

const windDirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

// ── STATE ──────────────────────────────────────────────
let unit = "C";           // "C" or "F"
let currentData = null;   // raw API data (always in Celsius)

// ── DOM REFS ───────────────────────────────────────────
const body        = document.body;
const clockEl     = document.getElementById("clock");
const dateEl      = document.getElementById("date");
const unitBtn     = document.getElementById("unitBtn");
const cityInput   = document.getElementById("cityInput");
const searchBtn   = document.getElementById("searchBtn");
const errorBox    = document.getElementById("errorBox");

// weather display elements
const cityNameEl  = document.getElementById("cityName");
const countryEl   = document.getElementById("country");
const tempValueEl = document.getElementById("tempValue");
const tempUnitEl  = document.getElementById("tempUnit");
const emojiEl     = document.getElementById("weatherEmoji");
const descEl      = document.getElementById("description");
const feelsEl     = document.getElementById("feelsLike");
const humidityEl  = document.getElementById("humidity");
const windEl      = document.getElementById("wind");
const windDirEl   = document.getElementById("windDir");
const pressureEl  = document.getElementById("pressure");
const sunriseEl   = document.getElementById("sunrise");
const sunsetEl    = document.getElementById("sunset");
const visibilityEl= document.getElementById("visibility");

// ── HELPERS ────────────────────────────────────────────
function toF(c) {
  return Math.round((c * 9) / 5 + 32);
}

function formatTime(unixTimestamp) {
  return new Date(unixTimestamp * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getWindDir(deg) {
  return windDirs[Math.round(deg / 45) % 8];
}

function setBackground(mainWeather) {
  // Remove all bg classes
  const allBgs = Object.values(weatherBgMap).concat(["bg-default"]);
  body.classList.remove(...allBgs);
  // Add the correct one
  const bgClass = weatherBgMap[mainWeather] || "bg-default";
  body.classList.add(bgClass);
}

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.classList.add("visible");
}

function hideError() {
  errorBox.textContent = "";
  errorBox.classList.remove("visible");
}

// ── CLOCK ──────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  dateEl.textContent = now.toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

setInterval(updateClock, 1000);
updateClock(); // run immediately

// ── RENDER ─────────────────────────────────────────────
function renderWeather(data) {
  const mainWeather = data.weather[0].main;
  const tempC       = data.main.temp;
  const feelsC      = data.main.feels_like;
  const maxC        = data.main.temp_max;
  const minC        = data.main.temp_min;

  // Background
  setBackground(mainWeather);

  // Choose display values based on current unit
  const displayTemp   = unit === "C" ? Math.round(tempC)   : toF(tempC);
  const displayFeels  = unit === "C" ? Math.round(feelsC)  : toF(feelsC);
  const displayMax    = unit === "C" ? Math.round(maxC)    : toF(maxC);
  const displayMin    = unit === "C" ? Math.round(minC)    : toF(minC);

  // City & country
  cityNameEl.textContent  = data.name;
  countryEl.textContent   = data.sys.country;

  // Temperature
  tempValueEl.textContent = displayTemp;
  tempUnitEl.textContent  = `°${unit}`;

  // Emoji
  emojiEl.textContent = weatherEmojiMap[mainWeather] || "🌡️";

  // Description & feels like
  descEl.textContent  = data.weather[0].description;
  feelsEl.innerHTML   = `Feels like ${displayFeels}°${unit} &nbsp;·&nbsp; H: ${displayMax}° &nbsp; L: ${displayMin}°`;

  // Stats
  humidityEl.textContent  = `${data.main.humidity}%`;
  windEl.textContent      = `${data.wind.speed} m/s`;
  windDirEl.textContent   = getWindDir(data.wind.deg);
  pressureEl.textContent  = `${data.main.pressure} hPa`;
  sunriseEl.textContent   = formatTime(data.sys.sunrise);
  sunsetEl.textContent    = formatTime(data.sys.sunset);
  visibilityEl.textContent= `${(data.visibility / 1000).toFixed(1)} km`;
}

// ── FETCH WEATHER ──────────────────────────────────────
async function fetchWeather(city) {
  hideError();
  searchBtn.textContent = "...";
  searchBtn.disabled    = true;

  try {
    // Always fetch in metric (Celsius); we convert in JS
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    const res  = await fetch(url);

    if (!res.ok) {
      const msg = res.status === 404 ? "City not found 🔍" : "Something went wrong. Try again.";
      throw new Error(msg);
    }

    const data    = await res.json();
    currentData   = data;
    noticeBox.classList.add("hidden"); // hide sample-data notice
    renderWeather(data);

  } catch (err) {
    showError(err.message);
  } finally {
    searchBtn.textContent = "→";
    searchBtn.disabled    = false;
  }
}

// ── UNIT TOGGLE ────────────────────────────────────────
unitBtn.addEventListener("click", () => {
  unit = unit === "C" ? "F" : "C";
  unitBtn.textContent = unit === "C" ? "°F" : "°C"; // show what it will switch TO
  if (currentData) renderWeather(currentData);
});

// ── SEARCH ─────────────────────────────────────────────
searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (!city) return;
  if (API_KEY === "ENTER_YOUR_API_KEY_HERE") {
    showError("Please add your API key in script.js first.");
    return;
  }
  fetchWeather(city);
});

cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchBtn.click();
});

// ── INIT ───────────────────────────────────────────────
// Show sample data on first load
currentData = SAMPLE_DATA;
setBackground(SAMPLE_DATA.weather[0].main);
renderWeather(SAMPLE_DATA);
