import { useEffect, useState } from "react";
import { Cloud, CloudRain, Sun, Wind, Droplets, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage, type SupportedLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { getWeatherData, hasValidCoordinates, type WeatherCondition, type WeatherData } from "@/lib/api";
import { getUserProfile } from "@/lib/database";

type StoredCoordinates = {
  lat: number;
  lng: number;
};

const STRINGS: Record<SupportedLanguage, {
  title: string;
  loading: string;
  detectingLocation: string;
  conditions: {
    sunny: string;
    cloudy: string;
    rainy: string;
    default: string;
  };
  wind: string;
  humidity: string;
  dailyForecast: string;
  dailyUnavailable: string;
  rainChance: string;
}> = {
  en: {
    title: "Weather",
    loading: "Loading weather...",
    detectingLocation: "Detecting location...",
    conditions: {
      sunny: "Sunny",
      cloudy: "Cloudy",
      rainy: "Rainy",
      default: "Weather",
    },
    wind: "Wind",
    humidity: "Humidity",
    dailyForecast: "5-Day Forecast",
    dailyUnavailable: "Daily forecast unavailable.",
    rainChance: "Rain chance",
  },
  hi: {
    title: "मौसम",
    loading: "मौसम लोड हो रहा है...",
    detectingLocation: "स्थान का पता लगाया जा रहा है...",
    conditions: {
      sunny: "धूप",
      cloudy: "बादल",
      rainy: "बारिश",
      default: "मौसम",
    },
    wind: "हवा",
    humidity: "नमी",
    dailyForecast: "5-दिन का पूर्वानुमान",
    dailyUnavailable: "दैनिक पूर्वानुमान उपलब्ध नहीं है।",
    rainChance: "बारिश की संभावना",
  },
  as: {
    title: "বতৰ",
    loading: "বতৰ লোড হৈ আছে...",
    detectingLocation: "স্থান চিনাক্ত কৰা হৈছে...",
    conditions: {
      sunny: "ৰ'দ",
      cloudy: "ডাৱৰীয়া",
      rainy: "বৰষুণ",
      default: "বতৰ",
    },
    wind: "বতাহ",
    humidity: "আৰ্দ্ৰতা",
    dailyForecast: "৫ দিনৰ পূৰ্বাভাস",
    dailyUnavailable: "দৈনিক পূৰ্বাভাস উপলব্ধ নহয়।",
    rainChance: "বৰষুণৰ সম্ভাৱনা",
  },
};

const LOCALE_BY_LANGUAGE: Record<SupportedLanguage, string> = {
  en: "en-IN",
  hi: "hi-IN",
  as: "as-IN",
};

const Weather = () => {
  const STORAGE_KEY = "farm-companion-profile";
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = STRINGS[language];
  const [weather, setWeather] = useState<WeatherData>({
    temp: 28,
    condition: "sunny",
    humidity: 60,
    wind: 10,
    location: t.detectingLocation,
    alert: null as string | null,
    dailyForecast: [],
  });
  const [userLocation, setUserLocation] = useState<string | undefined>(undefined);
  const [userCoordinates, setUserCoordinates] = useState<StoredCoordinates | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const profile = await getUserProfile(user.uid);
        if (profile?.location || hasValidCoordinates(profile?.coordinates)) {
          setUserLocation(profile?.location);
          setUserCoordinates(hasValidCoordinates(profile?.coordinates) ? profile.coordinates : undefined);
          return;
        }
      } catch (error) {
        console.error("Error fetching weather profile:", error);
      }

      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as { location?: string; coordinates?: StoredCoordinates };
          setUserLocation(parsed.location);
          setUserCoordinates(hasValidCoordinates(parsed.coordinates) ? parsed.coordinates : undefined);
          return;
        }
      } catch {
        // ignore localStorage errors
      }

      setLoading(false);
    };

    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      const weatherData = await getWeatherData({
        location: userLocation,
        coordinates: userCoordinates,
        includeDailyForecast: true,
        languageCode: language,
      });
      setWeather(weatherData);
      setLoading(false);
    };

    if (userLocation || userCoordinates) {
      fetchWeather();
    } else {
      setWeather((prev) => ({ ...prev, location: t.detectingLocation }));
      setLoading(false);
    }
  }, [language, userCoordinates, userLocation, t.detectingLocation]);

  const renderWeatherIcon = (condition: WeatherCondition, className: string) => {
    const iconClassName = `${className} ${condition === "sunny" ? "text-yellow-500" : "text-blue-500"}`;

    switch (condition) {
      case "rainy":
        return <CloudRain className={iconClassName} />;
      case "cloudy":
        return <Cloud className={iconClassName} />;
      default:
        return <Sun className={iconClassName} />;
    }
  };

  const formatForecastDate = (date: string) => {
    const parsed = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return new Intl.DateTimeFormat(LOCALE_BY_LANGUAGE[language], {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(parsed);
  };

  const conditionLabel = t.conditions[weather.condition as keyof typeof t.conditions] ?? t.conditions.default;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 pb-24 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">{t.loading}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {renderWeatherIcon(weather.condition, "w-8 h-8")}
              <div>
                <h2 className="text-lg font-semibold">{t.title}</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {weather.location}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold">{weather.temp}°C</span>
            </div>
          </div>

          <div className="flex items-center justify-around text-center">
            <div className="text-center">
              {renderWeatherIcon(weather.condition, "w-6 h-6 mx-auto")}
              <p className="text-xs text-muted-foreground mt-1">{conditionLabel}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1">
                <Wind className="w-4 h-4 text-blue-500" />
                <span className="text-sm">{weather.wind} km/h</span>
              </div>
              <p className="text-xs text-muted-foreground">{t.wind}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1">
                <Droplets className="w-4 h-4 text-blue-500" />
                <span className="text-sm">{weather.humidity}%</span>
              </div>
              <p className="text-xs text-muted-foreground">{t.humidity}</p>
            </div>
          </div>

          {weather.alert && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
              <p className="text-sm text-yellow-800">⚠️ {weather.alert}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-4">
        <h3 className="text-sm font-semibold mb-2">{t.dailyForecast}</h3>

        {weather.dailyForecast.length > 0 ? (
          <div className="grid gap-3">
            {weather.dailyForecast.map((forecast) => (
              <Card key={forecast.date}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium">{formatForecastDate(forecast.date)}</p>
                    <p className="text-sm text-muted-foreground truncate">{forecast.conditionText}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {renderWeatherIcon(forecast.condition, "w-5 h-5")}
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {forecast.high}° / {forecast.low}°
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t.rainChance}: {forecast.precipitationChance ?? 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">{t.dailyUnavailable}</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Weather;
