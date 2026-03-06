import { Home, Newspaper, ScanLine, TrendingUp, User } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: Home, label: "होम", labelEn: "Home" },
  { to: "/news", icon: Newspaper, label: "समाचार", labelEn: "News" },
  { to: "/scan", icon: ScanLine, label: "स्कैन", labelEn: "Scan", isCenter: true },
  { to: "/market", icon: TrendingUp, label: "मंडी", labelEn: "Market" },
  { to: "/profile", icon: User, label: "प्रोफ़ाइल", labelEn: "Profile" },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-bottom">
      <div className="flex items-end justify-around px-2 pt-1 pb-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex flex-col items-center -mt-5"
              >
                <div
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground scale-110"
                      : "bg-primary/90 text-primary-foreground"
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] mt-1 font-hindi font-medium text-foreground">
                  {item.label}
                </span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex flex-col items-center pt-2 min-w-[56px]"
            >
              <Icon
                className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-[10px] mt-1 font-hindi font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
