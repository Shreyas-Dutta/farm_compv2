import WeatherWidget from "@/components/WeatherWidget";
import CropCarousel from "@/components/CropCarousel";
import QuickActions from "@/components/QuickActions";
import { Button } from "@/components/ui/button";
import { ScanLine, Leaf } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 pt-10 pb-6 rounded-b-3xl">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <Leaf className="w-6 h-6" />
            <h1 className="text-xl font-bold">किसान साथी</h1>
          </div>
          <p className="text-xs opacity-80">KisanSathi — Your Smart Farming Companion</p>

          <div className="mt-5">
            <Button
              onClick={() => navigate("/scan")}
              size="lg"
              className="w-full bg-card text-primary hover:bg-card/90 font-semibold rounded-xl shadow-lg"
            >
              <ScanLine className="w-5 h-5 mr-2" />
              <span className="font-hindi">फसल स्वास्थ्य जांचें</span>
              <span className="text-xs ml-2 opacity-70">Detect Health</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 space-y-6 mt-5">
        <WeatherWidget />
        <QuickActions />
        <CropCarousel />

        {/* Tip of the Day */}
        <div className="bg-secondary rounded-xl p-4">
          <h3 className="text-sm font-semibold text-secondary-foreground font-hindi mb-1">
            💡 आज का सुझाव
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            गेहूं की बुवाई के समय मिट्टी की नमी 50-60% होनी चाहिए। सही समय पर सिंचाई से उपज 20% तक बढ़ सकती है।
          </p>
          <p className="text-[10px] text-muted-foreground mt-1 italic">
            Wheat sowing requires 50-60% soil moisture. Timely irrigation can boost yield by 20%.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
