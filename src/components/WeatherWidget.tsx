import { Cloud, CloudRain, Sun, Wind, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { getWeatherData, type WeatherData } from "@/lib/api";
import { useLanguage } from "@/hooks/useLanguage";

interface WeatherWidgetProps {
  userLocation?: string;
  userCoordinates?: {
    lat: number;
    lng: number;
  };
  onWeatherLoaded?: (weather: WeatherData) => void | Promise<void>;
}

const WeatherWidget = ({ userLocation, userCoordinates, onWeatherLoaded }: WeatherWidgetProps) => {
  const { language } = useLanguage();
  const STRINGS = {
    en: {
      detectingLocation: "Detecting location...",
      humidity: "Humidity",
      wind: "Wind",
      conditions: {
        sunny: "Sunny",
        cloudy: "Cloudy",
        rainy: "Rainy",
        default: "Weather",
      },
    },
    hi: {
      detectingLocation: "स्थान का पता लगाया जा रहा है...",
      humidity: "नमी",
      wind: "हवा",
      conditions: {
        sunny: "धूप",
        cloudy: "बादल",
        rainy: "बारिश",
        default: "मौसम",
      },
    },
    as: {
      detectingLocation: "স্থান চিনাক্ত কৰা হৈছে...",
      humidity: "আর্দ্ৰতা",
      wind: "বতাহ",
      conditions: {
        sunny: "ৰ'দ",
        cloudy: "ডাৱৰীয়া",
        rainy: "বৰষুণ",
        default: "বতৰ",
      },
    },
  };
  const t = STRINGS[language];
  const [weather, setWeather] = useState<WeatherData>({
    temp: 32,
    condition: "sunny",
    humidity: 65,
    wind: 12,
    location: userLocation || t.detectingLocation,
    alert: null,
    dailyForecast: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLocation) {
      setWeather((prev) => ({ ...prev, location: t.detectingLocation }));
    }
  }, [userLocation, t.detectingLocation]);

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);

      try {
        const weatherData = await getWeatherData({
          location: userLocation,
          coordinates: userCoordinates,
          includeDailyForecast: true,
          languageCode: language,
        });
        setWeather(weatherData);
        void onWeatherLoaded?.(weatherData);
      } finally {
        setLoading(false);
      }
    };

    if (userLocation || userCoordinates) {
      void fetchWeather();
    } else {
      setLoading(false);
    }
  }, [language, onWeatherLoaded, userLocation, userCoordinates]);

  const getWeatherIcon = () => {
    switch (weather.condition) {
      case "rainy": return <CloudRain className="w-10 h-10 text-primary-foreground" />;
      case "cloudy": return <Cloud className="w-10 h-10 text-primary-foreground" />;
      default: return <Sun className="w-10 h-10 text-primary-foreground" />;
    }
  };

  const conditionLabel = t.conditions[weather.condition as keyof typeof t.conditions] ?? t.conditions.default;

  if (loading) {
    return (
      <Card className="bg-primary text-primary-foreground border-0 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-foreground"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-primary text-primary-foreground border-0 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-1 mb-2 opacity-90">
          <MapPin className="w-3 h-3" />
          <span className="text-xs">{weather.location}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-4xl font-bold">{weather.temp}°C</div>
            <div className="text-sm opacity-90 mt-1">{conditionLabel}</div>
          </div>
          {getWeatherIcon()}
        </div>
        <div className="flex gap-4 mt-3 text-xs opacity-80">
          <div className="flex items-center gap-1">
            <Cloud className="w-3 h-3" />
            <span>{t.humidity} {weather.humidity}%</span>
          </div>
          <div className="flex items-center gap-1">
            <Wind className="w-3 h-3" />
            <span>{t.wind} {weather.wind} km/h</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherWidget;
