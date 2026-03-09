import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Leaf, MapPin, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { updateUserProfile, getUserProfile } from "@/lib/database";
import type { SupportedLanguage } from "@/hooks/useLanguage";

type LocalProfile = {
  name: string;
  age: string;
  sex: string;
  language: string;
  location?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
};

const STORAGE_KEY = "farm-companion-profile";

const ProfileSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();

  const [form, setForm] = useState<LocalProfile>({
    name: "",
    age: "",
    sex: "",
    language: language || "hi",
    location: "",
    coordinates: { lat: 0, lng: 0 }
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  useEffect(() => {
    // Check if user is editing existing profile
    const checkExistingProfile = async () => {
      if (user?.uid) {
        try {
          const existingProfile = await getUserProfile(user.uid);
          
          if (existingProfile) {
            // Pre-fill form with existing data
            setForm({
              name: existingProfile.name || "",
              age: existingProfile.age || "",
              sex: existingProfile.sex || "",
              language: existingProfile.language || language || "hi",
              location: existingProfile.location || "",
              coordinates: existingProfile.coordinates || { lat: 0, lng: 0 }
            });
            setIsEditing(true);
          }
        } catch (error) {
          console.error('Error checking existing profile:', error);
        }
      }
    };

    checkExistingProfile();
  }, [user, language]);

  // Auto-detect user location
  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsDetectingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Get address from coordinates using reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          
          if (response.ok) {
            const data = await response.json();
            const address = data.display_name || `${latitude}, ${longitude}`;
            
            setForm(prev => ({
              ...prev,
              location: address,
              coordinates: { lat: latitude, lng: longitude }
            }));
          }
        } catch (error) {
          console.error('Error getting address:', error);
          setForm(prev => ({
            ...prev,
            location: `${position.coords.latitude}, ${position.coords.longitude}`,
            coordinates: { lat: position.coords.latitude, lng: position.coords.longitude }
          }));
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to get your location. Please enter manually.');
        setIsDetectingLocation(false);
      }
    );
  };

  // Manual location input
  const handleLocationChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, location: e.target.value }));
  };

  const resolveLanguage = (lang: string | undefined): SupportedLanguage => {
    if (lang === "en" || lang === "hi" || lang === "as") {
      return lang;
    }
    if (language === "en" || language === "hi" || language === "as") {
      return language;
    }
    // default to Hindi for new users
    return "hi";
  };

  const STRINGS: Record<
    SupportedLanguage,
    {
      title: string;
      description: string;
      nameLabel: string;
      namePlaceholder: string;
      ageLabel: string;
      agePlaceholder: string;
      sexLabel: string;
      languageLabel: string;
      locationLabel: string;
      locationPlaceholder: string;
      detectLocation: string;
      submit: string;
    }
  > = {
    en: {
      title: "Complete your profile",
      description: "For better recommendations, we need a few basic details about you.",
      nameLabel: "Name",
      namePlaceholder: "Full name",
      ageLabel: "Age",
      agePlaceholder: "Age in years",
      sexLabel: "Sex",
      languageLabel: "Preferred language",
      locationLabel: "Location",
      locationPlaceholder: "Enter your location or use GPS",
      detectLocation: "Use GPS Location",
      submit: isEditing ? "Update Profile" : "Continue",
    },
    hi: {
      title: "अपना प्रोफ़ाइल पूरा करें",
      description: "बेहतर सुझावों के लिए हम आपसे कुछ मूलभूत जानकारी पूछ रहे हैं।",
      nameLabel: "नाम",
      namePlaceholder: "अपना पूरा नाम लिखें",
      ageLabel: "उम्र",
      agePlaceholder: "उम्र (वर्षों में)",
      sexLabel: "सेक्स",
      languageLabel: "पसंदीदा भाषा",
      locationLabel: "स्थान",
      locationPlaceholder: "अपना स्थान डालें या GPS का प्रयोग करें",
      detectLocation: "GPS स्थान का प्रयोग करें",
      submit: isEditing ? "प्रोफ़ाइल अपडेट करें" : "आगे बढ़ें",
    },
    as: {
      title: "আপোনাৰ প্ৰ'ফাইল সম্পূৰ্ণ কৰক",
      description: "উত্তম পৰামৰ্শৰ বাবে আপুনি কিছুমান বেসিক তথ্য দিয়ক।",
      nameLabel: "নাম",
      namePlaceholder: "আপোনাৰ সম্পূৰ্ণ নাম লিখক",
      ageLabel: "বয়স",
      agePlaceholder: "বয়স (বছৰত)",
      sexLabel: "লিংগ",
      languageLabel: "প্ৰিয় ভাষা",
      locationLabel: "স্থান",
      locationPlaceholder: "আপোনাৰ স্থান লিখক বা GPS ব্যৱহৰহ কৰক",
      detectLocation: "GPS স্থান ব্যৱহৰহ কৰক",
      submit: isEditing ? "প্ৰ'ফাইল আপডেট কৰক" : "আগবঢ়ক",
    },
  };

  const currentLanguage = resolveLanguage(form.language || language);
  const t = STRINGS[currentLanguage];

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as LocalProfile;
      setForm(parsed);
    } else if (user) {
      setForm((prev) => ({
        ...prev,
        name: user.displayName || "",
      }));
    }
  }, [user]);

  const handleChange =
    (field: keyof LocalProfile) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (field === "language") {
        const nextLang = e.target.value as SupportedLanguage;
        if (nextLang === "en" || nextLang === "hi" || nextLang === "as") {
          setLanguage(nextLang);
        }
      }
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log('=== Profile Setup Submit Started ===');
    console.log('📝 Current form state:', form);
    console.log('👤 User object:', user);
    
    if (!user?.uid) {
      console.error('❌ No user found');
      alert('Please login first');
      return;
    }

    // Location is optional, so don't require it for validation
    if (!form.name || !form.age || !form.sex || !form.language) {
      console.error('❌ Form validation failed:', { form });
      alert('Please fill in all required fields (name, age, sex, language)');
      return;
    }

    console.log('✅ Form validation passed');
    console.log('📝 Form data to save:', form);
    console.log('👤 User UID:', user.uid);
    console.log('📧 User email:', user.email);

    try {
      console.log('🔄 Starting profile save...');
      
      // Create profile data object
      const profileData = {
        name: form.name,
        age: form.age,
        sex: form.sex,
        language: form.language,
        location: form.location || '', // Ensure location is string
        coordinates: form.coordinates || { lat: 0, lng: 0 }, // Ensure coordinates exist
        email: user.email,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log('📦 Profile data object created:', profileData);
      
      // Save to localStorage first (always works)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      console.log('💾 Saved to localStorage successfully');
      
      // Then try to save to Firebase
      try {
        console.log('🔥 Attempting Firebase save...');
        const success = await updateUserProfile(user.uid, profileData);
        console.log('📊 Firebase save result:', success);

        if (success) {
          console.log('✅ Profile saved successfully to Firebase');
        } else {
          console.log('⚠️ Firebase save failed, but localStorage saved');
        }
      } catch (firebaseError) {
        console.error('❌ Firebase error:', firebaseError);
        console.log('⚠️ Using localStorage only due to Firebase error');
      }
      
      // Always navigate after save attempt
      console.log('🚀 Navigating to home page...');
      navigate("/", { replace: true });
      
    } catch (error) {
      console.error('❌ General error in handleSubmit:', error);
      alert('Failed to save profile. Please try again.');
    }
    
    console.log('=== Profile Setup Submit Ended ===');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-background px-6">
      <div className="max-w-sm w-full space-y-8">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg">
            <Leaf className="h-8 w-8 text-emerald-50" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight font-hindi text-emerald-900">
              {t.title}
            </h1>
            <p className="text-sm text-muted-foreground">{t.description}</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-background/80 backdrop-blur border border-emerald-100 rounded-2xl shadow-sm p-6 space-y-4"
        >
          <div className="space-y-1">
            <Label htmlFor="name" className="font-hindi">
              {t.nameLabel}
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={handleChange("name")}
              required
              placeholder={t.namePlaceholder}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="age" className="font-hindi">
              {t.ageLabel}
            </Label>
            <Input
              id="age"
              type="number"
              min={10}
              max={100}
              value={form.age}
              onChange={handleChange("age")}
              required
              placeholder={t.agePlaceholder}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="sex" className="font-hindi">
              {t.sexLabel}
            </Label>
            <select
              id="sex"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={form.sex}
              onChange={handleChange("sex")}
              required
            >
              <option value="" disabled>
                {currentLanguage === "en" ? "Select" : currentLanguage === "hi" ? "चुनें" : "বাছনি কৰক"}
              </option>
              <option value="male">Male / पुरुष / পুৰুষ</option>
              <option value="female">Female / महिला / মহিলা</option>
              <option value="other">Other / अन्य / অন্য</option>
              <option value="prefer_not_to_say">
                Prefer not to say / नहीं बताना चाहते / নক'ব খোজো নহয়
              </option>
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="language" className="font-hindi">
              {t.languageLabel}
            </Label>
            <select
              id="language"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={form.language}
              onChange={handleChange("language")}
              required
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
              <option value="as">অসমীয়া</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="location" className="font-hindi">
              {t.locationLabel}
            </Label>
            <div className="flex gap-2">
              <Input
                id="location"
                value={form.location}
                onChange={handleLocationChange}
                placeholder={t.locationPlaceholder}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={detectLocation}
                disabled={isDetectingLocation}
                className="flex items-center gap-2"
              >
                {isDetectingLocation ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MapPin className="w-4 h-4" />
                )}
                <span className="text-xs">{t.detectLocation}</span>
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full">
            {t.submit}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;
