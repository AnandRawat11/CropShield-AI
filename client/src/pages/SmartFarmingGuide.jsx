import { useState } from "react";
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
    ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

/* ─── DATA SOURCE ─── */
const TECHNIQUES = [
    {
        id: "drip-irrigation",
        category: "Farming Techniques",
        title: "Drip Irrigation",
        shortDesc: "Precise water delivery directly to plant roots to minimize waste.",
        fullDesc: "Drip irrigation is an efficient watering system that delivers water through a network of valves, pipes, and emitters. It reduces evaporation and runoff by placing water exactly where it's needed.",
        benefits: ["Saves up to 50% more water", "Reduces weed growth", "Improves overall crop health"],
        steps: [
            "Design the layout based on crop spacing.",
            "Install main supply pipes and sub-mains.",
            "Place emitters near the base of each plant.",
            "Set up a timer or sensor for automated scheduling."
        ],
        videoUrl: "https://www.youtube.com/embed/2vLPaB8e6HM",
        image: "https://images.unsplash.com/photo-1592919016381-807908c07bcb?auto=format&fit=crop&q=80&w=800"
    },
    {
        id: "crop-rotation",
        category: "Farming Techniques",
        title: "Crop Rotation",
        shortDesc: "Switching crop types seasonally to maintain soil nutrient balance.",
        fullDesc: "Crop rotation is the practice of planting different crops sequentially on the same plot of land to improve soil health, optimize nutrients in the soil, and combat pest and weed pressure.",
        benefits: ["Prevents soil exhaustion", "Breaks pest life cycles", "Increases soil fertility naturally"],
        steps: [
            "Divide your farm into 3 or 4 plots.",
            "Group crops by nutrient needs (e.g., Legumes, Root crops, Leafy greens).",
            "Rotate groups clockwise each season.",
            "Include a fallow or cover crop period if possible."
        ],
        videoUrl: "https://www.youtube.com/embed/j_n4XmN-VCo",
        image: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=800"
    },
    {
        id: "organic-pest-control",
        category: "Pest & Disease Prevention",
        title: "Organic Pest Control",
        shortDesc: "Natural methods to protect crops without harsh chemical pesticides.",
        fullDesc: "This approach uses biological, cultural, and physical methods to manage pests while protecting the environment and human health.",
        benefits: ["Cost-effective", "Safe for beneficial insects", "Chemical-free produce"],
        steps: [
            "Identify the specific pest species.",
            "Introduce natural predators like ladybugs or lacewings.",
            "Use neem oil or soap-based sprays as mild deterrents.",
            "Maintain farm cleanliness to remove breeding grounds."
        ],
        videoUrl: "https://www.youtube.com/embed/7Vp1vS-o62E",
        image: "https://images.unsplash.com/photo-1599839575945-a9a5af0c3fe5?auto=format&fit=crop&q=80&w=800"
    },
    {
        id: "soil-health",
        category: "Farming Techniques",
        title: "Soil Health Management",
        shortDesc: "Building rich, organic soil to support stronger, resilient crops.",
        fullDesc: "Healthy soil is the foundation of successful farming. This involves managing the organic matter and biological activity within the dirt.",
        benefits: ["Stronger root systems", "Better water retention", "Reduced need for fertilizers"],
        steps: [
            "Test soil pH and nutrient levels annually.",
            "Apply organic compost or well-rotted manure.",
            "Use green manure (cover crops) to add nitrogen.",
            "Avoid excessive tilling to protect soil structure."
        ],
        videoUrl: "https://www.youtube.com/embed/PstscA1l9hQ",
        image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=80&w=800"
    },
    {
        id: "leaf-blight-prevention",
        category: "Pest & Disease Prevention",
        title: "Leaf Blight Prevention",
        shortDesc: "Strategies to stop fungal and bacterial leaf diseases before they start.",
        fullDesc: "Prevention is much easier than cure. This guide covers how to stop common leaf blights from destroying your harvest.",
        benefits: ["Protects yield quality", "Reduces fungicide costs", "Prevents field-wide spread"],
        steps: [
            "Ensure proper spacing for air circulation.",
            "Avoid overhead watering (use drip lines instead).",
            "Remove and destroy any infected leaves immediately.",
            "Use resistant crop varieties specifically bred for your region."
        ],
        videoUrl: "https://www.youtube.com/embed/5O36X8iAnLw",
        image: "https://images.unsplash.com/photo-1592323860710-85fbd296996d?auto=format&fit=crop&q=80&w=800"
    }
];

