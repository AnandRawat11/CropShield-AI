import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  TrendingUp,
  Leaf,
  Users,
  Activity,
  Camera,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Globe,
  LogOut,
  ChevronDown,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Info,
  ShieldCheck,
  Zap,
  ChevronRight,
  FileImage,
  Loader2,
  ScanSearch
} from "lucide-react";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

import API from "@/services/api";
import { useTranslation } from "react-i18next";
import PremiumModal from "@/components/PremiumModal";
// Assuming you have these images or we just use URLs/placeholders if they aren't working.
import leafSpotImg from "../assets/img/leaf_spot.jpg";
import rootRotImg from "../assets/img/root_rot.jpg";
import tomatoBlightImg from "../assets/img/tomato_blight.jpg";

const PIE_COLORS = ['#22c55e', '#10b981', '#059669', '#047857', '#064e3b'];

export default function Dashboard() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [user, setUser] = useState(null);
  const [scans, setScans] = useState([]);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedScan, setSelectedScan] = useState(null);

  const fileInputRef = useRef(null);

  /* ================= AUTH ================= */
  useEffect(() => {
    API.get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.clear();
        navigate("/login");
      });
  }, [navigate]);

  /* ================= SCAN HISTORY ================= */
  useEffect(() => {
    API.get("/disease/history")
      .then((res) => setScans(res.data || []))
      .catch(() => { });
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] text-green-700">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-3 font-medium">{t("dashboard.loading")}</span>
      </div>
    );
  }

  /* ================= HELPER FUNCTIONS ================= */
  const calculateAvgConfidence = (data) => {
    if (!data.length) return 0;
    const total = data.reduce((acc, curr) => acc + (curr.confidence || 0), 0);
    return Math.round((total / data.length) * 100);
  };

  const getMostCommonDisease = (data) => {
    if (!data.length) return t("dashboard.none");
    const counts = {};
    data.forEach((s) => {
      const name = s.disease || t("dashboard.unknown");
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b));
  };

  // Condense long AI-generated vague disease descriptions into a short label
  const cleanDiseaseName = (name) => {
    if (!name) return t("dashboard.unknown");
    const vague = [
      'Undetermined', 'Not identifiable', 'Insufficient', 'cannot be verified',
      'Unknown / Unclear', 'Not a Crop', 'not display', 'generic icon',
      'cannot be determined', 'cannot identify'
    ];
    if (vague.some(v => name.toLowerCase().includes(v.toLowerCase()))) {
      return t("dashboard.undetermined");
    }
    // Truncate to 30 chars for display
    return name.length > 30 ? name.slice(0, 28) + '…' : name;
  };

  /**
   * getScanStatus — returns authoritative 3-state status for a record.
   * New records have scan.status = "Healthy"|"Infected"|"Unknown" from backend.
   * Old records without status field fall back to keyword detection.
   */
  const getScanStatus = (scan) => {
    // Authoritative field (new records)
    if (scan.status === 'Healthy' || scan.status === 'Infected' || scan.status === 'Unknown') {
      return scan.status;
    }
    // Backward compat for old records (keyword-based)
    const disease = (scan.disease || '').toLowerCase();
    if (
      disease.includes('healthy') || disease.includes('स्वस्थ') || disease.includes('निरोगी') ||
      disease.includes('निर‌ोगी') || disease.includes('कोई रोग नहीं') || disease.includes('कोणताही रोग')
    ) return 'Healthy';
    if (
      disease.includes('not identifiable') || disease.includes('undetermined') ||
      disease.includes('insufficient') || disease.includes('unclear') ||
      disease.includes('cannot') || disease.includes('पहचान योग्य नहीं') ||
      disease.includes('ओळखता येत नाही')
    ) return 'Unknown';
    return 'Infected';
  };

  // Returns a short display name: just the disease part after " - ", or "No Disease" for healthy
  const shortDiseaseName = (name) => {
    if (!name) return t("dashboard.unknown");
    const lowerName = name.toLowerCase();
    // healthy variants
    if (
      lowerName.includes('healthy') ||
      lowerName.includes('स्वस्थ') ||
      lowerName.includes('निरोगी')
    ) return t("dashboard.noDisease");
    // Extract part after " - "
    const dashIdx = name.indexOf(' - ');
    const short = dashIdx > 0 ? name.slice(dashIdx + 3).trim() : name;
    // Translate keywords
    const translated = translateDiseaseName(short);
    return translated.length > 30 ? translated.slice(0, 28) + '…' : translated;
  };

  // Extract crop name from disease strings like "Maize - healthy" or "Tomato - Late Blight"
  const extractCropFromDisease = (diseaseName) => {
    if (!diseaseName) return null;
    const dashIdx = diseaseName.indexOf(' - ');
    if (dashIdx > 0) return diseaseName.slice(0, dashIdx).trim();
    const parts = diseaseName.split('_');
    if (parts.length > 1) return parts[0].trim();
    return null;
  };

  // Translate English disease/crop keywords in stored DB strings for existing records
  const DISEASE_WORD_MAP = {
    hi: {
      'Maize': 'मक्का', 'Tomato': 'टमाटर', 'Potato': 'आलू', 'Rice': 'चावल',
      'Wheat': 'गेहूं', 'Cotton': 'कपास', 'Sugarcane': 'गन्ना',
      'Healthy': 'स्वस्थ', 'Disease': 'रोग', 'Pest': 'कीट',
      'Late Blight': 'झुलसा (देर)', 'Early Blight': 'झुलसा (शुरू)',
      'Leaf Spot': 'पत्ती धब्बा', 'Root Rot': 'जड़ सड़न', 'Rust': 'जंग रोग',
      'Blight': 'झुलसा', 'Wilt': 'मुरझाना', 'Mosaic': 'मोज़ेक',
      'Not a Crop': 'फसल नहीं', 'Unknown': 'अज्ञात'
    },
    mr: {
      'Maize': 'मका', 'Tomato': 'टोमॅटो', 'Potato': 'बटाटा', 'Rice': 'तांदूळ',
      'Wheat': 'गहू', 'Cotton': 'कापूस', 'Sugarcane': 'ऊस',
      'Healthy': 'निरोगी', 'Disease': 'रोग', 'Pest': 'कीड',
      'Late Blight': 'उशीरा करपा', 'Early Blight': 'लवकर करपा',
      'Leaf Spot': 'पानावरील डाग', 'Root Rot': 'मुळे कुजणे', 'Rust': 'गंज',
      'Blight': 'करपा', 'Wilt': 'मरगळणे', 'Mosaic': 'मोझेक',
      'Not a Crop': 'पीक नाही', 'Unknown': 'अज्ञात'
    }
  };

  const translateDiseaseName = (name) => {
    if (!name || i18n.language === 'en') return name;
    const dict = DISEASE_WORD_MAP[i18n.language];
    if (!dict) return name;
    // Replace known English words with translated equivalents
    let translated = name;
    Object.entries(dict).forEach(([en, local]) => {
      translated = translated.replace(new RegExp(`\\b${en}\\b`, 'gi'), local);
    });
    return translated;
  };


  /* ================= COMPUTED VALUES ================= */
  const totalScans = scans.length;
  const avgConfidence = calculateAvgConfidence(scans);
  const mostCommonDisease = getMostCommonDisease(scans);
  const diseasesDetected = new Set(scans.map(s => s.disease)).size;

  // Chart Data
  const trendData = [
    { name: t("dashboard.days.mon"), scans: 10 },
    { name: t("dashboard.days.tue"), scans: 25 },
    { name: t("dashboard.days.wed"), scans: 28 },
    { name: t("dashboard.days.thu"), scans: 55 },
    { name: t("dashboard.days.fri"), scans: 48 },
    { name: t("dashboard.days.sat"), scans: 42 },
    { name: t("dashboard.days.sun"), scans: 35 },
  ];

  const diseaseDistribution = [
    { name: t("dashboard.chart.tomatoBlight"), value: 45 },
    { name: t("dashboard.chart.leafSpot"), value: 25 },
    { name: t("dashboard.chart.rootRot"), value: 20 },
    { name: t("dashboard.chart.healthy"), value: 10 },
  ];

  const cropAnalysis = [
    { name: t("dashboard.chart.tomato"), count: 120 },
    { name: t("dashboard.chart.potato"), count: 80 },
    { name: t("dashboard.chart.corn"), count: 50 },
    { name: t("dashboard.chart.wheat"), count: 30 },
  ];

  /* ================= HANDLERS ================= */
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setScanResult(null); // Clear previous result
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setScanResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      setFile(droppedFile);
      setPreviewUrl(URL.createObjectURL(droppedFile));
      setScanResult(null);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select an image first");
      return;
    }

    if (user.plan !== "PREMIUM" && user.remainingScans <= 0) {
      setShowPremium(true);
      return;
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("lang", i18n.language);

    try {
      setLoading(true);

      const res = await API.post("/disease/detect", formData);
      const apiResult = res.data;

      const scanData = {
        imageUrl: apiResult.imageUrl || previewUrl,
        disease: apiResult.disease?.disease || "Unknown",
        confidence: apiResult.disease?.confidence || 0,
        severity: apiResult.disease?.severity || "Low",
        status: apiResult.disease?.status || "Unknown",   // "Healthy" | "Infected" | "Unknown"
        crop: apiResult.disease?.crop || null,
        treatment: apiResult.treatment,
        explanation: apiResult.explanation
      };

      setScanResult(scanData);

      const newScan = {
        _id: Date.now(),
        imageUrl: scanData.imageUrl,
        disease: scanData.disease,
        confidence: scanData.confidence,
        severity: scanData.severity,
        status: scanData.status,       // authoritative — from backend AI
        date: new Date().toISOString(),
        crop: scanData.crop || extractCropFromDisease(scanData.disease) || t("dashboard.unknown"),
        treatment: scanData.treatment,
        explanation: scanData.explanation
      };

      setScans((prev) => [newScan, ...prev]);

      // refresh user data (remaining scans / plan)
      const me = await API.get("/auth/me");
      setUser(me.data);
    } catch {
      alert("AI scan failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredScans = scans.filter(scan =>
    scan.disease?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scan.crop?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 font-sans">

      {/* ================= TOP NAVIGATION BAR ================= */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
          <img src="/logo.png" alt="CropShield-AI" className="h-9 w-auto" />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">
            CropShield AI
          </span>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => { const langs = ["en", "hi", "mr"]; const next = langs[(langs.indexOf(i18n.language) + 1) % langs.length]; i18n.changeLanguage(next); localStorage.setItem("cropshield_lang", next); }}
            className="text-gray-500 hover:text-green-600 transition flex items-center gap-1 text-sm font-medium"
          >
            <Globe className="w-4 h-4" />
            <span>{i18n.language.toUpperCase()}</span>
          </button>

          <button className="relative text-gray-500 hover:text-green-600 transition p-2 rounded-full hover:bg-green-50">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          <div className="relative group cursor-pointer">
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold border border-green-200">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-gray-800 leading-tight">{user.name}</p>
                <p className="text-xs text-gray-500">{user.plan} {t("dashboard.plan")}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right scale-95 group-hover:scale-100">
              <div className="p-2">
                <div className="px-4 py-2 border-b border-gray-50 mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("dashboard.account")}</p>
                </div>
                {user.plan !== "PREMIUM" && (
                  <button onClick={() => setShowPremium(true)} className="w-full text-left px-4 py-2 text-sm text-green-600 font-medium hover:bg-green-50 rounded-lg transition flex items-center gap-2">
                    <Zap className="w-4 h-4" /> {t("dashboard.upgradePlan")}
                  </button>
                )}
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition flex items-center gap-2">
                  <LogOut className="w-4 h-4" /> {t("nav.logout")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* ================= QUICK INSIGHT CARDS ================= */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("dashboard.overview")}</h1>
            <p className="text-gray-500 text-sm mt-1">{t("dashboard.overviewSub")}</p>
          </div>
          {user.plan !== "PREMIUM" && (
            <div className="bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm flex items-center gap-3 text-sm">
              <span className="text-gray-600">{t("dashboard.scansRemaining")}</span>
              <span className="font-bold text-gray-900">{user.remainingScans}</span>
              <button
                onClick={() => setShowPremium(true)}
                className="text-green-600 font-semibold hover:underline"
              >
                {t("dashboard.getUnlimited")}
              </button>
            </div>
          )}
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard
            title={t("dashboard.totalUploads")}
            value={totalScans}
            icon={<Upload className="w-6 h-6 text-green-600" />}
            colorClass="bg-green-100"
          />
          <StatCard
            title={t("dashboard.diseasesDetected")}
            value={diseasesDetected}
            icon={<Activity className="w-6 h-6 text-blue-600" />}
            colorClass="bg-blue-100"
          />
          <StatCard
            title={t("dashboard.mostFrequent")}
            value={cleanDiseaseName(mostCommonDisease)}
            fullValue={mostCommonDisease}
            icon={<AlertTriangle className="w-6 h-6 text-amber-600" />}
            colorClass="bg-amber-100"
          />
          <StatCard
            title={t("dashboard.avgConfidence")}
            value={avgConfidence > 0 ? `${avgConfidence}%` : t("dashboard.na")}
            icon={<ShieldCheck className="w-6 h-6 text-emerald-600" />}
            colorClass="bg-emerald-100"
          />
        </section>

        {/* ================= MAIN ACTION SECTION (IMAGE UPLOAD) ================= */}
        <section className="mb-10 bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex flex-col lg:flex-row gap-8 items-start">

            {/* Upload Area */}
            <div className="w-full lg:w-1/2 flex flex-col">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{t("dashboard.newScan")}</h2>
              <p className="text-gray-500 text-sm mb-6">{t("dashboard.newScanSub")}</p>

              <div
                className={`flex-1 min-h-[300px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-center transition-all bg-gray-50
                  ${previewUrl ? 'border-green-400 bg-green-50/30' : 'border-gray-300 hover:border-green-400 hover:bg-green-50/50 cursor-pointer'}
                `}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => !previewUrl && fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  ref={fileInputRef}
                />

                {previewUrl ? (
                  <div className="relative w-full h-full flex flex-col items-center">
                    <img src={previewUrl} alt="Preview" className="max-h-[220px] rounded-xl object-contain shadow-md mb-4" />
                    <div className="flex gap-3 mt-auto">
                      <button
                        onClick={(e) => { e.stopPropagation(); clearFile(); }}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition"
                      >
                        {t("dashboard.remove")}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-green-600 rounded-full hover:bg-green-700 transition disabled:opacity-70 shadow-lg shadow-green-500/30"
                      >
                        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("dashboard.analyzing")}</> : <><ScanSearch className="w-4 h-4" /> {t("dashboard.scanButton")}</>}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                      <FileImage className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">{t("dashboard.dragDrop")}</h3>
                    <p className="text-sm text-gray-500 mt-2 mb-6">{t("dashboard.orClick")}</p>
                    <div className="px-6 py-2.5 bg-white text-gray-800 font-medium text-sm rounded-full border border-gray-200 shadow-sm pointer-events-none">
                      {t("dashboard.selectFile")}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Results Area */}
            <div className="w-full lg:w-1/2 min-h-[300px]">
              {loading ? (
                <div className="h-full bg-gray-50 rounded-2xl flex flex-col items-center justify-center border border-gray-100 py-20">
                  <div className="w-16 h-16 relative">
                    <div className="absolute inset-0 border-4 border-green-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-green-500 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-gray-800">{t("dashboard.aiAnalyzing")}</h3>
                  <p className="text-sm text-gray-500 mt-2">{t("dashboard.deepLearning")}</p>
                </div>
              ) : scanResult ? (
                <div className="h-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                  {scanResult.confidence < 0.4 || !scanResult.is_plant ? (
                    <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{t("dashboard.qualityError")}</h3>
                      <p className="text-gray-600 max-w-sm">
                        {t("dashboard.qualityErrorSub")}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Result Header */}
                      <div className="bg-green-50/80 p-6 border-b border-green-100 flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-green-700 uppercase tracking-wider mb-1">{t("dashboard.analysisComplete")}</p>
                          <h3 className="text-2xl font-bold text-gray-900">{scanResult.disease}</h3>
                        </div>
                        <div className="w-16 h-16 rounded-full border-4 border-emerald-100 flex items-center justify-center flex-col bg-white shadow-sm">
                          <span className="text-lg font-bold text-emerald-600 leading-none">{Math.round(scanResult.confidence * 100)}%</span>
                        </div>
                      </div>

                      {/* Result Body */}
                      <div className="p-6 flex-1 flex flex-col gap-5">

                        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                          <span className="text-gray-600 font-medium flex items-center gap-2">
                            <Activity className="w-4 h-4" /> {t("dashboard.riskLevel")}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                            ${scanResult.severity === 'High' ? 'bg-red-100 text-red-700' :
                              scanResult.severity === 'Medium' ? 'bg-amber-100 text-amber-700' :
                                'bg-emerald-100 text-emerald-700'}`}>
                            {scanResult.severity} {t("dashboard.risk")}
                          </span>
                        </div>

                        <div className="flex-1 rounded-xl bg-blue-50/50 border border-blue-100 p-5">
                          <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2 mb-2">
                            <Info className="w-4 h-4 text-blue-600" /> {t("dashboard.treatmentRec")}
                          </h4>
                          <p className="text-sm text-blue-800 leading-relaxed">
                            {scanResult.treatment?.message || scanResult.treatment || t("dashboard.noTreatment")}
                          </p>
                        </div>

                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="h-full bg-gray-50 rounded-2xl flex flex-col items-center justify-center border border-gray-100 border-dashed py-20 text-center px-6">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                    <CheckCircle className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">{t("dashboard.readyTitle")}</h3>
                  <p className="text-sm text-gray-500 mt-2 max-w-sm">{t("dashboard.readySub")}</p>
                </div>
              )}
            </div>

          </div>
        </section>

        {/* ================= ANALYTICS SECTION ================= */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">

          {/* Line Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h3 className="text-lg font-bold text-gray-900 mb-6">{t("dashboard.detectionsOverTime")}</h3>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <defs>
                    <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#94a3b8" fontSize={12} dy={10} />
                  <YAxis axisLine={false} tickLine={false} stroke="#94a3b8" fontSize={12} dx={-10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="scans"
                    stroke="#22c55e"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#fff", strokeWidth: 2, stroke: "#22c55e" }}
                    activeDot={{ r: 6, fill: "#22c55e", stroke: "#fff", strokeWidth: 2 }}
                    fillOpacity={1}
                    fill="url(#colorScans)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t("dashboard.diseaseDistribution")}</h3>
            <div className="h-[250px] w-full mt-4 flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={diseaseDistribution}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {diseaseDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#64748b' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t("dashboard.cropAnalysis")}</h3>
            <div className="h-[250px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cropAnalysis} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#94a3b8" fontSize={12} dy={10} />
                  <YAxis axisLine={false} tickLine={false} stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </section>

        {/* ================= PREDICTION HISTORY SECTION ================= */}
        <section className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden mb-10">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="text-lg font-bold text-gray-900">{t("dashboard.predictionHistory")}</h3>

            <div className="flex gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:min-w-[250px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t("dashboard.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium text-gray-700"
                />
              </div>
              <button className="flex items-center justify-center p-2 border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50 transition">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/50">
                <tr className="text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">{t("dashboard.date")}</th>
                  <th className="px-6 py-4 font-semibold">{t("dashboard.crop")}</th>
                  <th className="px-6 py-4 font-semibold">{t("dashboard.predictedDisease")}</th>
                  <th className="px-6 py-4 font-semibold">{t("dashboard.confidence")}</th>
                  <th className="px-6 py-4 font-semibold">{t("dashboard.status")}</th>
                  <th className="px-6 py-4 font-semibold text-right">{t("dashboard.action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredScans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                        <ScanSearch className="w-10 h-10" />
                        <p className="font-semibold text-gray-500">{t("dashboard.noScans")}</p>
                        <p className="text-sm">{t("dashboard.noScansSub")}</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredScans.map((scan, i) => (
                  <tr key={scan._id || i} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4">
                      {new Date(scan.date).toLocaleDateString(
                        i18n.language === 'hi' ? 'hi-IN' : i18n.language === 'mr' ? 'mr-IN' : 'en-US',
                        { month: 'short', day: 'numeric', year: 'numeric' }
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {(!scan.crop || scan.crop === 'Unknown' || scan.crop === 'अज्ञात' || scan.crop === 'अज्ञात')
                        ? (extractCropFromDisease(scan.disease) || t("dashboard.unknown"))
                        : scan.crop}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Leaf className={`w-4 h-4 flex-shrink-0 ${scan.disease?.toLowerCase().includes('healthy') ? 'text-emerald-500' : 'text-amber-500'
                          }`} />
                        <span className="max-w-[200px] truncate" title={translateDiseaseName(scan.disease)}>
                          {shortDiseaseName(scan.disease)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${scan.disease === 'Healthy' ? 'bg-emerald-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.round(scan.confidence * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-500">{Math.round(scan.confidence * 100)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const st = getScanStatus(scan);
                        const cfg = {
                          Healthy: { cls: 'bg-emerald-100 text-emerald-700', label: t('dashboard.healthy') },
                          Infected: { cls: 'bg-red-100 text-red-700', label: t('dashboard.infected') },
                          Unknown: { cls: 'bg-yellow-100 text-yellow-700', label: t('dashboard.unknownStatus') }
                        }[st] || { cls: 'bg-yellow-100 text-yellow-700', label: t('dashboard.unknownStatus') };
                        return (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${cfg.cls}`}>
                            {cfg.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedScan(scan)}
                        className="text-green-600 font-semibold hover:underline flex items-center justify-end gap-1 text-sm ml-auto"
                      >
                        {t("dashboard.details")} <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}

              </tbody>
            </table>
          </div>
        </section>

      </main>

      {/* ================= PREMIUM POPUP ================= */}
      <PremiumModal
        open={showPremium}
        onClose={() => setShowPremium(false)}
        onUpgraded={(data) =>
          setUser((prev) => ({ ...prev, ...data }))
        }
      />

      {/* ================= SCAN DETAIL MODAL ================= */}
      {selectedScan && (
        <ScanDetailModal
          scan={selectedScan}
          onClose={() => setSelectedScan(null)}
          t={t}
          i18n={i18n}
        />
      )}
    </div>
  );
}

