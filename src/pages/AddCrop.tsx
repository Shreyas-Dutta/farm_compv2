import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage, type SupportedLanguage } from "@/hooks/useLanguage";
import { addCrop, getUserCrops, getUserProfile, updateCrop } from "@/lib/database";
import { CROP_CATALOG, formatRegionLabel, getSuitableCropsForLocation, type CropCatalogItem } from "@/lib/cropSuitability";

const HEALTH_STATUS = [
  { value: "healthy", label: { en: "Healthy", hi: "स्वस्थ", as: "সুস্থ" } },
  { value: "stressed", label: { en: "Stressed", hi: "तनावग्रस्त", as: "চাপত" } },
  { value: "diseased", label: { en: "Diseased", hi: "रोगग्रस्त", as: "ৰোগাক্ৰান্ত" } },
];

const STORAGE_KEY = "farm-companion-profile";

type CropFormData = {
  name: string;
  nameEn: string;
  type: string;
  plantedDate: string;
  health: string;
  progress: number;
  notes: string;
};

type EditableCrop = Partial<CropFormData> & {
  id?: string;
  nameAs?: string;
  emoji?: string;
  status?: string;
  statusEn?: string;
  statusHi?: string;
  statusAs?: string;
};

const DEFAULT_FORM_DATA: CropFormData = {
  name: "",
  nameEn: "",
  type: "",
  plantedDate: "",
  health: "healthy",
  progress: 10,
  notes: "",
};

const normalizeCropText = (value: string) => value.trim().toLocaleLowerCase().replace(/\s+/g, " ");

const findCatalogCrop = (value: string): CropCatalogItem | undefined => {
  const normalized = normalizeCropText(value);
  if (!normalized) {
    return undefined;
  }

  return CROP_CATALOG.find((crop) => {
    const normalizedValue = normalizeCropText(crop.value.replace(/-/g, " "));
    return normalizedValue === normalized
      || crop.aliases.some((alias) => normalizeCropText(alias) === normalized)
      || Object.values(crop.label).some((label) => normalizeCropText(label) === normalized);
  });
};

const getStatusByProgress = (progress: number) => {
  if (progress >= 100) {
    return {
      status: "ready",
      statusEn: "Grown",
      statusHi: "तैयार",
      statusAs: "প্ৰস্তুত",
    };
  }

  return {
    status: "growing",
    statusEn: "Growing",
    statusHi: "बढ़ रहा है",
    statusAs: "বাঢ়ি আছে",
  };
};

