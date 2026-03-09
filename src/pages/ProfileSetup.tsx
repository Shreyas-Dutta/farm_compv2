import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Leaf, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";

const STORAGE_KEY = "farm-companion-profile";

const ProfileSetupFixed = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();

  const [form, setForm] = useState({
    name: "",
    age: "",
    sex: "",
    language: language || "hi",
    location: "",
  });

  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
            
            setForm(prev => ({ ...prev, location: address }));
            console.log('✅ Location detected:', address);
          }
        } catch (error) {
          console.error('Error getting address:', error);
          setForm(prev => ({ ...prev, location: `${position.coords.latitude}, ${position.coords.longitude}` }));
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
  const handleLocationChange = (e) => {
    setForm(prev => ({ ...prev, location: e.target.value }));
  };

  // Form field changes
  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  // Language change
  const handleLanguageChange = (e) => {
    setForm(prev => ({ ...prev, language: e.target.value }));
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user?.uid) {
      alert('Please login first');
      return;
    }

    if (!form.name || !form.age || !form.sex) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    console.log('🚀 Starting profile save...');

    try {
      // Save to localStorage (always works)
      const profileData = {
        ...form,
        email: user.email,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(profileData));
      console.log('✅ Saved to localStorage:', profileData);

      // Try to save to Firebase (simplified)
      try {
        const response = await fetch('/api/save-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid, data: profileData })
        });

        if (response.ok) {
          console.log('✅ Profile saved to server');
        } else {
          console.log('⚠️ Server save failed, but localStorage saved');
        }
      } catch (serverError) {
        console.log('⚠️ Server error, using localStorage only');
      }

      // Always navigate
      console.log('🚀 Navigating to home...');
      navigate("/", { replace: true });

    } catch (error) {
      console.error('❌ Error:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const STRINGS = {
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
      submit: "Continue",
    },
    hi: {
      title: "अपना प्रोफ़ाइल पूरा करें",
      description: "बेहतर सुझावों के लिए, हम आपसे कुछ मूलभूत जानकारी चाहिए।",
      nameLabel: "नाम",
      namePlaceholder: "अपना पूरा नाम लिखें",
      ageLabel: "उम्र",
      agePlaceholder: "उम्र (वर्षों में)",
      sexLabel: "सेक्स",
      languageLabel: "पसंदीदा भाषा",
      locationLabel: "स्थान",
      locationPlaceholder: "अपना स्थान डालें या GPS का प्रयोग करें",
      detectLocation: "GPS स्थान का प्रयोग करें",
      submit: "आगे बढ़ें",
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
      submit: "আগবঢ়ক",
    },
  };

  const t = STRINGS[language] || STRINGS.hi;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-background px-6">
      <div className="max-w-sm w-full space-y-8">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg">
            <Leaf className="h-8 w-8 text-emerald-50" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-emerald-900">
              {t.title}
            </h1>
            <p className="text-sm text-muted-foreground">{t.description}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-background/80 backdrop-blur border border-emerald-100 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name" className="text-emerald-900">
              {t.nameLabel}
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={handleChange("name")}
              required
              placeholder={t.namePlaceholder}
              className="w-full"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="age" className="text-emerald-900">
              {t.ageLabel}
            </Label>
            <Input
              id="age"
              type="number"
              value={form.age}
              onChange={handleChange("age")}
              required
              placeholder={t.agePlaceholder}
              className="w-full"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="sex" className="text-emerald-900">
              {t.sexLabel}
            </Label>
            <select
              id="sex"
              value={form.sex}
              onChange={handleChange("sex")}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="" disabled>
                Select
              </option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="language" className="text-emerald-900">
              {t.languageLabel}
            </Label>
            <select
              id="language"
              value={form.language}
              onChange={handleLanguageChange}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
              <option value="as">অসমীয়া</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="location" className="text-emerald-900">
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

          <Button 
            type="submit" 
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : t.submit}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetupFixed;
