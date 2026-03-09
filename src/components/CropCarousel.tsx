import { Card, CardContent } from "@/components/ui/card";
import { Sprout } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const crops = [
  { name: { en: "Wheat", hi: "गेहूं", as: "ঘেঁহু" }, emoji: "🌾", season: { en: "Rabi", hi: "रबी", as: "ৰবি" } },
  { name: { en: "Rice", hi: "चावल", as: "ধান" }, emoji: "🍚", season: { en: "Kharif", hi: "खरीफ", as: "খৰিফ" } },
  { name: { en: "Cotton", hi: "कपास", as: "কপাহ" }, emoji: "🧶", season: { en: "Kharif", hi: "खरीफ", as: "খৰিফ" } },
  { name: { en: "Sugarcane", hi: "गन्ना", as: "আখ" }, emoji: "🎋", season: { en: "Annual", hi: "वार्षिक", as: "বার্ষিক" } },
  { name: { en: "Mustard", hi: "सरसों", as: "সৰিয়হ" }, emoji: "🌻", season: { en: "Rabi", hi: "रबी", as: "ৰবি" } },
  { name: { en: "Maize", hi: "मक्का", as: "মাকৈ" }, emoji: "🌽", season: { en: "Kharif", hi: "खरीफ", as: "খৰিফ" } },
];

const STRINGS = {
  en: { title: "Major Crops" },
  hi: { title: "प्रमुख फसलें" },
  as: { title: "প্ৰধান শস্য" },
};

const CropCarousel = () => {
  const { language } = useLanguage();
  const t = STRINGS[language];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Sprout className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-foreground">{t.title}</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {crops.map((crop) => (
          <Card
            key={crop.name.en}
            className="min-w-[100px] border border-border hover:border-primary/40 transition-colors cursor-pointer"
          >
            <CardContent className="p-3 text-center">
              <div className="text-3xl mb-1">{crop.emoji}</div>
              <div className="text-sm font-semibold">{crop.name[language]}</div>
              <div className="text-[10px] text-primary mt-1">{crop.season[language]}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CropCarousel;