const AddCrop = () => {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { language } = useLanguage();
  const cropFromState = (routerLocation.state as { crop?: EditableCrop } | null)?.crop || null;
  const requestedCropId = searchParams.get("cropId") || cropFromState?.id || "";
  const isEditing = Boolean(requestedCropId || cropFromState);
  
  const [formData, setFormData] = useState<CropFormData>(DEFAULT_FORM_DATA);
  const [editingCrop, setEditingCrop] = useState<EditableCrop | null>(cropFromState);
  
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState("");
  const [availableCrops, setAvailableCrops] = useState(CROP_CATALOG);
  const [loadingSuitableCrops, setLoadingSuitableCrops] = useState(true);
  const [regionKey, setRegionKey] = useState<string | null>(null);
  const [isRegionMatched, setIsRegionMatched] = useState(false);

  const STRINGS: Record<SupportedLanguage, {
    title: string;
    subtitle: string;
    cropType: string;
    plantedDate: string;
    healthStatus: string;
    progress: string;
    notes: string;
    notesPlaceholder: string;
    cropTypePlaceholder: string;
    editTitle: string;
    editSubtitle: string;
    addCrop: string;
    saveCrop: string;
    adding: string;
    saving: string;
    cancel: string;
    loginRequired: string;
    addFailed: string;
    updateFailed: string;
    checkingSuitableCrops: string;
    suitableForRegion: string;
    addLocationHint: string;
    allCropsFallback: string;
    customCropHelp: string;
    suggestedCrops: string;
    cropRequired: string;
    progressReadyHint: string;
    cropMarkedReady: string;
  }> = {
    en: {
      title: "Add New Crop",
      subtitle: "Add a new crop to your farm",
      cropType: "Crop Type",
      plantedDate: "Date Planted",
      healthStatus: "Health Status",
      progress: "Growth Progress",
      notes: "Notes",
      notesPlaceholder: "Add any notes about this crop...",
      cropTypePlaceholder: "Type any crop name",
      editTitle: "Edit Crop",
      editSubtitle: "Update details for this crop",
      addCrop: "Add Crop",
      saveCrop: "Save Changes",
      adding: "Adding...",
      saving: "Saving...",
      cancel: "Cancel",
      loginRequired: "Please login to add crops",
      addFailed: "Failed to add crop. Please try again.",
      updateFailed: "Failed to update crop. Please try again.",
      checkingSuitableCrops: "Checking crops suitable for your saved location...",
      suitableForRegion: "Showing crops suitable for {region}.",
      addLocationHint: "Add your location in profile to show region-specific crops.",
      allCropsFallback: "No strong region match found, so all supported crops are shown.",
      customCropHelp: "You can type any crop name. The suggestions below are optional.",
      suggestedCrops: "Suggested crops",
      cropRequired: "Please enter a crop name.",
      progressReadyHint: "At 100%, this crop will be marked as grown.",
      cropMarkedReady: "Crop marked as grown.",
    },
    hi: {
      title: "नई फसल जोड़ें",
      subtitle: "अपने खेत में एक नई फसल जोड़ें",
      cropType: "फसल का प्रकार",
      plantedDate: "रोपण की तारीख",
      healthStatus: "स्वास्थ्य स्थिति",
      progress: "वृद्धि प्रगति",
      notes: "टिप्पणियाँ",
      notesPlaceholder: "इस फसल के बारे में कोई टिप्पणी जोड़ें...",
      cropTypePlaceholder: "कोई भी फसल का नाम लिखें",
      editTitle: "फसल संपादित करें",
      editSubtitle: "इस फसल का विवरण अपडेट करें",
      addCrop: "फसल जोड़ें",
      saveCrop: "बदलाव सहेजें",
      adding: "जोड़ रहे हैं...",
      saving: "सहेज रहे हैं...",
      cancel: "रद्द करें",
      loginRequired: "फसल जोड़ने के लिए कृपया लॉगिन करें",
      addFailed: "फसल जोड़ने में समस्या हुई। कृपया फिर से कोशिश करें।",
      updateFailed: "फसल अपडेट करने में समस्या हुई। कृपया फिर से कोशिश करें।",
      checkingSuitableCrops: "आपके सेव किए गए स्थान के लिए उपयुक्त फसलों की जाँच की जा रही है...",
      suitableForRegion: "{region} के लिए उपयुक्त फसलें दिखाई जा रही हैं।",
      addLocationHint: "क्षेत्र के अनुसार फसलें देखने के लिए प्रोफ़ाइल में अपना स्थान जोड़ें।",
      allCropsFallback: "मजबूत क्षेत्र मिलान नहीं मिला, इसलिए सभी समर्थित फसलें दिखाई जा रही हैं।",
      customCropHelp: "आप कोई भी फसल का नाम लिख सकते हैं। नीचे दिए गए सुझाव वैकल्पिक हैं।",
      suggestedCrops: "सुझाई गई फसलें",
      cropRequired: "कृपया फसल का नाम दर्ज करें।",
      progressReadyHint: "100% पर यह फसल उगी हुई/तैयार के रूप में सेव होगी।",
      cropMarkedReady: "फसल को उगी हुई के रूप में सेव किया गया।",
    },
    as: {
      title: "নতুন শস্য যোগ কৰক",
      subtitle: "আপোনাৰ খেতত এটা নতুন শস্য যোগ কৰক",
      cropType: "শস্যৰ প্ৰকাৰ",
      plantedDate: "ৰোপনৰ তাৰিখ",
      healthStatus: "স্বাস্থ্য অৱস্থা",
      progress: "বৃদ্ধি প্ৰগতি",
      notes: "টোকা",
      notesPlaceholder: "এই শস্যটোৰ বিষয়ে টোকা যোগ কৰক...",
      cropTypePlaceholder: "যিকোনো শস্যৰ নাম লিখক",
      editTitle: "শস্য সম্পাদনা কৰক",
      editSubtitle: "এই শস্যৰ তথ্য আপডেট কৰক",
      addCrop: "শস্য যোগ কৰক",
      saveCrop: "সলনি সংৰক্ষণ কৰক",
      adding: "যোগ কৰা হৈছে...",
      saving: "সংৰক্ষণ কৰা হৈছে...",
      cancel: "বাতিল কৰক",
      loginRequired: "শস্য যোগ কৰিবলৈ অনুগ্ৰহ কৰি লগইন কৰক",
      addFailed: "শস্য যোগ কৰিব নোৱাৰি। অনুগ্ৰহ কৰি পুনৰ চেষ্টা কৰক।",
      updateFailed: "শস্য আপডেট কৰিব নোৱাৰি। অনুগ্ৰহ কৰি পুনৰ চেষ্টা কৰক।",
      checkingSuitableCrops: "আপোনাৰ সংৰক্ষিত স্থানৰ বাবে উপযুক্ত শস্য বিচৰা হৈছে...",
      suitableForRegion: "{region} ৰ বাবে উপযুক্ত শস্য দেখুওৱা হৈছে।",
      addLocationHint: "অঞ্চলভিত্তিক শস্য চাবলৈ প্ৰ'ফাইলত আপোনাৰ স্থান যোগ কৰক।",
      allCropsFallback: "ভাল অঞ্চল মিল নোপোৱা বাবে সকলো সমৰ্থিত শস্য দেখুওৱা হৈছে।",
      customCropHelp: "আপুনি যিকোনো শস্যৰ নাম লিখিব পাৰে। তলৰ পৰামৰ্শসমূহ ঐচ্ছিক।",
      suggestedCrops: "পৰামৰ্শ দিয়া শস্য",
      cropRequired: "অনুগ্ৰহ কৰি শস্যৰ নাম লিখক।",
      progressReadyHint: "100% হলে এই শস্যক উগা/প্ৰস্তুত বুলি সংৰক্ষণ কৰা হ'ব।",
      cropMarkedReady: "শস্যক উগা বুলি সংৰক্ষণ কৰা হ'ল।",
    }
  };

  const t = STRINGS[language];

  useEffect(() => {
    if (cropFromState) {
      setEditingCrop(cropFromState);
    }
  }, [cropFromState]);

  useEffect(() => {
    let isMounted = true;

    const readSavedLocation = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) as { location?: string } : null;
        return parsed?.location || "";
      } catch {
        return "";
      }
    };

    const loadLocation = async () => {
      const savedLocation = readSavedLocation();
      if (savedLocation && isMounted) {
        setLocation(savedLocation);
      }

      if (!user?.uid) {
        return;
      }

      try {
        const profile = await getUserProfile(user.uid);
        if (profile?.location && isMounted) {
          setLocation(profile.location);
        }
      } catch (error) {
        console.error("Error loading crop suitability profile:", error);
      }
    };

    loadLocation();

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    if (!requestedCropId || !user?.uid) {
      return () => {
        isMounted = false;
      };
    }

    const loadEditingCrop = async () => {
      try {
        const crops = await getUserCrops(user.uid);
        const matchedCrop = Array.isArray(crops)
          ? crops.find((crop) => String(crop?.id || "") === requestedCropId)
          : null;

        if (!isMounted) {
          return;
        }

        if (matchedCrop) {
          setEditingCrop(matchedCrop);
          return;
        }

        if (!cropFromState) {
          navigate("/profile", { replace: true });
        }
      } catch (error) {
        console.error("Error loading crop for editing:", error);
        if (isMounted && !cropFromState) {
          navigate("/profile", { replace: true });
        }
      }
    };

    void loadEditingCrop();

    return () => {
      isMounted = false;
    };
  }, [cropFromState, navigate, requestedCropId, user?.uid]);

  useEffect(() => {
    if (!editingCrop) {
      return;
    }

    setFormData({
      name: editingCrop.name || editingCrop.nameEn || "",
      nameEn: editingCrop.nameEn || editingCrop.name || "",
      type: editingCrop.type || editingCrop.nameEn || editingCrop.name || editingCrop.nameAs || "",
      plantedDate: typeof editingCrop.plantedDate === "string" ? editingCrop.plantedDate : "",
      health: editingCrop.health || "healthy",
      progress: typeof editingCrop.progress === "number" ? editingCrop.progress : 10,
      notes: editingCrop.notes || "",
    });
  }, [editingCrop]);

  useEffect(() => {
    let isMounted = true;

    const loadSuitableCrops = async () => {
      setLoadingSuitableCrops(true);

      try {
        const result = await getSuitableCropsForLocation(location);
        if (!isMounted) {
          return;
        }

        setAvailableCrops(result.crops);
        setRegionKey(result.regionKey);
        setIsRegionMatched(result.source !== "all");
      } catch (error) {
        console.error("Error loading suitable crops:", error);
        if (isMounted) {
          setAvailableCrops(CROP_CATALOG);
          setRegionKey(null);
          setIsRegionMatched(false);
        }
      } finally {
        if (isMounted) {
          setLoadingSuitableCrops(false);
        }
      }
    };

    loadSuitableCrops();

    return () => {
      isMounted = false;
    };
  }, [location]);

  const matchedCatalogCrop = findCatalogCrop(formData.type);
  const suggestedCrops = matchedCatalogCrop && !availableCrops.some((crop) => crop.value === matchedCatalogCrop.value)
    ? [matchedCatalogCrop, ...availableCrops]
    : availableCrops;

  const handleInputChange = (field: keyof CropFormData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === "progress"
        ? Math.max(0, Math.min(100, Number(value) || 0))
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.uid) {
      alert(t.loginRequired);
      return;
    }

    const typedCropName = String(formData.type || "").trim();
    if (!typedCropName) {
      alert(t.cropRequired);
      return;
    }

    setLoading(true);
    
    try {
      const selectedCrop = findCatalogCrop(typedCropName);
      const statusMeta = getStatusByProgress(formData.progress);
      const cropPayload = {
        name: selectedCrop?.label.hi || typedCropName,
        nameEn: selectedCrop?.label.en || typedCropName,
        nameAs: selectedCrop?.label.as || typedCropName,
        type: selectedCrop?.value || typedCropName,
        emoji: selectedCrop?.emoji || editingCrop?.emoji || "🌱",
        status: statusMeta.status,
        statusEn: statusMeta.statusEn,
        statusHi: statusMeta.statusHi,
        statusAs: statusMeta.statusAs,
        health: formData.health,
        progress: formData.progress,
        plantedDate: formData.plantedDate,
        notes: formData.notes,
      };

      if (requestedCropId) {
        if (!editingCrop) {
          navigate("/profile", { replace: true });
          return;
        }

        await updateCrop(user.uid, requestedCropId, cropPayload);
      } else {
        await addCrop(user.uid, {
          ...cropPayload,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      if (formData.progress >= 100) {
        alert(t.cropMarkedReady);
      }

      navigate('/profile');
    } catch (error) {
      console.error(isEditing ? 'Error updating crop:' : 'Error adding crop:', error);
      alert(isEditing ? t.updateFailed : t.addFailed);
    } finally {
      setLoading(false);
    }
  };

  const cropHint = !location
    ? t.addLocationHint
    : loadingSuitableCrops
      ? t.checkingSuitableCrops
      : isRegionMatched && regionKey
        ? t.suitableForRegion.replace("{region}", formatRegionLabel(regionKey))
        : t.allCropsFallback;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-primary text-primary-foreground px-4 pt-10 pb-6 rounded-b-3xl">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="mb-3">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h1 className="text-xl font-bold">{isEditing ? t.editTitle : t.title}</h1>
            <p className="text-sm opacity-80 mt-1">{isEditing ? t.editSubtitle : t.subtitle}</p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 mt-6">
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Crop Type */}
              <div>
                <Label htmlFor="type">{t.cropType}</Label>
                <p className="mt-1 text-xs text-muted-foreground">{cropHint}</p>
                <Input
                  id="type"
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  placeholder={t.cropTypePlaceholder}
                  autoComplete="off"
                />
                <p className="mt-2 text-xs text-muted-foreground">{t.customCropHelp}</p>
                {suggestedCrops.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-foreground">{t.suggestedCrops}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {suggestedCrops.map((crop) => (
                        <Button
                          key={crop.value}
                          type="button"
                          size="sm"
                          variant={matchedCatalogCrop?.value === crop.value ? "default" : "outline"}
                          className="h-8 rounded-full px-3 text-xs"
                          onClick={() => handleInputChange('type', crop.label[language])}
                          disabled={loadingSuitableCrops}
                        >
                          <span>{crop.emoji}</span>
                          <span>{crop.label[language]}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Planted Date */}
              <div>
                <Label htmlFor="plantedDate">{t.plantedDate}</Label>
                <Input
                  id="plantedDate"
                  type="date"
                  value={formData.plantedDate}
                  onChange={(e) => handleInputChange('plantedDate', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Health Status */}
              <div>
                <Label htmlFor="health">{t.healthStatus}</Label>
                <Select value={formData.health} onValueChange={(value) => handleInputChange('health', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HEALTH_STATUS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label[language]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Growth Progress */}
              <div>
                <Label htmlFor="progress">{t.progress}: {formData.progress}%</Label>
                <input
                  type="range"
                  id="progress"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => handleInputChange('progress', parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                />
                {formData.progress >= 100 && (
                  <p className="mt-2 text-xs font-medium text-primary">{t.progressReadyHint}</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">{t.notes}</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder={t.notesPlaceholder}
                  className="w-full p-3 border rounded-md resize-none h-20"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/profile')}
                  disabled={loading}
                >
                  {t.cancel}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (isEditing ? t.saving : t.adding) : (isEditing ? t.saveCrop : t.addCrop)}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddCrop;
