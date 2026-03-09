import { ScanLine, TrendingUp, Newspaper, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";

const ACTIONS = [
  { icon: ScanLine, label: { en: "Scan Crop", hi: "फसल स्कैन", as: "শস্য স্কেন" }, to: "/scan", color: "bg-primary" },
  { icon: TrendingUp, label: { en: "Market Prices", hi: "मंडी भाव", as: "বজাৰ দাম" }, to: "/market", color: "bg-accent" },
  { icon: Newspaper, label: { en: "News", hi: "समाचार", as: "বাতৰি" }, to: "/news", color: "bg-secondary" },
  { icon: BookOpen, label: { en: "Tips", hi: "सुझाव", as: "পৰামৰ্শ" }, to: "/news?tab=tips", color: "bg-success" },
];

const STRINGS = {
  en: { title: "Quick Actions" },
  hi: { title: "त्वरित कार्य" },
  as: { title: "দ্ৰুত কাৰ্য" },
};

const QuickActions = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = STRINGS[language];

  return (
    <div>
      <h2 className="font-semibold text-foreground mb-3">{t.title}</h2>
      <div className="grid grid-cols-4 gap-3">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.to}
              onClick={() => navigate(action.to)}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center text-primary-foreground shadow-sm group-active:scale-95 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] text-foreground leading-tight text-center">
                {action.label[language]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
