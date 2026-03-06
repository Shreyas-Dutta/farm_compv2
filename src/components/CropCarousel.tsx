import { Card, CardContent } from "@/components/ui/card";
import { Sprout } from "lucide-react";

const crops = [
  { name: "गेहूं", nameEn: "Wheat", emoji: "🌾", season: "रबी" },
  { name: "चावल", nameEn: "Rice", emoji: "🍚", season: "खरीफ" },
  { name: "कपास", nameEn: "Cotton", emoji: "🧶", season: "खरीफ" },
  { name: "गन्ना", nameEn: "Sugarcane", emoji: "🎋", season: "वार्षिक" },
  { name: "सरसों", nameEn: "Mustard", emoji: "🌻", season: "रबी" },
  { name: "मक्का", nameEn: "Maize", emoji: "🌽", season: "खरीफ" },
];

const CropCarousel = () => {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Sprout className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-foreground">
          <span className="font-hindi">प्रमुख फसलें</span>
          <span className="text-muted-foreground text-sm ml-2">Major Crops</span>
        </h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {crops.map((crop) => (
          <Card
            key={crop.nameEn}
            className="min-w-[100px] border border-border hover:border-primary/40 transition-colors cursor-pointer"
          >
            <CardContent className="p-3 text-center">
              <div className="text-3xl mb-1">{crop.emoji}</div>
              <div className="text-sm font-semibold font-hindi">{crop.name}</div>
              <div className="text-[10px] text-muted-foreground">{crop.nameEn}</div>
              <div className="text-[10px] text-primary mt-1 font-hindi">{crop.season}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CropCarousel;
