import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Star, Lightbulb, CalendarDays, ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

const monthlyHighlights = [
  { title: "रबी सीजन 2026: गेहूं की नई किस्में", titleEn: "Rabi 2026: New wheat varieties", date: "मार्च 2026", image: "🌾" },
  { title: "सरसों के भाव में तेजी का अनुमान", titleEn: "Mustard prices expected to rise", date: "मार्च 2026", image: "📈" },
  { title: "जैविक खेती पर सरकारी सब्सिडी बढ़ी", titleEn: "Govt subsidy increased for organic farming", date: "फ़रवरी 2026", image: "🌿" },
];

const successStories = [
  { name: "रामलाल जी, जयपुर", story: "ड्रिप सिंचाई अपनाकर पानी की 40% बचत और उपज में 30% वृद्धि", storyEn: "Saved 40% water and increased yield by 30% with drip irrigation", emoji: "👨‍🌾" },
  { name: "सुनीता देवी, लखनऊ", story: "मशरूम की खेती से सालाना आय ₹5 लाख तक पहुंची", storyEn: "Mushroom farming earned ₹5 lakh annual income", emoji: "👩‍🌾" },
];

const tips = [
  { tip: "फसल चक्र अपनाएं — मिट्टी की उर्वरता बनी रहेगी", tipEn: "Practice crop rotation to maintain soil fertility", icon: "🔄" },
  { tip: "नीम का तेल कीटनाशक के रूप में प्रभावी है", tipEn: "Neem oil is effective as a natural pesticide", icon: "🌿" },
  { tip: "बीजों को बोने से पहले 12 घंटे भिगोएं", tipEn: "Soak seeds for 12 hours before sowing", icon: "💧" },
];

const events = [
  { name: "कृषि मेला 2026", nameEn: "Krishi Mela 2026", date: "15-17 मार्च", location: "नई दिल्ली", emoji: "🎪" },
  { name: "जैविक खेती प्रशिक्षण", nameEn: "Organic Farming Training", date: "22 मार्च", location: "जयपुर", emoji: "📚" },
  { name: "बीज वितरण कार्यक्रम", nameEn: "Seed Distribution Program", date: "1 अप्रैल", location: "लखनऊ", emoji: "🌱" },
];

const News = () => {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "highlights";
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-primary text-primary-foreground px-4 pt-10 pb-4">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="mb-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold font-hindi">कृषि समाचार</h1>
          <p className="text-xs opacity-80">Agriculture News & Updates</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 mt-4">
        <Tabs defaultValue={defaultTab}>
          <TabsList className="w-full grid grid-cols-4 bg-muted">
            <TabsTrigger value="highlights" className="text-xs font-hindi">मासिक</TabsTrigger>
            <TabsTrigger value="stories" className="text-xs font-hindi">सफलता</TabsTrigger>
            <TabsTrigger value="tips" className="text-xs font-hindi">सुझाव</TabsTrigger>
            <TabsTrigger value="events" className="text-xs font-hindi">कार्यक्रम</TabsTrigger>
          </TabsList>

          <TabsContent value="highlights" className="space-y-3 mt-4">
            {monthlyHighlights.map((item, i) => (
              <Card key={i} className="border border-border">
                <CardContent className="p-4 flex items-start gap-3">
                  <span className="text-3xl">{item.image}</span>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold font-hindi">{item.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{item.titleEn}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span className="font-hindi">{item.date}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="stories" className="space-y-3 mt-4">
            {successStories.map((item, i) => (
              <Card key={i} className="border border-border bg-secondary/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{item.emoji}</span>
                    <span className="text-sm font-semibold font-hindi">{item.name}</span>
                  </div>
                  <p className="text-sm font-hindi text-foreground">{item.story}</p>
                  <p className="text-xs text-muted-foreground mt-1 italic">{item.storyEn}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="tips" className="space-y-3 mt-4">
            {tips.map((item, i) => (
              <Card key={i} className="border border-border">
                <CardContent className="p-4 flex items-start gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-hindi text-foreground">{item.tip}</p>
                    <p className="text-xs text-muted-foreground mt-1 italic">{item.tipEn}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="events" className="space-y-3 mt-4">
            {events.map((item, i) => (
              <Card key={i} className="border border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{item.emoji}</span>
                    <h3 className="text-sm font-semibold font-hindi">{item.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.nameEn}</p>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="font-hindi">📅 {item.date}</span>
                    <span className="font-hindi">📍 {item.location}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default News;
