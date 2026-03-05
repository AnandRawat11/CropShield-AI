import { useState, useEffect, useRef } from "react";
import { detectDisease } from "../services/api";
import { useTranslation } from "react-i18next";
import { NavLink, Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import {
    LayoutDashboard, Map, History, Settings, LogOut,
    Search, Bell, Plus, Upload, Camera, FileText,
    Leaf, CheckCircle2, AlertTriangle, Clock, TrendingUp, Info, Shield, Droplets, Droplet, Stethoscope, Loader2, X, CloudSun, Users, Image, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── helpers ─── */
const CONFIDENCE_COLOR = (c) =>
    c >= 0.75 ? "bg-[#166534]" : c >= 0.4 ? "bg-amber-500" : "bg-red-500";

const STATUS_META = (status) => {
    if (status === "Healthy") return { badge: "bg-[#DCFCE7] text-[#166534]", label: "Healthy" };
    if (status === "Unknown") return { badge: "bg-[#FEF3C7] text-[#D97706]", label: "Unknown Risk" };
    return { badge: "bg-[#FEE2E2] text-[#EF4444]", label: "High Risk" };
};

/* ─── Accordion Section ─── */
function AccordionSection({ icon: Icon, title, children, defaultOpen = false, iconColor = "text-[#166534]" }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className={`border border-gray-100 rounded-2xl overflow-hidden transition-colors ${open ? "bg-[#F9FAFB]" : "bg-white hover:bg-gray-50"}`}>
            <button
                onClick={() => setOpen((p) => !p)}
                className="w-full p-5 flex justify-between items-center focus:outline-none"
                aria-expanded={open}
            >
                <span className="font-bold flex items-center gap-3 text-sm text-slate-800">
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                    {title}
                </span>
                <svg className={`w-5 h-5 text-gray-400 transform transition-transform duration-300 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"></path></svg>
            </button>
            {open && children && (
                <div className="px-5 pb-5 pt-0 text-gray-500 leading-relaxed text-sm">
                    {children}
                </div>
            )}
        </div>
    );
}


/* ─── DESKTOP SIDEBAR ─── */
function DesktopSidebar({ onLogout, user }) {
    return (
        <aside className="hidden lg:flex fixed left-0 top-14 h-[calc(100vh-56px)] bg-white/70 backdrop-blur-xl border-r border-white/50 shadow-none flex-col z-40 transition-all duration-300 w-[64px] hover:w-[240px] overflow-hidden group">
            <nav className="flex-1 px-3 mt-6 space-y-2">
                <NavLink to="/scan" className={({ isActive }) => `flex items-center gap-4 p-2.5 rounded-full transition-colors whitespace-nowrap overflow-hidden ${isActive ? "bg-[#ECFDF5] text-[#166534]" : "text-gray-500 hover:bg-white/50"}`}>
                    <LayoutDashboard className="w-5 h-5 shrink-0" />
                    <span className="font-medium opacity-0 group-hover:opacity-100 transition-opacity text-sm">Scan</span>
                </NavLink>
                <NavLink to="/dashboard?tab=map" className={({ isActive }) => `flex items-center gap-4 p-2.5 rounded-full transition-colors whitespace-nowrap overflow-hidden ${isActive ? "bg-[#ECFDF5] text-[#166534]" : "text-gray-500 hover:bg-white/50"}`}>
                    <Map className="w-5 h-5 shrink-0" />
                    <span className="font-medium opacity-0 group-hover:opacity-100 transition-opacity text-sm">Fields</span>
                </NavLink>
                <NavLink to="/dashboard?tab=history" className={({ isActive }) => `flex items-center gap-4 p-2.5 rounded-full transition-colors whitespace-nowrap overflow-hidden ${isActive ? "bg-[#ECFDF5] text-[#166534]" : "text-gray-500 hover:bg-white/50"}`}>
                    <History className="w-5 h-5 shrink-0" />
                    <span className="font-medium opacity-0 group-hover:opacity-100 transition-opacity text-sm">History</span>
                </NavLink>
                <NavLink to="/dashboard" end className={({ isActive }) => `flex items-center gap-4 p-2.5 rounded-full transition-colors whitespace-nowrap overflow-hidden ${isActive ? "bg-[#ECFDF5] text-[#166534]" : "text-gray-500 hover:bg-white/50"}`}>
                    <Settings className="w-5 h-5 shrink-0" />
                    <span className="font-medium opacity-0 group-hover:opacity-100 transition-opacity text-sm">Dashboard</span>
                </NavLink>
            </nav>

            {/* Profile Desktop */}
            <div className="p-3 border-t border-white/30 mt-auto mb-2">
                <div className="flex items-center gap-3 p-1.5 bg-white/50 backdrop-blur-md rounded-xl overflow-hidden cursor-pointer w-[40px] group-hover:w-full transition-all duration-300 mx-auto group-hover:mx-0 shadow-sm" onClick={onLogout}>
                    <div className="w-7 h-7 rounded-full shrink-0 bg-[#166534]/10 flex items-center justify-center text-[#166534] font-bold text-xs">
                        {user?.name?.charAt(0).toUpperCase() ?? "?"}
                    </div>
                    <div className="overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        <p className="text-sm font-semibold truncate text-slate-800">{user?.name ?? "User"}</p>
                        <p className="text-[10px] text-gray-500">Premium Plan (Logout)</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}


/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function ScanCrop() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState("");
    const [error, setError] = useState("");
    const [profileOpen, setProfileOpen] = useState(false);

    // Weather state
    const [weather, setWeather] = useState({ temp: "--", desc: "Loading...", icon: "🌤️" });

    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    // Live Camera state
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    /* ── Live Camera Functions ── */
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            });
            streamRef.current = stream;
            setIsCameraOpen(true);
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
            }, 100);
        } catch (err) {
            console.error("Camera access denied or unavailable", err);
            setError("Camera access denied or unvailable. Check permissions.");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraOpen(false);
    };

    const captureImage = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
                    stopCamera();

                    // Directly handle the file to trigger auto-analysis just like standard uploads
                    if (typeof handleFile === "function") {
                        handleFile(file);
                    } else {
                        setImage(file);
                        setPreview(URL.createObjectURL(file));
                        setResult(null);
                        setError("");
                        // Fallback submit call if handleFile scope isn't hoisted
                        if (typeof submitImage === "function") submitImage(file);
                    }
                }
            }, "image/jpeg", 0.9);
        }
    };

    /* ── Weather Fetch ── */
    useEffect(() => {
        const fetchWeather = async (lat, lon) => {
            try {
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
                const data = await res.json();
                if (data.current_weather) {
                    const temp = Math.round(data.current_weather.temperature);
                    const code = data.current_weather.weathercode;
                    let icon = "🌤️"; let desc = "Clear";
                    if (code === 0) { icon = "☀️"; desc = "Clear sky"; }
                    else if (code <= 3) { icon = "⛅"; desc = "Partly cloudy"; }
                    else if (code <= 49) { icon = "🌫️"; desc = "Foggy"; }
                    else if (code <= 69) { icon = "🌧️"; desc = "Rainy"; }
                    else if (code <= 79) { icon = "🌨️"; desc = "Snowy"; }
                    else if (code <= 99) { icon = "⛈️"; desc = "Storm"; }
                    setWeather({ temp: `${temp}°C`, desc, icon });
                }
            } catch (err) {
                setWeather({ temp: "--", desc: "Unavailable", icon: "☁️" });
            }
        };

        const fetchByIP = async () => {
            try {
                const res = await fetch('https://ipapi.co/json/');
                const data = await res.json();
                if (data.latitude && data.longitude) {
                    await fetchWeather(data.latitude, data.longitude);
                } else {
                    setWeather({ temp: "--", desc: "No GPS", icon: "☁️" });
                }
            } catch (err) {
                setWeather({ temp: "--", desc: "No GPS", icon: "☁️" });
            }
        };

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
                (err) => fetchByIP(),
                { timeout: 5000, enableHighAccuracy: false }
            );
        } else {
            fetchByIP();
        }
    }, []);

    /* Auth */
    useEffect(() => {
        API.get("/auth/me")
            .then((r) => setUser(r.data))
            .catch(() => { localStorage.clear(); navigate("/login"); });
    }, [navigate]);

    /* Cleanup blob URL */
    useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

    /* ── File handlers ── */
    const handleFile = (file) => {
        if (!file || !file.type.startsWith("image/")) return;
        setImage(file);
        setPreview(URL.createObjectURL(file));
        setResult(null);
        setError("");
        // Auto-submit immediately per design flow:
        submitImage(file);
    };

    const submitImage = async (fileToUpload) => {
        const formData = new FormData();
        formData.append("image", fileToUpload);
        formData.append("lang", i18n.language);

        setLoading(true);
        setLoadingMsg(t("scan.analyzing", "Analyzing…"));
        setError(""); setResult(null);

        const msgTimer = setInterval(() => {
            setLoadingMsg((prev) => {
                if (prev === t("scan.analyzing")) return "Warming up AI model…";
                if (prev === "Warming up AI model…") return "Almost done…";
                return prev;
            });
        }, 8000);

        try {
            const res = await detectDisease(formData);
            setResult(res.data);
        } catch (err) {
            const msg = err.response?.data?.error || err.message || "";
            setError(
                msg.includes("cold-start") || msg.includes("AI API did not become")
                    ? t("scan.coldStartError", "AI server is warming up. Please retry in 30 seconds.")
                    : msg || t("scan.genericError", "Scan failed. Please try again.")
            );
        } finally {
            clearInterval(msgTimer);
            setLoading(false);
            setLoadingMsg("");
        }
    }


    const handleInputChange = (e) => handleFile(e.target.files[0]);
    const handleDrop = (e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); };
    const handleDragOver = (e) => { e.preventDefault(); };


    const logout = () => { localStorage.clear(); navigate("/login"); };

    /* Derived result values */
    const isQualityError =
        !result?.disease ||
        result.disease.confidence < 0.15 ||
        result.disease.disease === "Not a Crop" ||
        result.disease.disease === "Unknown / Unclear" ||
        result.disease.disease?.startsWith("Not a Plant");

    const confidence = result ? Math.round((result.disease?.confidence ?? result.confidence ?? 0) * 100) : 0;
    const diseaseName = result?.disease?.disease ?? result?.disease ?? "—";
    const status = result?.status ?? (result?.disease?.severity === "None" ? "Healthy" : result?.disease?.severity ? "Infected" : null);
    const explanation = result?.explanation ?? result?.disease?.explanation ?? null;
    const treatment = result?.treatment ?? result?.disease?.treatment ?? null;
    const statusMeta = status ? STATUS_META(status) : null;


    /* ════ RENDER ════ */
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#e8f5e9] to-[#f7fbf7] text-slate-800 font-sans relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* Landing-Page style soft background glow */}
            <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-green-400/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
            <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-emerald-400/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

            {/* Global Hidden Inputs for File/Camera */}
            <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleInputChange} />
            <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleInputChange} />

            <DesktopSidebar onLogout={logout} user={user} />

            {/* ── MOBILE HEADER (Hidden on LG) ── */}
            <div className="lg:hidden">
                <header className="flex items-center justify-between p-3.5 bg-transparent border-b border-white/20">
                    <div className="flex items-center gap-2.5">
                        <img src="/logo.png" alt="CropShield AI" className="h-7 w-auto object-contain" />
                        <div>
                            <h1 className="font-bold text-[17px] leading-none text-slate-900 tracking-tight">CropShield AI</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Bell className="w-5 h-5 text-slate-600" />
                            <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-blue-500 rounded-full border border-white"></div>
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setProfileOpen(!profileOpen)}
                                className="w-8 h-8 rounded-full bg-[#D1FAE5] border border-white shadow-sm flex items-center justify-center text-[#166534] font-bold text-xs"
                            >
                                {user?.name?.charAt(0).toUpperCase() ?? "?"}
                            </button>

                            <AnimatePresence>
                                {profileOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                        transition={{ duration: 0.15, ease: "easeOut" }}
                                        className="absolute top-10 right-0 mt-2 w-40 bg-white/95 backdrop-blur-xl border border-gray-100 shadow-xl rounded-xl p-2 z-[70]"
                                    >
                                        <button
                                            onClick={logout}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sign Out
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                <main className="px-5 space-y-5 pb-24">
                    {/* Mobile Title & Weather Block */}
                    <div className="flex flex-row items-center justify-between gap-3 pt-1">
                        <div className="flex-1">
                            <h2 className="text-[22px] sm:text-[24px] font-black text-slate-900 tracking-tight leading-tight">AI Crop Diagnosis</h2>
                            <p className="text-gray-500 text-[12px] sm:text-[13px] mt-1 leading-snug">Real-time detection & recommendations</p>
                        </div>
                        <div className="flex items-center gap-2.5 px-3 py-2 bg-white/80 backdrop-blur-md rounded-[18px] border border-white/60 shadow-sm shrink-0">
                            <span className="text-2xl">{weather.icon}</span>
                            <div className="leading-tight">
                                <p className="text-[14px] font-bold text-slate-800">{weather.temp}</p>
                                <p className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">{weather.desc}</p>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Input Card */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-4">
                            <Camera className="w-5 h-5 text-[#22C55E]" />
                            <h2 className="font-bold text-lg">New Diagnosis</h2>
                        </div>

                        {/* Drop Zone Mobile */}
                        <div
                            className="border-2 border-dashed border-[#E5E7EB] rounded-2xl py-12 flex flex-col items-center justify-center bg-[#F9FAFB] mb-6 relative overflow-hidden cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {preview ? (
                                <div className="absolute inset-0">
                                    <img src={preview} className="w-full h-full object-cover opacity-60" />
                                    {loading && <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm"><Loader2 className="w-8 h-8 animate-spin text-[#166534]" /></div>}
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-12 h-12 text-gray-400 mb-3" />
                                    <p className="font-semibold text-[#374151]">Tap to select photo</p>
                                    <p className="text-xs text-gray-400 mt-1">Supports JPG, PNG (Max 10MB)</p>
                                </>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={image ? () => fileInputRef.current?.click() : () => fileInputRef.current?.click()} className="bg-[#166534] text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#14532D] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                                <Upload className="w-4 h-4" /> Upload
                            </button>
                            <button onClick={startCamera} className="bg-white text-[#166534] border border-[#166534] py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all duration-300">
                                <Camera className="w-4 h-4" /> Camera
                            </button>
                        </div>
                    </section>

                    {/* Farmer Tip Mobile */}
                    <section className="bg-[#ECFDF5] border border-[#DCFCE7] p-4 rounded-2xl flex gap-3">
                        <div className="bg-white rounded-full p-1 w-6 h-6 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                        </div>
                        <p className="text-[13px] text-[#065F46] leading-relaxed">
                            <span className="font-bold">Farmer Tip:</span> Ensure the photo is taken in natural daylight and the affected area is clearly focused for 99% accuracy.
                        </p>
                    </section>

                    {error && (
                        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl text-red-600 text-sm">{error}</div>
                    )}

                    {/* Mobile Results Bottom Sheet */}
                    <AnimatePresence>
                        {result && !isQualityError && (
                            <>
                                {/* Overlay Drawer */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => {/* user can swipe or click out to close, but let's keep it persistent here till new scan */ }}
                                    className="lg:hidden fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col justify-end"
                                >
                                    <motion.div
                                        initial={{ y: "100%" }}
                                        animate={{ y: 0 }}
                                        exit={{ y: "100%" }}
                                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                        className="bg-white rounded-t-[32px] p-6 pb-safe max-h-[85vh] overflow-y-auto"
                                    >
                                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>

                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="w-5 h-5 text-[#22C55E]" />
                                                <h2 className="font-bold text-lg">Analysis Result</h2>
                                            </div>
                                            {statusMeta && <span className={`${statusMeta.badge} text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-tight`}>{statusMeta.label}</span>}
                                        </div>

                                        <div className="relative pt-2">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-3xl font-black text-slate-800">{confidence}%</span>
                                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest pb-1">Confidence</span>
                                            </div>
                                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                                <div className={`h-full ${CONFIDENCE_COLOR(confidence / 100)}`} style={{ width: `${confidence}%` }}></div>
                                            </div>
                                        </div>

                                        <div className="mt-8 space-y-3">
                                            <AccordionSection icon={Info} iconColor="text-blue-500" title={diseaseName} defaultOpen>
                                                {explanation || "Disease detected."}
                                            </AccordionSection>

                                            {treatment && status !== "Healthy" && (
                                                <AccordionSection icon={Droplet} iconColor="text-[#22C55E]" title="Recommended Treatment">
                                                    <div className="space-y-3 pt-2">
                                                        {treatment.chemical && (
                                                            <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100/50">
                                                                <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-1">Chemical Control</p>
                                                                <p className="font-semibold text-slate-800 text-sm">{treatment.chemical.name}</p>
                                                                <p className="text-xs text-slate-500 mt-0.5">Dose: {treatment.chemical.dose}</p>
                                                            </div>
                                                        )}
                                                        {treatment.organic && (
                                                            <div className="bg-green-50/50 rounded-xl p-3 border border-green-100/50">
                                                                <p className="text-[11px] font-bold text-green-700 uppercase tracking-wider mb-1">Organic Option</p>
                                                                <p className="text-slate-700 text-sm">{treatment.organic}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </AccordionSection>
                                            )}

                                            {treatment?.prevention && (
                                                <AccordionSection icon={Shield} iconColor="text-slate-700" title="Future Prevention">
                                                    {treatment.prevention}
                                                </AccordionSection>
                                            )}
                                        </div>

                                        <button className="w-full mt-6 bg-[#0F172A] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
                                            <FileText className="w-4 h-4" /> Save Report to History
                                        </button>
                                        <button onClick={() => { /* Quick reset for new scan */ window.location.reload() }} className="w-full mt-3 bg-white text-slate-500 py-3 rounded-xl font-bold border-2 border-slate-100 flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
                                            <X className="w-4 h-4" /> Close & Scan Again
                                        </button>
                                    </motion.div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>

                    {/* Mobile Bottom Stats */}
                    <section className="grid grid-cols-2 gap-3 pb-8">
                        <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white/60 flex flex-col gap-2">
                            <div className="bg-[#F0FDF4] p-2 rounded-xl w-fit"><CheckCircle2 className="w-5 h-5 text-[#22C55E]" /></div>
                            <div>
                                <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Health Status</p>
                                <p className="text-lg font-bold">{result && !isQualityError ? `${confidence}%` : "88%"} {status === "Healthy" ? "Healthy" : ""}</p>
                            </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white/60 flex flex-col gap-2">
                            <div className="bg-[#FFF7ED] p-2 rounded-xl w-fit"><AlertTriangle className="w-5 h-5 text-[#F97316]" /></div>
                            <div>
                                <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Top Threat</p>
                                <p className="text-lg font-bold truncate">{result && !isQualityError ? diseaseName.split(" ")[0] : "None Detected"}</p>
                            </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white/60 flex flex-col gap-2">
                            <div className="bg-[#EFF6FF] p-2 rounded-xl w-fit"><Clock className="w-5 h-5 text-[#3B82F6]" /></div>
                            <div>
                                <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Last Scan</p>
                                <p className="text-lg font-bold">{result ? "Just now" : "2h ago"}</p>
                            </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white/60 flex flex-col gap-2">
                            <div className="bg-[#FEF2F2] p-2 rounded-xl w-fit"><Shield className="w-5 h-5 text-red-500" /></div>
                            <div>
                                <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Field Risk</p>
                                <p className="text-lg font-bold truncate">{status === "Infected" ? "High" : status === "Healthy" ? "Low" : "Secured"}</p>
                            </div>
                        </div>
                    </section>
                </main>
            </div>

            {/* ── DESKTOP TOP HEADER (Fixed Full Width) ── */}
            <div className="hidden lg:block fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 h-14 shadow-sm">
                <header className="h-full px-8 flex items-center justify-between">
                    <div className="flex-1 max-w-xl flex items-center h-full">
                        <Link to="/" className="flex items-center gap-2.5 text-lg font-black text-slate-900 tracking-tight hover:text-[#166534] transition-colors">
                            <img src="/logo.png" alt="CropShield AI" className="h-6 w-auto object-contain" />
                            CropShield AI
                        </Link>
                    </div>
                    <div className="flex items-center gap-6 h-full">
                        {/* Weather Sync Block */}
                        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white/60 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm">
                            <span className="text-lg">{weather.icon}</span>
                            <div className="leading-tight">
                                <p className="text-[11px] font-bold text-slate-800">{weather.temp}</p>
                                <p className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">{weather.desc}</p>
                            </div>
                        </div>

                        <div className="relative cursor-pointer flex items-center">
                            <Bell className="w-4 h-4 text-slate-500 hover:text-slate-800 transition-colors" />
                            <div className="absolute top-0 -right-0.5 w-1.5 h-1.5 bg-[#EF4444] rounded-full border border-white"></div>
                        </div>
                        <button onClick={() => fileInputRef.current?.click()} className="bg-[#166534] text-white px-3 py-1.5 rounded-xl font-semibold text-[13px] flex items-center gap-2 shadow-sm hover:bg-[#14532D] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 active:scale-95">
                            <Plus className="w-4 h-4" /> New Scan
                        </button>
                    </div>
                </header>
            </div>

            {/* ── DESKTOP CONTENT WRAPPER ── */}
            <div className="hidden lg:flex lg:flex-col lg:ml-[64px] mt-14 min-h-[calc(100vh-56px)] relative z-10">

                <main className="p-8 max-w-[1400px] mx-auto w-full space-y-8 flex-1">
                    {/* Title Section */}
                    <div>
                        <h2 className="text-3xl font-black text-slate-900">AI Crop Diagnosis</h2>
                        <p className="text-gray-500 mt-1">Real-time disease detection and treatment recommendations for your plantation.</p>
                    </div>

                    {/* Two-Column Equal Height Flex */}
                    <div className="flex flex-col lg:flex-row gap-8 items-stretch">

                        {/* ════ LEFT: Image Input ════ */}
                        <section className="flex-1 bg-white/80 backdrop-blur-xl rounded-[24px] p-8 shadow-sm border border-white/60 flex flex-col justify-between h-auto">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="bg-[#ECFDF5] p-2 rounded-lg">
                                        <Camera className="w-5 h-5 text-[#166534]" />
                                    </div>
                                    <h3 className="font-bold text-xl">Crop Image Input</h3>
                                </div>
                                <span className="text-xs text-gray-400 font-medium">Supported: JPG, PNG</span>
                            </div>

                            <div className="flex-1 flex flex-col items-stretch relative">
                                {isCameraOpen ? (
                                    /* HIGH-TECH AI CAMERA HUD (Desktop Inline / Mobile Fullscreen via global modal later) */
                                    <div className="flex-1 relative bg-slate-900 rounded-2xl overflow-hidden min-h-[400px] flex flex-col group">
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />

                                        {/* Close Button Top-Right */}
                                        <button onClick={stopCamera} className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 text-white hover:bg-white/20 transition-colors">
                                            <X className="w-5 h-5 shadow-sm" />
                                        </button>

                                        {/* Status Pill */}
                                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 z-10 border border-white/10">
                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                            <span className="text-[11px] font-bold tracking-widest uppercase text-white">Scanning for Pests...</span>
                                        </div>

                                        {/* Targeting Brackets & Laser */}
                                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                                            <div className="w-64 h-64 relative">
                                                <span className="absolute top-0 left-0 w-6 h-6 border-t-[2px] border-l-[2px] border-[#22C55E] -mt-1 -ml-1 animate-pulse"></span>
                                                <span className="absolute top-0 right-0 w-6 h-6 border-t-[2px] border-r-[2px] border-[#22C55E] -mt-1 -mr-1 animate-pulse"></span>
                                                <span className="absolute bottom-0 left-0 w-6 h-6 border-b-[2px] border-l-[2px] border-[#22C55E] -mb-1 -ml-1 animate-pulse"></span>
                                                <span className="absolute bottom-0 right-0 w-6 h-6 border-b-[2px] border-r-[2px] border-[#22C55E] -mb-1 -mr-1 animate-pulse"></span>
                                                {/* Laser Line */}
                                                <div className="absolute left-0 right-0 h-[1px] bg-[#22C55E] shadow-[0_0_8px_2px_rgba(34,197,94,0.6)] animate-laser"></div>
                                            </div>
                                        </div>

                                        {/* Live Metadata HUD */}
                                        <div className="absolute bottom-24 left-4 z-10 font-mono text-[10px] text-[#22C55E] opacity-80 flex flex-col gap-1 tracking-wider">
                                            <p>ISO: 400</p>
                                            <p>FOC: AUTO</p>
                                            <p>AI_CONF: 94.2%</p>
                                        </div>

                                        {/* Controls Bar */}
                                        <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-between items-center">
                                            <button className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 text-white hover:bg-white/30 transition-colors">
                                                <Zap className="w-5 h-5" />
                                            </button>

                                            <button
                                                onClick={captureImage}
                                                className="w-16 h-16 rounded-full border-[3px] border-white shadow-[0_0_15px_rgba(0,0,0,0.5)] flex items-center justify-center active:scale-95 transition-transform"
                                            >
                                                <div className="w-[52px] h-[52px] bg-white rounded-full"></div>
                                            </button>

                                            <button onClick={() => { stopCamera(); fileInputRef.current?.click(); }} className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 text-white hover:bg-white/30 transition-colors">
                                                <Image className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            onDrop={handleDrop}
                                            onDragOver={handleDragOver}
                                            className="flex-1 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center bg-[#F9FAFB] min-h-[340px] hover:border-[#166534]/30 transition-colors cursor-pointer group relative overflow-hidden"
                                        >
                                            {preview ? (
                                                <img src={preview} className="absolute inset-0 w-full h-full object-cover" alt="Preview" />
                                            ) : (
                                                <>
                                                    <div className="bg-white p-6 rounded-full shadow-sm mb-4 transition-transform group-hover:scale-110">
                                                        <Camera className="w-10 h-10 text-[#166534]" />
                                                    </div>
                                                    <p className="font-bold text-lg">Drag crop photo here</p>
                                                    <p className="text-gray-400 mt-1">or click to browse from device</p>
                                                </>
                                            )}
                                        </div>

                                        <div className="mt-8 space-y-4">
                                            {error && (
                                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                                                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                                    {error}
                                                </div>
                                            )}
                                            <div className="grid grid-cols-2 gap-4">
                                                <button
                                                    onClick={image ? () => fileInputRef.current?.click() : () => fileInputRef.current?.click()}
                                                    disabled={loading}
                                                    className="w-full bg-[#166534] disabled:bg-slate-300 text-white py-3 rounded-2xl font-semibold text-[15px] flex items-center justify-center gap-2 shadow-sm hover:bg-[#14532D] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
                                                >
                                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                                                    {loading ? "…" : "Upload"}
                                                </button>
                                                <button
                                                    onClick={startCamera}
                                                    disabled={loading}
                                                    className="w-full bg-white text-[#166534] border border-[#166534] py-3 rounded-2xl font-semibold text-[15px] flex items-center justify-center gap-2 hover:bg-slate-50 hover:shadow-sm transition-all duration-300 active:scale-95"
                                                >
                                                    <Camera className="w-5 h-5" />
                                                    Start AI Camera
                                                </button>
                                            </div>
                                            <p className="text-center text-[11px] text-gray-400 font-medium">AI model v4.2 calibrated for Maize, Wheat, and Soybeans</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </section>

                        {/* ════ RIGHT: Analysis Result ════ */}
                        <section className="flex-1 bg-white/80 backdrop-blur-xl rounded-[24px] p-8 shadow-sm border border-white/60 h-auto flex flex-col">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="bg-[#F0FDF4] p-2 rounded-lg">
                                        <TrendingUp className="w-5 h-5 text-[#166534]" />
                                    </div>
                                    <h3 className="font-bold text-xl">Diagnosis Result</h3>
                                </div>
                                {statusMeta && <span className={`${statusMeta.badge} text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider`}>{statusMeta.label}</span>}
                            </div>

                            {loading ? (
                                <div className="h-full min-h-[300px] flex flex-col items-center justify-center">
                                    <Loader2 className="w-12 h-12 text-[#166534] animate-spin mb-4" />
                                    <p className="text-gray-500 font-medium">{loadingMsg}</p>
                                </div>
                            ) : (!result || isQualityError) ? (
                                <div className="h-full min-h-[300px] flex flex-col items-center justify-center">
                                    <Shield className="w-16 h-16 text-gray-200 mb-4" />
                                    <p className="text-gray-500 font-medium">{isQualityError ? "Unclear image detected. Please try again." : "Upload an image to see results"}</p>
                                </div>
                            ) : (
                                <>
                                    {/* Result Main Header */}
                                    <div className="bg-white/40 border border-white/60 rounded-3xl p-6 mb-6 flex items-center gap-6">
                                        {preview && <img src={preview} className="w-24 h-24 rounded-2xl object-cover shadow-sm" alt="Thumbnail" />}
                                        <div className="flex-1">
                                            <h4 className="text-2xl font-black text-[#166534] leading-tight">
                                                {diseaseName} {result?.disease?.scientific && <span className="text-lg italic font-normal text-gray-500 block">({result.disease.scientific})</span>}
                                            </h4>

                                            <div className="flex items-center gap-4 mt-3">
                                                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Confidence: <span className="text-slate-900">{confidence}%</span></span>
                                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[200px]">
                                                    <div className={`h-full ${CONFIDENCE_COLOR(confidence / 100)}`} style={{ width: `${confidence}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Accordions Desktop */}
                                    <div className="space-y-3">
                                        <AccordionSection icon={Info} iconColor="text-gray-500" title="Explanation" defaultOpen>
                                            {explanation}
                                        </AccordionSection>

                                        {treatment && status !== "Healthy" && (
                                            <AccordionSection icon={Droplets} iconColor="text-gray-500" title="Recommended Treatment">
                                                <div className="space-y-3 pt-2">
                                                    {treatment.chemical && (
                                                        <div className="bg-white rounded-xl p-3 border border-gray-100">
                                                            <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Chemical Control</p>
                                                            <p className="font-semibold text-slate-800 text-sm">{treatment.chemical.name} <span className="text-gray-400 font-normal">({treatment.chemical.dose})</span></p>
                                                        </div>
                                                    )}
                                                    {treatment.organic && (
                                                        <div className="bg-white rounded-xl p-3 border border-gray-100">
                                                            <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Organic Option</p>
                                                            <p className="text-slate-700 text-sm">{treatment.organic}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </AccordionSection>
                                        )}

                                        {treatment?.prevention && (
                                            <AccordionSection icon={Shield} iconColor="text-gray-500" title="Prevention Strategy">
                                                {treatment.prevention}
                                            </AccordionSection>
                                        )}
                                    </div>
                                </>
                            )}
                        </section>
                    </div>

                    {/* Bottom Summary Cards Desktop (Minimalistic & Glass) */}
                    <section className="grid grid-cols-4 gap-6 pb-8">
                        <div className="bg-white/80 backdrop-blur-xl p-5 rounded-[20px] shadow-sm border border-white/60 flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="bg-[#F0FDF4] p-2.5 rounded-xl"><CheckCircle2 className="w-5 h-5 text-[#166534]" /></div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-0.5">Health Status</p>
                                <p className="text-xl font-black text-slate-800 line-clamp-1">{result && !isQualityError ? `${confidence}%` : "88%"} {status === "Healthy" ? "Healthy" : ""}</p>
                            </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-xl p-5 rounded-[20px] shadow-sm border border-white/60 flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="bg-[#FEF2F2] p-2.5 rounded-xl"><AlertTriangle className="w-5 h-5 text-[#EF4444]" /></div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-0.5">Top Threat</p>
                                <p className="text-xl font-black text-slate-800 line-clamp-1">{result && !isQualityError ? diseaseName.split(" ")[0] : "None Detected"}</p>
                            </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-xl p-5 rounded-[20px] shadow-sm border border-white/60 flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="bg-[#EFF6FF] p-2.5 rounded-xl"><Clock className="w-5 h-5 text-[#2563EB]" /></div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-0.5">Last Scan</p>
                                <p className="text-xl font-black text-slate-800 line-clamp-1">{result ? "Just now" : "2 hours ago"}</p>
                            </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-xl p-5 rounded-[20px] shadow-sm border border-white/60 flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="bg-[#FFF7ED] p-2.5 rounded-xl"><Info className="w-5 h-5 text-[#F97316]" /></div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-0.5">Field Risk</p>
                                <p className="text-xl font-black text-slate-800 line-clamp-1">{status === "Infected" ? "High" : status === "Healthy" ? "Low" : "Secured"}</p>
                            </div>
                        </div>
                    </section>

                </main>
            </div>

            {/* ── Live Camera Modal (Mobile Fullscreen) ── */}
            {isCameraOpen && (
                <div className="lg:hidden fixed inset-0 z-[999] bg-slate-900 flex flex-col">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* Close Button Top-Right */}
                    <button onClick={stopCamera} className="absolute top-6 right-6 z-20 w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 text-white hover:bg-white/20 transition-colors">
                        <X className="w-6 h-6 shadow-[0_0_10px_rgba(0,0,0,0.3)]" />
                    </button>

                    {/* HUD Status Pill */}
                    <div className="absolute top-safe mt-6 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-5 py-2 rounded-full flex items-center gap-2.5 z-10 border border-white/10 shadow-lg">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                        <span className="text-xs font-bold tracking-widest uppercase text-white">Scanning for Pests...</span>
                    </div>

                    {/* Targeting Brackets & Laser */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 pb-20">
                        <div className="w-64 h-64 sm:w-72 sm:h-72 relative">
                            <span className="absolute top-0 left-0 w-6 h-6 border-t-[2px] border-l-[2px] border-[#22C55E] -mt-1 -ml-1 animate-pulse"></span>
                            <span className="absolute top-0 right-0 w-6 h-6 border-t-[2px] border-r-[2px] border-[#22C55E] -mt-1 -mr-1 animate-pulse"></span>
                            <span className="absolute bottom-0 left-0 w-6 h-6 border-b-[2px] border-l-[2px] border-[#22C55E] -mb-1 -ml-1 animate-pulse"></span>
                            <span className="absolute bottom-0 right-0 w-6 h-6 border-b-[2px] border-r-[2px] border-[#22C55E] -mb-1 -mr-1 animate-pulse"></span>
                            {/* Laser Line */}
                            <div className="absolute left-0 right-0 h-[1.5px] bg-[#22C55E] shadow-[0_0_12px_3px_rgba(34,197,94,0.6)] animate-laser"></div>
                        </div>
                    </div>

                    {/* Live Metadata Telemetry */}
                    <div className="absolute bottom-36 left-6 z-10 font-mono text-[11px] sm:text-xs text-[#22C55E] opacity-90 flex flex-col gap-1.5 tracking-wider drop-shadow-md">
                        <p>ISO: 400</p>
                        <p>FOC: AUTO</p>
                        <p>AI_CONF: 94.2%</p>
                    </div>

                    {/* Bottom Controls Bar */}
                    <div className="absolute bottom-0 left-0 right-0 px-8 pb-safe pt-safe mb-8 z-20 flex justify-between items-center">
                        <button className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-lg flex items-center justify-center border border-white/20 shadow-lg text-white hover:bg-white/20 transition-colors active:scale-95">
                            <Zap className="w-6 h-6" />
                        </button>

                        <button
                            onClick={captureImage}
                            className="w-20 h-20 rounded-full border-[4px] border-white shadow-[0_0_20px_rgba(0,0,0,0.6)] flex items-center justify-center active:scale-90 transition-transform bg-white/20 backdrop-blur-sm"
                        >
                            <div className="w-[60px] h-[60px] bg-white rounded-full shadow-inner"></div>
                        </button>

                        <button onClick={() => { stopCamera(); fileInputRef.current?.click(); }} className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-lg flex items-center justify-center border border-white/20 shadow-lg text-white hover:bg-white/20 transition-colors active:scale-95">
                            <Image className="w-6 h-6" />
                        </button>
                    </div>

                    <canvas ref={canvasRef} className="hidden" />
                </div>
            )}
        </div>
    );
}
