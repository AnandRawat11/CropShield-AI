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
import PremiumModal from "@/components/PremiumModal";
// Assuming you have these images or we just use URLs/placeholders if they aren't working.
import leafSpotImg from "../assets/img/leaf_spot.jpg";
import rootRotImg from "../assets/img/root_rot.jpg";
import tomatoBlightImg from "../assets/img/tomato_blight.jpg";

const PIE_COLORS = ['#22c55e', '#10b981', '#059669', '#047857', '#064e3b'];

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [scans, setScans] = useState([]);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

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
        <span className="ml-3 font-medium">Loading Dashboard...</span>
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
    if (!data.length) return "None";
    const counts = {};
    data.forEach((s) => {
      const name = s.disease || "Unknown";
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b));
  };

  /* ================= COMPUTED VALUES ================= */
  const totalScans = scans.length;
  const avgConfidence = calculateAvgConfidence(scans);
  const mostCommonDisease = getMostCommonDisease(scans);
  const diseasesDetected = new Set(scans.map(s => s.disease)).size;

  // Chart Data
  const trendData = [
    { name: 'Mon', scans: 10 },
    { name: 'Tue', scans: 25 },
    { name: 'Wed', scans: 28 },
    { name: 'Thu', scans: 55 },
    { name: 'Fri', scans: 48 },
    { name: 'Sat', scans: 42 },
    { name: 'Sun', scans: 35 },
  ];

  const diseaseDistribution = [
    { name: 'Tomato Blight', value: 45 },
    { name: 'Leaf Spot', value: 25 },
    { name: 'Root Rot', value: 20 },
    { name: 'Healthy', value: 10 },
  ];

  const cropAnalysis = [
    { name: 'Tomato', count: 120 },
    { name: 'Potato', count: 80 },
    { name: 'Corn', count: 50 },
    { name: 'Wheat', count: 30 },
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

    try {
      setLoading(true);

      const res = await API.post("/disease/detect", formData);
      const apiResult = res.data;

      const scanData = {
        imageUrl: apiResult.imageUrl || previewUrl,
        disease: apiResult.disease?.disease || "Unknown",
        confidence: apiResult.disease?.confidence || 0,
        severity: apiResult.disease?.severity || "Low",
        treatment: apiResult.treatment,
        is_plant: apiResult.disease?.disease !== "Not a Crop" && !apiResult.disease?.disease?.includes("Unknown")
      };

      setScanResult(scanData);

      const newScan = {
        _id: Date.now(),
        imageUrl: scanData.imageUrl,
        disease: scanData.disease,
        confidence: scanData.confidence,
        severity: scanData.severity,
        date: new Date().toISOString(),
        crop: "Unknown",
        status: scanData.disease === "Healthy" ? "Healthy" : "Infected"
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">
            CropShield AI
          </span>
        </div>

        <div className="flex items-center gap-6">
          <button className="text-gray-500 hover:text-green-600 transition flex items-center gap-1 text-sm font-medium">
            <Globe className="w-4 h-4" />
            <span>EN</span>
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
                <p className="text-xs text-gray-500">{user.plan} Plan</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right scale-95 group-hover:scale-100">
              <div className="p-2">
                <div className="px-4 py-2 border-b border-gray-50 mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Account</p>
                </div>
                {user.plan !== "PREMIUM" && (
                  <button onClick={() => setShowPremium(true)} className="w-full text-left px-4 py-2 text-sm text-green-600 font-medium hover:bg-green-50 rounded-lg transition flex items-center gap-2">
                    <Zap className="w-4 h-4" /> Upgrade Plan
                  </button>
                )}
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition flex items-center gap-2">
                  <LogOut className="w-4 h-4" /> Logout
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
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-500 text-sm mt-1">Track your crop health and recent AI scans.</p>
          </div>
          {user.plan !== "PREMIUM" && (
            <div className="bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm flex items-center gap-3 text-sm">
              <span className="text-gray-600">Scans Remaining:</span>
              <span className="font-bold text-gray-900">{user.remainingScans}</span>
              <button
                onClick={() => setShowPremium(true)}
                className="text-green-600 font-semibold hover:underline"
              >
                Get Unlimited
              </button>
            </div>
          )}
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard
            title="Total Uploads"
            value={totalScans}
            icon={<Upload className="w-6 h-6 text-green-600" />}
            colorClass="bg-green-100"
          />
          <StatCard
            title="Diseases Detected"
            value={diseasesDetected}
            icon={<Activity className="w-6 h-6 text-blue-600" />}
            colorClass="bg-blue-100"
          />
          <StatCard
            title="Most Frequent Disease"
            value={mostCommonDisease}
            icon={<AlertTriangle className="w-6 h-6 text-amber-600" />}
            colorClass="bg-amber-100"
          />
          <StatCard
            title="Avg. Confidence Score"
            value={avgConfidence > 0 ? `${avgConfidence}%` : "N/A"}
            icon={<ShieldCheck className="w-6 h-6 text-emerald-600" />}
            colorClass="bg-emerald-100"
          />
        </section>

        {/* ================= MAIN ACTION SECTION (IMAGE UPLOAD) ================= */}
        <section className="mb-10 bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex flex-col lg:flex-row gap-8 items-start">

            {/* Upload Area */}
            <div className="w-full lg:w-1/2 flex flex-col">
              <h2 className="text-xl font-bold text-gray-900 mb-2">New Disease Scan</h2>
              <p className="text-gray-500 text-sm mb-6">Upload a clear picture of the infected crop leaf for AI analysis.</p>

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
                        Remove
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-green-600 rounded-full hover:bg-green-700 transition disabled:opacity-70 shadow-lg shadow-green-500/30"
                      >
                        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><ScanSearch className="w-4 h-4" /> Scan with AI</>}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                      <FileImage className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Drag & drop your image here</h3>
                    <p className="text-sm text-gray-500 mt-2 mb-6">or click to browse from your computer</p>
                    <div className="px-6 py-2.5 bg-white text-gray-800 font-medium text-sm rounded-full border border-gray-200 shadow-sm pointer-events-none">
                      Select File
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
                  <h3 className="mt-6 text-lg font-semibold text-gray-800">AI is analyzing the image</h3>
                  <p className="text-sm text-gray-500 mt-2">Running through deep learning models...</p>
                </div>
              ) : scanResult ? (
                <div className="h-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                  {scanResult.confidence < 0.4 || !scanResult.is_plant ? (
                    <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Quality Error</h3>
                      <p className="text-gray-600 max-w-sm">
                        The AI could not confidently identify this image. Please ensure you upload a clear, well-lit photo of a crop leaf.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Result Header */}
                      <div className="bg-green-50/80 p-6 border-b border-green-100 flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-green-700 uppercase tracking-wider mb-1">Analysis Complete</p>
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
                            <Activity className="w-4 h-4" /> Risk Level
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                            ${scanResult.severity === 'High' ? 'bg-red-100 text-red-700' :
                              scanResult.severity === 'Medium' ? 'bg-amber-100 text-amber-700' :
                                'bg-emerald-100 text-emerald-700'}`}>
                            {scanResult.severity} Risk
                          </span>
                        </div>

                        <div className="flex-1 rounded-xl bg-blue-50/50 border border-blue-100 p-5">
                          <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2 mb-2">
                            <Info className="w-4 h-4 text-blue-600" /> Treatment Recommendation
                          </h4>
                          <p className="text-sm text-blue-800 leading-relaxed">
                            {scanResult.treatment?.message || scanResult.treatment || "No specific treatment data available for this condition."}
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
                  <h3 className="text-lg font-semibold text-gray-800">Ready for Analysis</h3>
                  <p className="text-sm text-gray-500 mt-2 max-w-sm">Upload an image and hit scan to see detailed disease information and treatment recommendations right here.</p>
                </div>
              )}
            </div>

          </div>
        </section>

        {/* ================= ANALYTICS SECTION ================= */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">

          {/* Line Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Detections Over Time</h3>
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
            <h3 className="text-lg font-bold text-gray-900 mb-2">Disease Distribution</h3>
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
            <h3 className="text-lg font-bold text-gray-900 mb-2">Crop-wise Analysis</h3>
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
            <h3 className="text-lg font-bold text-gray-900">Prediction History</h3>

            <div className="flex gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:min-w-[250px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search disease or crop..."
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
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Crop</th>
                  <th className="px-6 py-4 font-semibold">Predicted Disease</th>
                  <th className="px-6 py-4 font-semibold">Confidence</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredScans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                        <ScanSearch className="w-10 h-10" />
                        <p className="font-semibold text-gray-500">No scans yet</p>
                        <p className="text-sm">Upload a crop image above to get your first AI scan result.</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredScans.map((scan, i) => (
                  <tr key={scan._id || i} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4">
                      {new Date(scan.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {scan.crop || "Unknown"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Leaf className={`w-4 h-4 ${scan.disease === 'Healthy' ? 'text-emerald-500' : 'text-amber-500'}`} />
                        {scan.disease}
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
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                        ${scan.status === 'Healthy' || scan.disease === 'Healthy' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {scan.status || (scan.disease === 'Healthy' ? 'Healthy' : 'Infected')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-green-600 font-semibold hover:underline flex items-center justify-end gap-1 text-sm ml-auto">
                        Details <ChevronRight className="w-4 h-4" />
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
    </div>
  );
}

/* ================= SUBCOMPONENTS ================= */
const StatCard = ({ title, value, icon, colorClass }) => (
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
    <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{value}</p>

    {/* Subtle decorative glow */}
    <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 ${colorClass}`}></div>
  </div>
);
