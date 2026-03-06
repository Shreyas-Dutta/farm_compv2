import { ScanLine, TrendingUp, Newspaper, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

const actions = [
  { icon: ScanLine, label: "फसल स्कैन", labelEn: "Scan Crop", to: "/scan", color: "bg-primary" },
  { icon: TrendingUp, label: "मंडी भाव", labelEn: "Prices", to: "/market", color: "bg-accent" },
  { icon: Newspaper, label: "समाचार", labelEn: "News", to: "/news", color: "bg-secondary" },
  { icon: BookOpen, label: "सुझाव", labelEn: "Tips", to: "/news?tab=tips", color: "bg-success" },
];

const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <div>
      <h2 className="font-semibold text-foreground mb-3">
        <span className="font-hindi">त्वरित कार्य</span>
        <span className="text-muted-foreground text-sm ml-2">Quick Actions</span>
      </h2>
      <div className="grid grid-cols-4 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.labelEn}
              onClick={() => navigate(action.to)}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center text-primary-foreground shadow-sm group-active:scale-95 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-hindi text-foreground leading-tight text-center">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
