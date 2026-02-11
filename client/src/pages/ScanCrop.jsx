import { useState, useEffect } from "react";
import { detectDisease } from "../services/api";
import { Upload, Scan, AlertTriangle, CheckCircle, X, Leaf, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function ScanCrop() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Cleanup preview URL on unmount
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
    if (!image) return setError("Please select an image first");

    const formData = new FormData();
    formData.append("image", image);

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await detectDisease(formData);
      setResult(res.data);
    } catch (err) {
      console.error("Scan Error:", err);
      setError(
        err.response?.data?.error ||
        err.message ||
        "Failed to analyze image. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const clearScan = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#0b0f0c] text-white pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent mb-4">
            AI Disease Detection
          </h1>
          <p className="text-white/60 text-lg">
            Upload a photo of your crop to instantly identify diseases and get treatment plans.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

          {/* LEFT: Upload Section */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-2xl">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <Upload className="text-emerald-400" /> Upload Image
            </h2>

            {/* Drop Zone / Preview */}
            <div className="relative w-full aspect-square bg-black/20 rounded-2xl border-2 border-dashed border-white/20 overflow-hidden group hover:border-emerald-500/50 transition-colors">

              {preview ? (
                <>
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  {/* Remove Button */}
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
                  <p className="text-white/80 font-medium">Click to upload</p>
                  <p className="text-white/40 text-sm mt-2">JPG, PNG supported</p>
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
                  <Loader2 className="animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  <Scan /> Start Diagnosis
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
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                      <CheckCircle className="text-emerald-400" /> Analysis Result
                    </h2>
                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${result.disease.severity === "High" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                        result.disease.severity === "Medium" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                          "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      }`}>
                      {result.disease.severity} Severity
                    </span>
                  </div>

                  {/* Disease Info */}
                  <div className="mb-8">
                    <p className="text-white/40 text-sm uppercase tracking-wider font-semibold mb-1">Detected Issue</p>
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
                        {(result.disease.confidence * 100).toFixed(1)}% Match
                      </span>
                    </div>
                  </div>

                  {/* Treatment */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Leaf size={18} className="text-emerald-400" /> Recommended Treatment
                    </h4>

                    <div className="bg-white/5 rounded-xl p-5 border border-white/5 space-y-4">
                      {result.disease.severity === "None" ? (
                        <p className="text-emerald-400">
                          Your crop looks healthy! No treatment is required. Keep up the good work! 🌾
                        </p>
                      ) : result.treatment ? (
                        <>
                          {result.treatment.chemical && (
                            <div>
                              <p className="text-white/40 text-xs uppercase font-bold mb-1">Chemical Control</p>
                              <p className="text-white font-medium">{result.treatment.chemical.name}</p>
                              <p className="text-white/60 text-sm mt-0.5">Dose: {result.treatment.chemical.dose}</p>
                            </div>
                          )}

                          {result.treatment.organic && (
                            <div className="pt-3 border-t border-white/10">
                              <p className="text-white/40 text-xs uppercase font-bold mb-1">Organic Control</p>
                              <p className="text-white font-medium">{result.treatment.organic}</p>
                            </div>
                          )}

                          {result.treatment.prevention && (
                            <div className="pt-3 border-t border-white/10">
                              <p className="text-white/40 text-xs uppercase font-bold mb-1">Prevention</p>
                              <p className="text-white/80 text-sm leading-relaxed">{result.treatment.prevention}</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-white/60 italic">No specific treatment data available for this condition.</p>
                      )}
                    </div>
                  </div>

                </motion.div>
              ) : (
                /* Placeholders / Guide */
                <div className="border border-white/5 rounded-3xl p-8 text-center bg-white/[0.02]">
                  <div className="inline-flex bg-emerald-500/10 p-4 rounded-full mb-4">
                    <Scan className="w-8 h-8 text-emerald-500/50" />
                  </div>
                  <h3 className="text-xl font-semibold text-white/80 mb-2">Ready to Scan</h3>
                  <p className="text-white/50 text-sm max-w-xs mx-auto">
                    Upload a clear image of the affected leaf or plant area for the best results.
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
