const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const statusMsg = document.getElementById("statusMsg");
const currentCard = document.getElementById("currentCard");
const cityNameEl = document.getElementById("cityName");
const tempEl = document.getElementById("temp");
const windEl = document.getElementById("wind");
const conditionEl = document.getElementById("condition");
const forecastBody = document.getElementById("forecastBody");


function describeWeatherCode(code) {
    if (code === 0) {
        return "Clear sky";
    } else if (code >= 1 && code <= 3) {
        return "Partly cloudy";
    } else if (code === 45 || code === 48) {
        return "Fog";
    } else if (code >= 51 && code <= 57) {
        return "Drizzle";
    } else if (code >= 61 && code <= 67) {
        return "Rain";
    } else if (code >= 71 && code <= 77) {
        return "Snow";
    } else if (code >= 80 && code <= 82) {
        return "Rain showers";
    } else if (code >= 95 && code <= 99) {
        return "Thunderstorm";
    }

    return "Unknown";
}


function setStatus(message, isError = false) {
    statusMsg.textContent = message;

    if (isError) {
        statusMsg.classList.add("error");
    } else {
        statusMsg.classList.remove("error");
    }
}

async function geocodeCity(city) {
    const url =
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;

    const res = await fetch(url);

    if (!res.ok) {
        throw new Error("Geocoding request failed");
    }

    const data = await res.json();

    if (!data.results || data.results.length === 0) {
        throw new Error("City not found — try another name.");
    }

    return data.results[0];
}

async function fetchForecast(lat, lon) {
    const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current_weather=true` +
        `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum` +
        `&timezone=auto`;

    const res = await fetch(url);

    if (!res.ok) {
        throw new Error("Forecast request failed");
    }

    return res.json();
}

function renderCurrentWeather(place, weatherData) {
    const current = weatherData.current_weather;

    cityNameEl.textContent = `${place.name}, ${place.country}`;
    tempEl.textContent = `${current.temperature} °C`;
    windEl.textContent = `${current.windspeed} km/h`;
    conditionEl.textContent = describeWeatherCode(current.weathercode);

    currentCard.classList.remove("hidden");
}

function renderForecastTable(daily) {
    forecastBody.innerHTML = "";

    for (let i = 0; i < daily.time.length; i++) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${daily.time[i]}</td>
            <td>${describeWeatherCode(daily.weathercode[i])}</td>
            <td>${daily.temperature_2m_max[i]} °C</td>
            <td>${daily.temperature_2m_min[i]} °C</td>
            <td>${daily.precipitation_sum[i]} mm</td>
        `;

        if (daily.precipitation_sum[i] > 0) {
            row.classList.add("rainy");
        }

        forecastBody.appendChild(row);
    }
}


async function handleSearch() {
    const city = cityInput.value.trim();

    if (city === "") {
        setStatus("Please type a city name.", true);
        return;
    }

    currentCard.classList.add("hidden");
    forecastBody.innerHTML = "";

    setStatus("Loading…");

    try {
        const place = await geocodeCity(city);

        const weatherData = await fetchForecast(
            place.latitude,
            place.longitude
        );

        renderCurrentWeather(place, weatherData);
        renderForecastTable(weatherData.daily);

        setStatus("");
    } catch (error) {
        setStatus(error.message, true);
    }
}

searchBtn.addEventListener("click", handleSearch);

cityInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        handleSearch();
    }
});
