import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";

export default function ScreenContent() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("Kolkata");
  const [isCelsius, setIsCelsius] = useState(true);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState([]);

  useEffect(() => {
    fetchWeather(city);
  }, []);

  // Map Open-Meteo weather codes to emoji
  function getWeatherIcon(code) {
    switch (code) {
      case 0:
        return "☀️"; // Clear
      case 1:
      case 2:
        return "⛅"; // Partly cloudy
      case 3:
        return "☁️"; // Overcast
      case 61:
      case 63:
      case 65:
        return "🌧️"; // Rain
      case 71:
      case 73:
      case 75:
        return "❄️"; // Snow
      default:
        return "🌤️"; // Other
    }
  }

  async function fetchWeather(cityName) {
    try {
      setLoading(true);

      // 1️⃣ Geocoding: Get latitude & longitude
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          cityName
        )}`
      );
      const geoJson = await geoRes.json();

      if (!geoJson.results || geoJson.results.length === 0) {
        Alert.alert("No data", "City not found");
        setLoading(false);
        return;
      }

      const { latitude, longitude, name } = geoJson.results[0];

      // 2️⃣ Fetch weather
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&current_weather=true&timezone=auto`
      );
      const weatherJson = await weatherRes.json();

      setCity(name);

      // Current weather
      setCurrent({
        temp: Math.round(weatherJson.current_weather.temperature),
        wind_kmh: Math.round(weatherJson.current_weather.windspeed),
        weathercode: weatherJson.current_weather.weathercode,
      });

      // 5-day forecast
      const forecastData = weatherJson.daily.temperature_2m_max.map((maxTemp, i) => ({
        temp_max: maxTemp,
        temp_min: weatherJson.daily.temperature_2m_min[i],
        weathercode: weatherJson.daily.weathercode[i],
        dt: weatherJson.daily.time[i],
      }));
      setForecast(forecastData.slice(0, 5));
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to fetch weather data.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    if (!query.trim()) return;
    fetchWeather(query.trim());
    setQuery("");
  }

  async function handleLocation() {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Location denied", "Permission denied.");
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;

      // Reverse geocoding: get nearest city
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}`
      );
      const geoJson = await geoRes.json();
      if (geoJson.results && geoJson.results[0]?.name) {
        fetchWeather(geoJson.results[0].name);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Unable to get location.");
    } finally {
      setLoading(false);
    }
  }

  function toggleUnits() {
    // Open-Meteo provides Celsius by default, convert manually if needed
    setIsCelsius(!isCelsius);
    if (current && city) {
      fetchWeather(city);
    }
  }

  function convertTemp(temp) {
    return isCelsius ? temp : Math.round(temp * 1.8 + 32);
  }

  return (
    <View className="flex-1 bg-sky-50 p-4 mt-8">
      {/* Search Bar */}
      <View className="bg-white rounded-full px-4 py-2 shadow-md flex-row items-center mb-4">
        <Ionicons name="search" size={18} color="#64748b" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search city..."
          placeholderTextColor="#94a3b8"
          className="flex-1 text-base ml-2"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity
          onPress={handleLocation}
          className="ml-2 w-9 h-9 rounded-full bg-slate-100 items-center justify-center"
        >
          <Ionicons name="locate" size={18} color="#0f172a" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={toggleUnits}
          className="ml-2 px-3 py-1 rounded-full bg-sky-500"
        >
          <Text className="text-xs font-semibold text-white">
            {isCelsius ? "°C" : "°F"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Current Weather Card */}
      <View className="bg-white rounded-2xl p-6 shadow-md items-center">
        <Text className="text-2xl font-semibold text-slate-700">{city}</Text>
        {current ? (
          <>
            <Text className="text-6xl my-2">{getWeatherIcon(current.weathercode)}</Text>
            <Text className="text-6xl font-bold">
              {convertTemp(current.temp)}
              <Text className="text-2xl text-slate-500">{isCelsius ? "°C" : "°F"}</Text>
            </Text>
            <View className="flex-row justify-center space-x-8 mt-4 gap-6">
              <View className="items-center">
                <FontAwesome5 name="wind" size={16} color="#0ea5e9" />
                <Text className="text-sm text-slate-600 mt-1">{current.wind_kmh} km/h</Text>
                <Text className="text-xs text-slate-400">Wind</Text>
              </View>
            </View>
          </>
        ) : (
          <Text className="text-sm text-slate-400 mt-4">No data yet</Text>
        )}
      </View>

      {/* Forecast */}
      <View className="mt-6">
        <Text className="text-lg font-semibold text-slate-700 mb-3">
          5-Day Forecast
        </Text>

        {loading ? (
          <ActivityIndicator size="small" />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="space-x-3">
            {forecast.length > 0 ? (
              forecast.map((d, idx) => {
                const date = new Date(d.dt);
                const dayName = date.toLocaleDateString(undefined, { weekday: "short" });
                return (
                  <View
                    key={idx}
                    className="w-24 bg-white rounded-xl p-2 m-1 items-center shadow-sm"
                  >
                    <Text className="text-sm font-medium text-slate-600">{dayName}</Text>
                    <Text className="text-2xl my-1">{getWeatherIcon(d.weathercode)}</Text>
                    <Text className="text-sm font-semibold">
                      {convertTemp(d.temp_max)}° /
                      <Text className="text-slate-500"> {convertTemp(d.temp_min)}°</Text>
                    </Text>
                  </View>
                );
              })
            ) : (
              <Text className="text-sm text-slate-400">No forecast available</Text>
            )}
          </ScrollView>
        )}
      </View>

      {loading && (
        <View className="absolute inset-0 bg-white/60 items-center justify-center rounded-2xl">
          <ActivityIndicator size="large" />
        </View>
      )}
    </View>
  );
}
