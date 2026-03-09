import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Leaf, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage, type SupportedLanguage } from "@/hooks/useLanguage";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

const PROFILE_STORAGE_KEY = "farm-companion-profile";

const Login = () => {
  const { user, loading, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();

  const state = (location.state as LocationState) || {};
  const from = state.from?.pathname || "/";

  const STRINGS: Record<SupportedLanguage, {
    welcome: string;
    subtitle: string;
    loginWith: string;
    benefits: string[];
    benefitsTitle: string;
    privacyText: string;
    loggingIn: string;
  }> = {
    en: {
      welcome: "Welcome to Farm Companion",
      subtitle: "Sign in securely with your Google (Gmail) account.",
      loginWith: "Sign in with Google (Gmail)",
      benefitsTitle: "By signing in, you can securely view your",
      benefits: ["crops, scan history", "and personal recommendations"],
      privacyText: "By signing in, you agree to our Privacy Policy and Terms of Service.",
      loggingIn: "Signing in...",
    },
    hi: {
      welcome: "खेती साथी में आपका स्वागत है",
      subtitle: "सुरक्षित रूप से अपने Google (Gmail) खाते से लॉगिन करें।",
      loginWith: "Google (Gmail) से लॉगिन करें",
      benefitsTitle: "लॉगिन करने से आप अपनी",
      benefits: ["फसलें, स्कैन इतिहास", "और व्यक्तिगत सुझाव सुरक्षित रूप से देख सकेंगे।"],
      privacyText: "लॉगिन करते समय आप हमारी गोपनीयता नीति और सेवा की शर्तों से सहमत होते हैं।",
      loggingIn: "लॉगिन हो रहा है...",
    },
    as: {
      welcome: "খেতি সঙ্গীত আপোনাক স্বাগতম",
      subtitle: "সুৰক্ষিতভাৱে আপোনাৰ Google (Gmail) একাউণ্টৰে লগিন কৰক।",
      loginWith: "Google (Gmail) ৰে লগিন কৰক",
      benefitsTitle: "লগিন কৰি আপুনি সুৰক্ষিতভাৱে দেখিব পাৰিব",
      benefits: ["আপোনাৰ শস্য, স্কেন ইতিহাস", "আৰু ব্যক্তিগত পৰামৰ্শ"],
      privacyText: "লগিন কৰোতে আপুনি আমাৰ গোপনীয়তা নীতি আৰু সেৱাৰ চৰ্তবোৰৰ সৈতে সহমত হয়।",
      loggingIn: "লগিন হৈ আছে...",
    },
  };

  const t = STRINGS[language];

  const hasCompleteProfile = (raw: string | null): boolean => {
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw) as {
        name?: string;
        age?: string;
        sex?: string;
        language?: string;
      };
      return Boolean(parsed.name && parsed.age && parsed.sex && parsed.language);
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (!hasCompleteProfile(savedProfile)) {
        // Clear any old or partial profile so user is always asked again
        localStorage.removeItem(PROFILE_STORAGE_KEY);
        navigate("/profile-setup", { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [user, from, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-background px-6">
      <div className="max-w-sm w-full space-y-8">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg">
            <Leaf className="h-8 w-8 text-emerald-50" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight font-hindi text-emerald-900">
              {t.welcome}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t.subtitle}
            </p>
          </div>
        </div>

        <div className="bg-background/80 backdrop-blur border border-emerald-100 rounded-2xl shadow-sm p-6 space-y-6">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-hindi">
              {t.benefitsTitle}{" "}
              <span className="font-semibold text-foreground">{t.benefits[0]}</span> {t.benefits[1]}
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>{language === "en" ? "Your email and profile will be used only for account identification." : language === "hi" ? "आपका ईमेल और प्रोफ़ाइल केवल आपके खाते की पहचान के लिए उपयोग होगा।" : "আপোনাৰ ইমেইল আৰু প্ৰ'ফাইল কেৱল একাউণ্ট চিনাক্তকৰণৰ বাবে ব্যৱহাৰ কৰা হ'ব।"}</li>
              <li>{language === "en" ? "Your data will be securely stored with Firebase." : language === "hi" ? "आपका डेटा Firebase के साथ सुरक्षित रूप से संग्रहित किया जाएगा।" : "আপোনাৰ ডাটা Firebase ৰ সৈতে সুৰক্ষিতভাৱে সংৰক্ষণ কৰা হ'ব।"}</li>
            </ul>
          </div>

          <Button
            type="button"
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={loginWithGoogle}
            disabled={loading}
          >
            <LogIn className="h-4 w-4" />
            {loading ? t.loggingIn : t.loginWith}
          </Button>

          <p className="text-[11px] text-center text-muted-foreground">
            {t.privacyText}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

