import { Cloud, CloudRain, Sun, Wind, AlertTriangle, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const WeatherWidget = () => {
  // Mock weather data — will be replaced with real API
  const weather = {
    temp: 32,
    condition: "sunny",
    humidity: 65,
    wind: 12,
    location: "जयपुर, राजस्थान",
    alert: null as string | null,
  };

  const getWeatherIcon = () => {
    switch (weather.condition) {
      case "rainy": return <CloudRain className="w-10 h-10 text-primary-foreground" />;
      case "cloudy": return <Cloud className="w-10 h-10 text-primary-foreground" />;
      default: return <Sun className="w-10 h-10 text-primary-foreground" />;
    }
  };

  return (
    <Card className="bg-primary text-primary-foreground border-0 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-1 mb-2 opacity-90">
          <MapPin className="w-3 h-3" />
          <span className="text-xs font-hindi">{weather.location}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-4xl font-bold">{weather.temp}°C</div>
            <div className="text-sm opacity-90 font-hindi mt-1">धूप | Sunny</div>
          </div>
          {getWeatherIcon()}
        </div>
        <div className="flex gap-4 mt-3 text-xs opacity-80">
          <div className="flex items-center gap-1">
            <Cloud className="w-3 h-3" />
            <span>नमी {weather.humidity}%</span>
          </div>
          <div className="flex items-center gap-1">
            <Wind className="w-3 h-3" />
            <span>हवा {weather.wind} km/h</span>
          </div>
        </div>
        {weather.alert && (
          <div className="mt-3 bg-warning/20 rounded-md p-2 flex items-center gap-2 text-xs">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <span className="font-hindi">{weather.alert}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeatherWidget;
