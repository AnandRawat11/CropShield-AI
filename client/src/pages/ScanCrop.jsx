import { useState, useEffect } from "react";
import { detectDisease } from "../services/api";
import { Upload, Scan, AlertTriangle, CheckCircle, X, Leaf, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

function ScanCrop() {
    const { t, i18n } = useTranslation();
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
            setResult(null);
            setError("");
        }
    };

    const handleSubmit = async () => {
        if (!image) return setError(t("scan.selectImageFirst"));

        const formData = new FormData();
        formData.append("image", image);
        formData.append("lang", i18n.language);

        setLoading(true);
        setLoadingMsg(t("scan.analyzing"));
        setError("");
        setResult(null);

        const msgTimer = setInterval(() => {
            setLoadingMsg((prev) => {
                if (prev === t("scan.analyzing")) return t("scan.warmingUp");
                if (prev === t("scan.warmingUp")) return t("scan.coldStart");
                return prev;
            });
        }, 10000);

        try {
            const res = await detectDisease(formData);
            setResult(res.data);
        } catch (err) {
            console.error("Scan Error:", err);
            const msg = err.response?.data?.error || err.message || "";
            setError(
                msg.includes("cold-start") || msg.includes("AI API did not become")
                    ? t("scan.coldStartError")
                    : msg || t("scan.genericError")
            );
        } finally {
            clearInterval(msgTimer);
            setLoading(false);
            setLoadingMsg("");
        }
    };

    const clearScan = () => {
        setImage(null);
        setPreview(null);
        setResult(null);
        setError("");
    };

    const isQualityError =
        !result?.disease ||
        result.disease.confidence < 0.15 ||
        result.disease.disease === "Not a Crop" ||
        result.disease.disease === "Unknown / Unclear" ||
        result.disease.disease?.startsWith("Not a Plant");

    return (
        <div className="min-h-screen bg-[#0b0f0c] text-white pt-24 pb-12 px-6">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent mb-4">
                        {t("scan.title")}
                    </h1>
                    <p className="text-white/60 text-lg">
                        {t("scan.subtitle")}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

                    {/* LEFT: Upload Section */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-2xl">
                        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                            <Upload className="text-emerald-400" /> {t("scan.uploadImage")}
                        </h2>

                        {/* Drop Zone / Preview */}
                        <div className="relative w-full aspect-square bg-black/20 rounded-2xl border-2 border-dashed border-white/20 overflow-hidden group hover:border-emerald-500/50 transition-colors">
                            {preview ? (
                                <>
                                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        onClick={clearScan}
                                        className="absolute top-4 right-4 bg-black/60 p-2 rounded-full hover:bg-red-500/80 transition backdrop-blur-sm"
                                    >
                                        <X size={20} />
                                    </button>
                                </>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Leaf className="w-8 h-8 text-emerald-500" />
                                    </div>
                                    <p className="text-white/80 font-medium">{t("scan.clickToUpload")}</p>
                                    <p className="text-white/40 text-sm mt-2">{t("scan.formats")}</p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />
                                </label>
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                                <AlertTriangle size={16} />
                                {error}
                            </div>
                        )}

                        {/* Action Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !image}
                            className={`w-full mt-6 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${loading || !image
                                ? "bg-white/10 text-white/40 cursor-not-allowed"
                                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                                }`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" />
                                    <span className="text-sm">{loadingMsg}</span>
                                </>
                            ) : (
                                <>
                                    <Scan /> {t("scan.startDiagnosis")}
                                </>
                            )}
                        </button>
                    </div>

                    {/* RIGHT: Results Section */}
                    <div className="space-y-6">
                        <AnimatePresence mode="wait">
                            {result ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-2xl"
                                >
                                    {isQualityError ? (
                                        <div className="flex flex-col items-center justify-center text-center py-8">
                                            <div className="bg-red-500/10 text-red-400 p-4 rounded-full mb-4">
                                                <AlertTriangle className="w-10 h-10" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-white mb-3">{t("scan.qualityError")}</h3>
                                            <p className="text-white/60">
                                                {t("scan.qualityErrorSub")}
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between mb-6">
                                                <h2 className="text-2xl font-semibold flex items-center gap-2">
                                                    <CheckCircle className="text-emerald-400" /> {t("scan.analysisResult")}
                                                </h2>
                                                <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${result.disease.severity === "High"
                                                    ? "bg-red-500/20 text-red-400 border-red-500/30"
                                                    : result.disease.severity === "Medium"
                                                        ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                                        : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                                    }`}>
                                                    {result.disease.severity} {t("scan.severity")}
                                                </span>
                                            </div>

                                            {/* Disease Info */}
                                            <div className="mb-8">
                                                <p className="text-white/40 text-sm uppercase tracking-wider font-semibold mb-1">{t("scan.detectedIssue")}</p>
                                                <h3 className="text-3xl font-bold text-white mb-2">
                                                    {result.disease.disease}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                                            style={{ width: `${result.disease.confidence * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm text-emerald-400 font-mono">
                                                        {(result.disease.confidence * 100).toFixed(1)}% {t("scan.match")}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Treatment */}
                                            <div>
                                                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                                    <Leaf size={18} className="text-emerald-400" /> {t("scan.recommendedTreatment")}
                                                </h4>

                                                <div className="bg-white/5 rounded-xl p-5 border border-white/5 space-y-4">
                                                    {result.disease.severity === "None" ? (
                                                        <p className="text-emerald-400">
                                                            {t("scan.cropHealthy")}
                                                        </p>
                                                    ) : result.treatment ? (
                                                        <>
                                                            {result.treatment.chemical && (
                                                                <div>
                                                                    <p className="text-white/40 text-xs uppercase font-bold mb-1">{t("scan.chemicalControl")}</p>
                                                                    <p className="text-white font-medium">{result.treatment.chemical.name}</p>
                                                                    <p className="text-white/60 text-sm mt-0.5">{t("scan.dose")}: {result.treatment.chemical.dose}</p>
                                                                </div>
                                                            )}
                                                            {result.treatment.organic && (
                                                                <div className="pt-3 border-t border-white/10">
                                                                    <p className="text-white/40 text-xs uppercase font-bold mb-1">{t("scan.organicControl")}</p>
                                                                    <p className="text-white font-medium">{result.treatment.organic}</p>
                                                                </div>
                                                            )}
                                                            {result.treatment.prevention && (
                                                                <div className="pt-3 border-t border-white/10">
                                                                    <p className="text-white/40 text-xs uppercase font-bold mb-1">{t("scan.prevention")}</p>
                                                                    <p className="text-white/80 text-sm leading-relaxed">{result.treatment.prevention}</p>
                                                                </div>
                                                            )}
                                                            {result.treatment.message && (
                                                                <p className="text-white/80 text-sm leading-relaxed">{result.treatment.message}</p>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <p className="text-white/60 italic">{t("scan.noTreatment")}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            ) : (
                                <div className="border border-white/5 rounded-3xl p-8 text-center bg-white/[0.02]">
                                    <div className="inline-flex bg-emerald-500/10 p-4 rounded-full mb-4">
                                        <Scan className="w-8 h-8 text-emerald-500/50" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white/80 mb-2">{t("scan.readyToScan")}</h3>
                                    <p className="text-white/50 text-sm max-w-xs mx-auto">
                                        {t("scan.readyToScanSub")}
                                    </p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default ScanCrop;
