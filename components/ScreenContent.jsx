import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";

const API_KEY = "bd5e378503939ddaee76f12ad7a97608"; // 🔑 OpenWeatherMap key

export default function ScreenContent() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("Kolkata");
  const [isCelsius, setIsCelsius] = useState(true);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState([]);

  useEffect(() => {
    fetchWeather(city, isCelsius ? "metric" : "imperial");
  }, []);

  async function fetchWeather(cityName, units = "metric") {
    try {
      setLoading(true);

      const currentRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
          cityName
        )}&units=${units}&appid=${API_KEY}`
      );
      const currentJson = await currentRes.json();
      if (currentJson.cod !== 200) {
        Alert.alert("No data", currentJson.message || "Could not find weather.");
        setLoading(false);
        return;
      }

      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
          cityName
        )}&units=${units}&appid=${API_KEY}`
      );
      const forecastJson = await forecastRes.json();

      setCity(currentJson.name);
      setCurrent({
        temp: Math.round(currentJson.main.temp),
        feels_like: Math.round(currentJson.main.feels_like),
        description: currentJson.weather[0].description,
        icon: `https://openweathermap.org/img/wn/${currentJson.weather[0].icon}@2x.png`,
        humidity: currentJson.main.humidity,
        wind_kmh: Math.round(currentJson.wind.speed * 3.6),
        sunrise: new Date(currentJson.sys.sunrise * 1000),
        sunset: new Date(currentJson.sys.sunset * 1000),
      });

      const daily = {};
      forecastJson.list.forEach((entry) => {
        const date = entry.dt_txt.split(" ")[0];
        if (!daily[date] || entry.dt_txt.includes("12:00:00")) {
          daily[date] = entry;
        }
      });

      setForecast(Object.values(daily).slice(1, 6));
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to fetch weather data.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    if (!query.trim()) return;
    fetchWeather(query.trim(), isCelsius ? "metric" : "imperial");
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

      const currentRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=${
          isCelsius ? "metric" : "imperial"
        }&appid=${API_KEY}`
      );
      const data = await currentRes.json();
      if (data && data.name) {
        fetchWeather(data.name, isCelsius ? "metric" : "imperial");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Unable to get location.");
    } finally {
      setLoading(false);
    }
  }

  function toggleUnits() {
    const newUnits = !isCelsius;
    setIsCelsius(newUnits);
    if (city) fetchWeather(city, newUnits ? "metric" : "imperial");
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
            <View className="flex-row items-center mt-4 space-x-3">
              <Image source={{ uri: current.icon }} className="w-20 h-20" />
              <View className="flex-row items-end">
                <Text className="text-6xl font-bold">{current.temp}</Text>
                <Text className="text-2xl text-slate-500">
                  {isCelsius ? "°C" : "°F"}
                </Text>
              </View>
            </View>
            <Text className="text-base text-slate-500 mt-1 italic">
              {current.description}
            </Text>
            <Text className="text-sm text-slate-400 mt-1">
              Feels like {current.feels_like}°{isCelsius ? "C" : "F"}
            </Text>

            <View className="flex-row justify-center space-x-8 mt-4 gap-6">
              <View className="items-center">
                <FontAwesome5 name="tint" size={16} color="#0ea5e9" />
                <Text className="text-sm text-slate-600 mt-1">{current.humidity}%</Text>
                <Text className="text-xs text-slate-400">Humidity</Text>
              </View>
              <View className="items-center">
                <FontAwesome5 name="wind" size={16} color="#0ea5e9" />
                <Text className="text-sm text-slate-600 mt-1">{current.wind_kmh} km/h</Text>
                <Text className="text-xs text-slate-400">Wind</Text>
              </View>
              <View className="items-center">
                <Ionicons name="sunny-outline" size={18} color="#facc15" />
                <Text className="text-xs text-slate-600 mt-1">
                  {current.sunrise.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
                <Text className="text-xs text-slate-400">Sunrise</Text>
              </View>
              <View className="items-center">
                <Ionicons name="moon-outline" size={18} color="#64748b" />
                <Text className="text-xs text-slate-600 mt-1">
                  {current.sunset.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
                <Text className="text-xs text-slate-400">Sunset</Text>
              </View>
            </View>
          </>
        ) : (
          <View className="items-center mt-6">
            <Ionicons name="cloud-outline" size={64} color="#94a3b8" />
            <Text className="text-sm text-slate-400 mt-2">No data yet</Text>
          </View>
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
                const date = new Date(d.dt_txt);
                const dayName = date.toLocaleDateString(undefined, { weekday: "short" });
                return (
                  <View key={idx} className="w-24 bg-white rounded-xl p-2 m-1 items-center shadow-sm">
                    <Text className="text-sm font-medium text-slate-600">{dayName}</Text>
                    <Image
                      source={{ uri: `https://openweathermap.org/img/wn/${d.weather[0].icon}@2x.png` }}
                      className="w-12 h-12 my-1"
                    />
                    <Text className="text-sm font-semibold">
                      {Math.round(d.main.temp_max)}° /
                      <Text className="text-slate-500"> {Math.round(d.main.temp_min)}°</Text>
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
