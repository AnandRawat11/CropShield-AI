import { useState, useEffect } from "react";
import {
    Leaf,
    Droplets,
    Bug,
    Sprout,
    Info,
    ChevronRight,
    X,
    PlayCircle,
    Search,
    ArrowRight,
    ShieldCheck,
    ArrowLeft,
    Loader2,
    MapPin,
    AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import API from "../services/api";

import dripIrrigationImg from "../assets/guide/drip_irrigation.png";
import cropRotationImg from "../assets/guide/crop_rotation.png";
import pestControlImg from "../assets/guide/pest_control.png";
import soilHealthImg from "../assets/guide/soil_health.png";
import blightPreventionImg from "../assets/guide/blight_prevention.png";

/* ─── Static config: IDs, categories, images, video URLs ─── */
const TECHNIQUE_META = [
    { id: "drip-irrigation",           category: "catFarming", image: dripIrrigationImg,  videoUrl: "https://www.youtube.com/embed/2vLPaB8e6HM" },
    { id: "crop-rotation",             category: "catFarming", image: cropRotationImg,     videoUrl: "https://www.youtube.com/embed/j_n4XmN-VCo" },
    { id: "organic-pest-control",      category: "catPest",    image: pestControlImg,      videoUrl: "https://www.youtube.com/embed/7Vp1vS-o62E" },
    { id: "soil-health",               category: "catFarming", image: soilHealthImg,       videoUrl: "https://www.youtube.com/embed/PstscA1l9hQ" },
    { id: "leaf-blight-prevention",    category: "catPest",    image: blightPreventionImg, videoUrl: null },
    { id: "integrated-pest-management",category: "catPest",    image: pestControlImg,      videoUrl: "https://www.youtube.com/embed/jZ_v_6pT874" },
    { id: "rainwater-harvesting",      category: "catFarming", image: dripIrrigationImg,   videoUrl: "https://www.youtube.com/embed/PjX9G72a6hY" },
    { id: "companion-planting",        category: "catFarming", image: cropRotationImg,     videoUrl: "https://www.youtube.com/embed/3A2XNfE6ZpI" },
    { id: "root-rot-prevention",       category: "catPest",    image: soilHealthImg,       videoUrl: "https://www.youtube.com/embed/V0m-X0L8Pzw" },
];

export default function SmartFarmingGuide() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [search, setSearch] = useState("");
    const [selectedTech, setSelectedTech] = useState(null);

    const [personalizedGuide, setPersonalizedGuide] = useState(null);
    const [guideLoading, setGuideLoading] = useState(true);
    const [guideError, setGuideError] = useState("");

    // Build translated techniques list
    const TECHNIQUES = TECHNIQUE_META.map((meta) => ({
        ...meta,
        categoryKey: meta.category,
        category: t(`guide.${meta.category}`),
        title: t(`guide.techniques.${meta.id}.title`),
        shortDesc: t(`guide.techniques.${meta.id}.shortDesc`),
        fullDesc: t(`guide.techniques.${meta.id}.fullDesc`),
        benefits: t(`guide.techniques.${meta.id}.benefits`, { returnObjects: true }),
        steps: t(`guide.techniques.${meta.id}.steps`, { returnObjects: true }),
    }));

    useEffect(() => {
        let isMounted = true;

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    if (!isMounted) return;
                    try {
                        const response = await API.post("/guide/personalized", {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                            language: "en"
                        });
                        if (isMounted) {
                            if (response.data && response.data.success) {
                                setPersonalizedGuide(response.data.data);
                            } else {
                                setGuideError("Failed to parse Soil AI recommendations.");
                            }
                            setGuideLoading(false);
                        }
                    } catch (err) {
                        console.error("Personalized guide error:", err);
                        if (isMounted) {
                            setGuideError("Unable to retrieve recommendations right now.");
                            setGuideLoading(false);
                        }
                    }
                },
                (err) => {
                    console.warn("Location not granted in guide, skipping AI recommendations:", err);
                    if (isMounted) {
                        setGuideLoading(false);
                    }
                },
                { timeout: 8000 }
            );
        } else {
            setGuideLoading(false);
        }

        return () => { isMounted = false; };
    }, []);

    const filteredTech = TECHNIQUES.filter(t =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase())
    );

    const CATEGORIES = [
        { key: "catFarming", label: t("guide.catFarming") },
        { key: "catPest",    label: t("guide.catPest") },
    ];

    return (
        <div className="min-h-screen bg-[#FDFCF9] text-slate-800 pb-20">
            {/* ── HERO HEADER ── */}
            <div className="bg-gradient-to-br from-[#166534] to-[#064E3B] text-white pt-24 pb-16 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-green-400/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
                <div className="max-w-7xl mx-auto relative z-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-green-200 hover:text-white transition-colors mb-6 text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" /> {t("guide.backToApp")}
                    </button>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-black tracking-tight"
                    >
                        {t("guide.heroTitle")} <span className="text-green-400">{t("guide.heroBold")}</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mt-4 text-green-100/80 text-lg max-w-2xl"
                    >
                        {t("guide.heroSub")}
                    </motion.p>

                    <div className="mt-10 relative max-w-xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-green-200/50 w-5 h-5" />
                        <input
                            type="text"
                            placeholder={t("guide.searchPlaceholder")}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-green-200/40 focus:outline-none focus:ring-2 focus:ring-green-400/50 backdrop-blur-md transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <main className="max-w-7xl mx-auto px-6 -mt-8 relative z-20">

                {/* Optional Personalized Context */}
                {guideLoading && (
                    <div className="mb-12 flex flex-col items-center justify-center py-8 bg-white/50 backdrop-blur-sm rounded-3xl border border-white/40">
                        <Loader2 className="w-6 h-6 animate-spin text-green-500 mb-2" />
                        <p className="text-sm text-slate-500 animate-pulse font-medium">{t("guide.checkingClimate")}</p>
                    </div>
                )}

                {!guideLoading && personalizedGuide && (
                    <section className="mb-16 bg-white rounded-3xl p-8 shadow-xl border border-green-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>

                        <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-100">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">{t("guide.personalizedTitle")}</h2>
                                </div>
                                <p className="text-slate-500 text-sm">{t("guide.personalizedSub")}</p>
                            </div>
                        </div>

                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                            <div className="space-y-6">
                                <div className="bg-green-50/50 p-5 rounded-2xl border border-green-100">
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-green-800 uppercase tracking-wider mb-2">
                                        <ShieldCheck className="w-4 h-4" /> {t("guide.contextAssessed")}
                                    </h4>
                                    <p className="text-slate-700 text-sm">{personalizedGuide.locationContext}</p>
                                </div>

                                <div>
                                    <h4 className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-4">
                                        <Leaf className="w-5 h-5 text-green-600" /> {t("guide.soilHealth")}
                                    </h4>
                                    <ul className="space-y-3">
                                        {personalizedGuide.soilHealth?.map((req, i) => (
                                            <li key={i} className="flex gap-3 text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl">
                                                <span className="text-green-500 font-bold">•</span>
                                                {req}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-4">
                                        <Sprout className="w-5 h-5 text-amber-600" /> {t("guide.fertilizerStrategy")}
                                    </h4>
                                    <ul className="space-y-3">
                                        {personalizedGuide.fertilizerGuidance?.map((fert, i) => (
                                            <li key={i} className="flex gap-3 text-sm text-slate-600 leading-relaxed bg-amber-50/50 p-3 rounded-xl">
                                                <span className="text-amber-500 font-bold">•</span>
                                                {fert}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">{t("guide.suitedCrops")}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {personalizedGuide.recommendedCrops?.map((crop, i) => (
                                            <span key={i} className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                                                {crop}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </motion.div>
                    </section>
                )}


                {/* Categories Section */}
                {CATEGORIES.map(({ key, label }) => {
                    const catItems = filteredTech.filter(item => item.categoryKey === key);
                    if (catItems.length === 0) return null;

                    return (
                        <section key={key} className="mb-16 first:mt-0 mt-20">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-[#166534]">
                                    {key === "catFarming" ? <Sprout className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{label}</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {catItems.map((item, idx) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        whileHover={{ y: -8 }}
                                        className="bg-white rounded-[24px] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col group cursor-pointer"
                                        onClick={() => setSelectedTech(item)}
                                    >
                                        <div className="h-48 relative overflow-hidden">
                                            <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                                            <div className="absolute bottom-4 left-4">
                                                <span className="bg-green-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest bg-opacity-90">{label.split(" ")[0]}</span>
                                            </div>
                                        </div>
                                        <div className="p-6 flex-1 flex flex-col">
                                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#166534] transition-colors">{item.title}</h3>
                                            <p className="mt-2 text-slate-500 text-sm leading-relaxed flex-1">
                                                {item.shortDesc}
                                            </p>
                                            <button className="mt-6 flex items-center gap-2 text-[#166534] font-bold text-sm">
                                                {t("guide.learnMore")} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </section>
                    );
                })}

                {filteredTech.length === 0 && (
                    <div className="py-20 text-center">
                        <p className="text-slate-400 text-lg">{t("guide.noResults")}</p>
                    </div>
                )}
            </main>

            {/* ── DETAIL MODAL ── */}
            <AnimatePresence>
                {selectedTech && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
                    >
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setSelectedTech(null)}></div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[32px] overflow-hidden shadow-2xl relative z-10 flex flex-col"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setSelectedTech(null)}
                                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-slate-600 transition-colors z-20"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="overflow-y-auto">
                                <div className="h-64 relative">
                                    <img src={selectedTech.image} alt={selectedTech.title} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent"></div>
                                    <div className="absolute bottom-8 left-8">
                                        <span className="text-[#166534] font-bold text-sm tracking-widest uppercase">{selectedTech.category}</span>
                                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">{selectedTech.title}</h2>
                                    </div>
                                </div>

                                <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
                                    <div className="space-y-8">
                                        <section>
                                            <h4 className="text-sm font-bold text-[#166534] uppercase tracking-widest mb-3">{t("guide.overview")}</h4>
                                            <p className="text-slate-600 leading-relaxed">{selectedTech.fullDesc}</p>
                                        </section>

                                        <section>
                                            <h4 className="text-sm font-bold text-[#166534] uppercase tracking-widest mb-4">{t("guide.keyBenefits")}</h4>
                                            <div className="space-y-3">
                                                {Array.isArray(selectedTech.benefits) && selectedTech.benefits.map((benefit, i) => (
                                                    <div key={i} className="flex items-center gap-3 bg-green-50 p-3 rounded-2xl border border-green-100/50">
                                                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-green-600">
                                                            <ShieldCheck className="w-4 h-4" />
                                                        </div>
                                                        <span className="text-sm font-semibold text-slate-700">{benefit}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    </div>

                                    <div className="space-y-8">
                                        <section>
                                            <h4 className="text-sm font-bold text-[#166534] uppercase tracking-widest mb-4">{t("guide.stepByStep")}</h4>
                                            <div className="space-y-4">
                                                {Array.isArray(selectedTech.steps) && selectedTech.steps.map((step, i) => (
                                                    <div key={i} className="flex gap-4">
                                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                                                            {i + 1}
                                                        </div>
                                                        <p className="text-slate-600 text-sm leading-relaxed pt-1">{step}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>

                                        {selectedTech.videoUrl && (
                                            <section>
                                                <h4 className="text-sm font-bold text-[#166534] uppercase tracking-widest mb-4">{t("guide.videoTutorial")}</h4>
                                                <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-slate-50 aspect-video relative">
                                                    <iframe
                                                        width="100%"
                                                        height="100%"
                                                        src={selectedTech.videoUrl}
                                                        title={selectedTech.title}
                                                        frameBorder="0"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                    ></iframe>
                                                </div>
                                            </section>
                                        )}
                                    </div>
                                </div>

                                <div className="p-8 bg-slate-50 border-t border-gray-100 flex justify-end gap-4">
                                    <button onClick={() => setSelectedTech(null)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">{t("guide.close")}</button>
                                    <button onClick={() => setSelectedTech(null)} className="px-8 py-3 rounded-xl bg-[#166534] text-white font-bold shadow-lg shadow-green-900/20 hover:bg-[#14532D] transition-colors flex items-center gap-2">
                                        {t("guide.gotIt")} <CheckCircle2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function CheckCircle2(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    );
}