export default function SmartFarmingGuide() {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [selectedTech, setSelectedTech] = useState(null);

    const filteredTech = TECHNIQUES.filter(t =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase())
    );

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
                        <ArrowLeft className="w-4 h-4" /> Back to App
                    </button>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-black tracking-tight"
                    >
                        Smart Farming <span className="text-green-400">Guide</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mt-4 text-green-100/80 text-lg max-w-2xl"
                    >
                        Master modern agricultural techniques and protect your crops with our expert-curated interactive learning system.
                    </motion.p>

                    <div className="mt-10 relative max-w-xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-green-200/50 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search techniques, pests, or diseases..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-green-200/40 focus:outline-none focus:ring-2 focus:ring-green-400/50 backdrop-blur-md transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <main className="max-w-7xl mx-auto px-6 -mt-8 relative z-20">

                {/* Categories Section */}
                {["Farming Techniques", "Pest & Disease Prevention"].map((cat) => {
                    const catItems = filteredTech.filter(item => item.category === cat);
                    if (catItems.length === 0) return null;

                    return (
                        <section key={cat} className="mb-16 first:mt-0 mt-20">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-[#166534]">
                                    {cat === "Farming Techniques" ? <Sprout className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{cat}</h2>
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
                                                <span className="bg-green-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest bg-opacity-90">{item.category.split(" ")[0]}</span>
                                            </div>
                                        </div>
                                        <div className="p-6 flex-1 flex flex-col">
                                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#166534] transition-colors">{item.title}</h3>
                                            <p className="mt-2 text-slate-500 text-sm leading-relaxed flex-1">
                                                {item.shortDesc}
                                            </p>
                                            <button className="mt-6 flex items-center gap-2 text-[#166534] font-bold text-sm">
                                                Learn More <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
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
                        <p className="text-slate-400 text-lg">No techniques found matching your search.</p>
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
                                            <h4 className="text-sm font-bold text-[#166534] uppercase tracking-widest mb-3">Overview</h4>
                                            <p className="text-slate-600 leading-relaxed">{selectedTech.fullDesc}</p>
                                        </section>

                                        <section>
                                            <h4 className="text-sm font-bold text-[#166534] uppercase tracking-widest mb-4">Key Benefits</h4>
                                            <div className="space-y-3">
                                                {selectedTech.benefits.map((benefit, i) => (
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
                                            <h4 className="text-sm font-bold text-[#166534] uppercase tracking-widest mb-4">Step-by-Step Guide</h4>
                                            <div className="space-y-4">
                                                {selectedTech.steps.map((step, i) => (
                                                    <div key={i} className="flex gap-4">
                                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                                                            {i + 1}
                                                        </div>
                                                        <p className="text-slate-600 text-sm leading-relaxed pt-1">{step}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>

                                        <section>
                                            <h4 className="text-sm font-bold text-[#166534] uppercase tracking-widest mb-4">Video Tutorial</h4>
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
                                    </div>
                                </div>

                                <div className="p-8 bg-slate-50 border-t border-gray-100 flex justify-end gap-4">
                                    <button onClick={() => setSelectedTech(null)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">Close</button>
                                    <button onClick={() => setSelectedTech(null)} className="px-8 py-3 rounded-xl bg-[#166534] text-white font-bold shadow-lg shadow-green-900/20 hover:bg-[#14532D] transition-colors flex items-center gap-2">
                                        Got it, thanks! <CheckCircle2 className="w-4 h-4" />
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