const StatCard = ({ title, value, icon, colorClass, fullValue }) => (
  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorClass} transition-transform group-hover:scale-110`}>
        {icon}
      </div>
      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-green-50 group-hover:text-green-600 transition-colors cursor-pointer">
        <ArrowUpRight className="w-4 h-4" />
      </div>
    </div>
    <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
    <p
      className="text-2xl font-extrabold text-gray-900 tracking-tight leading-tight line-clamp-2 break-words"
      title={fullValue || value}
    >{value}</p>

    {/* Subtle decorative glow */}
    <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 ${colorClass}`}></div>
  </div>
);

/* ================= SCAN DETAIL MODAL ================= */
const ScanDetailModal = ({ scan, onClose, t, i18n }) => {
  // Use authoritative status field; fall back to keyword detection for old records
  const getStatus = () => {
    if (scan.status === 'Healthy' || scan.status === 'Infected' || scan.status === 'Unknown') return scan.status;
    const d = (scan.disease || '').toLowerCase();
    if (d.includes('healthy') || d.includes('स्वस्थ') || d.includes('निरोगी')) return 'Healthy';
    if (d.includes('not identifiable') || d.includes('undetermined') || d.includes('insufficient') || d.includes('cannot')) return 'Unknown';
    return 'Infected';
  };
  const status = getStatus();
  const isHealthy = status === 'Healthy';
  const isUnknown = status === 'Unknown';
  const isInfected = status === 'Infected';

  const confidence = Math.round(scan.confidence * 100);
  const formattedDate = new Date(scan.date).toLocaleDateString(
    i18n.language === 'hi' ? 'hi-IN' : i18n.language === 'mr' ? 'mr-IN' : 'en-US',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  );

  const headerBg = isHealthy ? 'bg-emerald-50' : isUnknown ? 'bg-yellow-50' : 'bg-amber-50';
  const badgeCls = isHealthy ? 'bg-emerald-100 text-emerald-700' : isUnknown ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
  const badgeLabel = isHealthy ? t('dashboard.healthy') : isUnknown ? t('dashboard.unknownStatus') : t('dashboard.infected');
  const barColor = isHealthy ? 'bg-emerald-500' : isUnknown ? 'bg-yellow-400' : 'bg-red-400';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 rounded-t-3xl ${headerBg}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${badgeCls}`}>
                {badgeLabel}
              </span>
              <h2 className="text-xl font-bold text-gray-900 mt-3">
                {isHealthy ? t('dashboard.noDisease') : isUnknown ? t('dashboard.undetermined') : scan.disease}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{formattedDate}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white shadow hover:bg-gray-100 transition flex-shrink-0"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Image + Confidence */}
          <div className="flex gap-4 items-start">
            {scan.imageUrl && (
              <img
                src={scan.imageUrl}
                alt="scan"
                className="w-24 h-24 rounded-2xl object-cover border border-gray-100 shadow-sm flex-shrink-0"
              />
            )}
            <div className="flex-1">
              <p className="text-sm text-gray-500 font-medium mb-2">{t('dashboard.confidence')}</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                    style={{ width: `${confidence}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-700">{confidence}%</span>
              </div>
              {scan.crop && scan.crop !== 'Unknown' && (
                <p className="mt-3 text-sm text-gray-500">
                  <span className="font-semibold text-gray-700">{t('dashboard.crop')}:</span> {scan.crop}
                </p>
              )}
            </div>
          </div>

          {/* AI Explanation */}
          {scan.explanation && (
            <div className={`rounded-2xl p-4 ${isHealthy ? 'bg-emerald-50' : isUnknown ? 'bg-yellow-50' : 'bg-blue-50'}`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${isHealthy ? 'text-emerald-600' : isUnknown ? 'text-yellow-600' : 'text-blue-500'
                }`}>{t('dashboard.aiExplanation')}</p>
              <p className="text-sm text-gray-700 leading-relaxed">{scan.explanation}</p>
            </div>
          )}

          {/* Treatment sections (only for Infected) */}
          {isInfected && scan.treatment && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-2">
                {t('dashboard.treatmentRecommendation')}
              </h3>
              {scan.treatment.chemical && (
                <div className="bg-blue-50 rounded-2xl p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-1">{t('scan.chemicalControl')}</p>
                  <p className="font-semibold text-gray-800">{scan.treatment.chemical.name}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{t('scan.dose')}: {scan.treatment.chemical.dose}</p>
                </div>
              )}
              {scan.treatment.organic && (
                <div className="bg-green-50 rounded-2xl p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-green-600 mb-1">{t('scan.organicControl')}</p>
                  <p className="text-gray-800">{scan.treatment.organic}</p>
                </div>
              )}
              {scan.treatment.prevention && (
                <div className="bg-amber-50 rounded-2xl p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">{t('scan.prevention')}</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{scan.treatment.prevention}</p>
                </div>
              )}
              {scan.treatment.message && (
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-sm text-gray-700 leading-relaxed">{scan.treatment.message}</p>
                </div>
              )}
            </div>
          )}

          {/* Healthy card */}
          {isHealthy && !scan.explanation && (
            <div className="bg-emerald-50 rounded-2xl p-5 text-center">
              <p className="text-2xl mb-2">🌾</p>
              <p className="text-emerald-700 font-semibold">{t('scan.cropHealthy')}</p>
            </div>
          )}

          {/* Unknown card */}
          {isUnknown && !scan.explanation && (
            <div className="bg-yellow-50 rounded-2xl p-5 text-center">
              <p className="text-2xl mb-2">⚠️</p>
              <p className="text-yellow-700 font-semibold">{t('dashboard.unknownHelpText')}</p>
            </div>
          )}

          {isInfected && !scan.treatment && !scan.explanation && (
            <p className="text-gray-500 italic text-sm text-center">{t('scan.noTreatment')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

