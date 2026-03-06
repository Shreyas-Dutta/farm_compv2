import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Search, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const mockPrices = [
  { crop: "गेहूं", cropEn: "Wheat", price: 2275, change: 2.3, unit: "क्विंटल", mandi: "दिल्ली" },
  { crop: "चावल", cropEn: "Rice", price: 3850, change: -1.2, unit: "क्विंटल", mandi: "लखनऊ" },
  { crop: "कपास", cropEn: "Cotton", price: 6500, change: 5.1, unit: "क्विंटल", mandi: "अहमदाबाद" },
  { crop: "सरसों", cropEn: "Mustard", price: 5100, change: 0, unit: "क्विंटल", mandi: "जयपुर" },
  { crop: "गन्ना", cropEn: "Sugarcane", price: 350, change: 1.5, unit: "क्विंटल", mandi: "लखनऊ" },
  { crop: "मक्का", cropEn: "Maize", price: 2100, change: -0.8, unit: "क्विंटल", mandi: "इंदौर" },
  { crop: "चना", cropEn: "Gram", price: 5300, change: 3.2, unit: "क्विंटल", mandi: "जयपुर" },
  { crop: "सोयाबीन", cropEn: "Soybean", price: 4200, change: -2.1, unit: "क्विंटल", mandi: "इंदौर" },
];

const states = ["सभी राज्य", "राजस्थान", "उत्तर प्रदेश", "गुजरात", "मध्य प्रदेश", "दिल्ली"];

const Market = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState("सभी राज्य");

  const filteredPrices = mockPrices.filter(
    (p) =>
      p.crop.includes(search) ||
      p.cropEn.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-primary text-primary-foreground px-4 pt-10 pb-4">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="mb-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold font-hindi">मंडी भाव</h1>
          <p className="text-xs opacity-80">Live Crop Prices (India)</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-4">
        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="फसल खोजें / Search crop..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
          <Select value={selectedState} onValueChange={setSelectedState}>
            <SelectTrigger className="w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {states.map((s) => (
                <SelectItem key={s} value={s} className="text-xs font-hindi">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price Cards */}
        <div className="space-y-2">
          {filteredPrices.map((item) => (
            <Card key={item.cropEn} className="border border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold font-hindi">{item.crop}</h3>
                    <span className="text-xs text-muted-foreground">{item.cropEn}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-foreground">₹{item.price.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground font-hindi">प्रति {item.unit}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground font-hindi">📍 {item.mandi}</span>
                  <div className={`flex items-center gap-1 text-xs font-semibold ${
                    item.change > 0 ? "text-success" : item.change < 0 ? "text-destructive" : "text-muted-foreground"
                  }`}>
                    {item.change > 0 ? <TrendingUp className="w-3 h-3" /> : item.change < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    <span>{item.change > 0 ? "+" : ""}{item.change}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground font-hindi py-4">
          भाव प्रतिदिन अपडेट होते हैं<br />
          <span className="text-[10px]">Prices updated daily</span>
        </p>
      </div>
    </div>
  );
};

export default Market;
