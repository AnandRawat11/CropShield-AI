import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
// import { motion } from "framer-motion";
// import farmerImg from "../assets/farmer.png";
import {
  Upload, Cpu, ScanSearch, Zap, BarChart3, BarChart, Leaf, ShieldCheck, Search, Syringe, CheckCircle, Clock,
  Target, Mic
} from "lucide-react";
import { motion } from "framer-motion";
import step1 from "../assets/img/upload.jpeg";




import Navbar from '../components/Navbar';
import VoiceAssistant from '../components/VoiceAssistant';


export default function GardenTreeLanding() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);

  // Wake up Render services on initial load to mitigate cold start delays
  // Also silently trigger the browser location prompt
  useEffect(() => {
    fetch("https://cropshield-backend.onrender.com/health").catch(() => { });
    fetch("https://cropshield-ai-api.onrender.com/health").catch(() => { });

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          console.log("Location access granted on landing.");
        },
        (err) => {
          console.warn("Location access denied or unavailable on landing:", err);
        },
        { timeout: 10000 }
      );
    }
  }, []);

  const stats = [
    { value: "95%", label: t("home.stats.accuracy") },
    { value: "5+", label: t("home.stats.diseases") },
    { value: "24/7", label: t("home.stats.support") },
  ];
  const teamMembers = [
    {
      name: "Anshika Varshney",
      role: "Frontend Developer",
      img: "https://randomuser.me/api/portraits/women/44.jpg",
    },
    {
      name: "Rahul Sharma",
      role: "AI / ML Engineer",
      img: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    {
      name: "Priya Singh",
      role: "Backend Developer",
      img: "https://randomuser.me/api/portraits/women/68.jpg",
    },
  ];
  const features = [
    {
      icon: Cpu,
      title: t("home.features.ai.title"),
      desc: t("home.features.ai.desc"),
    },
    {
      icon: ShieldCheck,
      title: t("home.features.secure.title"),
      desc: t("home.features.secure.desc"),
    },
    {
      icon: Zap,
      title: t("home.features.fast.title"),
      desc: t("home.features.fast.desc"),
    },
    {
      icon: BarChart,
      title: t("home.features.reports.title"),
      desc: t("home.features.reports.desc"),
    },
  ];
  const AboutUs = () => {
    const [showTeam, setShowTeam] = useState(false);
  }
  // const Home = () => {
  //   const location = useLocation();

  //   useEffect(() => {
  //     if (location.state?.scrollTo) {
  //       const el = document.getElementById(location.state.scrollTo);
  //       if (el) {
  //         setTimeout(() => {
  //           el.scrollIntoView({ behavior: "smooth" });
  //         }, 100);
  //       }
  //     }
  //   }, [location]);
  // }
  return (


    <div id="home" className="min-h-screen bg-gray-900">
      <div
        className="relative min-h-screen flex items-center justify-center px-6"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1558904541-efa843a96f01?q=80&w=2000')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >

        <div className="absolute inset-0 bg-white/3 backdrop-blur-lg z-0"></div>
        <div className="absolute inset-0 bg-black/40"></div>

        <div className="relative z-10 max-w-6xl w-full px-11 py-15 flex justify-center">
          <div className="flex flex-col items-center text-center pt-20">
            <span className="inline-block mb-6 px-5 py-2 rounded-full bg-green-500/20 text-green-300 text-sm font-medium">
              {t("home.trustedBy")}
            </span>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-8 max-w-4xl">
              {t("home.heroTitle")} <br />
              <span className="text-green-400 font-extrabold">
                {t("home.heroBold")}
              </span>
            </h1>

            <p className="text-white/85 text-lg md:text-xl max-w-3xl leading-relaxed mb-12">
              {t("home.heroSub")}
            </p>

            <div className="flex flex-col items-center gap-3">

              {/* Main Scan Button */}
              <button
                onClick={() => navigate("/scan")}
                className="flex items-center gap-2 md:gap-3 px-8 md:px-14 py-3 md:py-4
    rounded-full bg-green-500 text-black text-[15px] md:text-lg font-bold
    hover:bg-green-600 transition shadow-lg shadow-green-500/20 active:scale-95"
              >

                {/* Camera Icon */}
                <svg
                  className="w-4 h-4 md:w-6 md:h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <rect x="3" y="7" width="18" height="12" rx="2" />
                  <path d="M9 7l1.5-2h3L15 7" />
                  <circle cx="12" cy="13" r="3" />
                </svg>

                <span>{t("home.startScan")}</span>
              </button>

              {/* Voice Assistant Button */}
              <button
                onClick={() => setShowVoiceAssistant(true)}
                className="mt-6 flex items-center gap-3 px-8 md:px-14 py-3 md:py-4
                rounded-full bg-gray-800/80 text-green-400 border border-green-500/30 text-[15px] md:text-lg font-bold
                hover:bg-gray-700 hover:text-white transition shadow-lg shadow-green-500/10 backdrop-blur-md active:scale-95 group relative"
              >
                <div className="relative flex items-center justify-center">
                  <Mic className="w-5 h-5 md:w-6 md:h-6" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                </div>
                <span>Ask AI Assistant</span>
              </button>            </div>

          </div>
        </div>
      </div>


      <section className="relative py-28 bg-gradient-to-b
  from-green-50
  via-white
  to-emerald-50
  overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,0.08),transparent_40%),radial-gradient(circle_at_80%_60%,rgba(16,185,129,0.06),transparent_45%)]" />


        {/* Soft background glow */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px]
  bg-green-400/10 blur-[120px] rounded-full" />

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="text-center mb-24 relative z-10"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900">
            {t("home.builtForPerformance")}
          </h2>
          <p className="text-gray-500 mt-4 max-w-xl mx-auto">
            {t("home.builtForPerformanceSub")}
          </p>
        </motion.div>

        {/* Cards */}
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
          {features.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 1.1,          // 👈 slower
                delay: index * 0.25,    // 👈 smoother stagger
                ease: "easeOut",
              }}
              whileHover={{ y: -6 }}
              className="relative group rounded-3xl bg-white/80 backdrop-blur-xl p-8 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.15)] border border-white/40 transition"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-3xl bg-green-500/10 opacity-0 group-hover:opacity-100 transition duration-500" />

              <div className="relative w-14 h-14 mb-6 flex items-center justify-center rounded-2xl
  bg-gradient-to-br from-green-400 to-emerald-600
  text-white shadow-lg shadow-green-500/30
  group-hover:scale-105 transition"
              >
                <item.icon className="w-7 h-7" />
              </div>


              {/* Content */}
              <h3 className="relative text-xl font-semibold text-gray-900 mb-2">
                {item.title}
              </h3>
              <div className="w-8 h-1 rounded-full bg-green-500 mb-3" />

              <p className="relative text-gray-500 text-sm leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>







      <section id="how" className="relative w-full py-20 overflow-hidden bg-gradient-to-b from-[#f8fafc] via-white to-[#f1f5f9]">

        {/* Dotted wave path — desktop only. Placed at section level so its
            absolute inset-0 spans the full section height, which is what the
            original path coordinates (M 100 300 …) were calibrated for. */}
        <svg
          className="absolute inset-0 w-full h-full hidden lg:block pointer-events-none"
          viewBox="0 0 1200 400"
          fill="none"
        >
          <motion.path
            d="M 100 300 C 300 140, 460 140, 560 200 S 820 300, 980 220 S 1040 140, 1065 169"
            stroke="#111"
            strokeWidth="2.5"
            strokeDasharray="4 10"
            fill="none"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </svg>
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Heading */}
          <div className="text-center mb-12 px-4">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900">
              {t("home.howItWorks")}
            </h2>
            <p className="text-gray-500 mt-4 text-base sm:text-lg max-w-2xl mx-auto">
              {t("home.howItWorksSub")}
            </p>
          </div>

          {/* Steps — vertical on mobile, horizontal row on lg+ */}
          <div className="max-w-6xl mx-auto px-6">

            {/* Mobile & Tablet: vertical list with connector line */}
            <div className="flex flex-col gap-8 lg:hidden">
              {[
                { icon: Upload, color: "bg-lime-500", step: "01", title: t("home.steps.upload.title"), desc: t("home.steps.upload.desc") },
                { icon: Cpu, color: "bg-emerald-500", step: "02", title: t("home.steps.ai.title"), desc: t("home.steps.ai.desc") },
                { icon: ShieldCheck, color: "bg-cyan-500", step: "03", title: t("home.steps.detect.title"), desc: t("home.steps.detect.desc") },
                { icon: Clock, color: "bg-blue-500", step: "04", title: t("home.steps.result.title"), desc: t("home.steps.result.desc") },
                { icon: Target, color: "bg-purple-600", step: "05", title: t("home.steps.action.title"), desc: t("home.steps.action.desc") },
              ].map(({ icon: Icon, color, step, title, desc }, i) => (
                <motion.div
                  key={step}
                  className="flex items-start gap-5"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                >
                  {/* Circle + vertical connector */}
                  <div className="flex flex-col items-center">
                    <div className={`relative w-16 h-16 flex items-center justify-center rounded-full ${color} flex-shrink-0`}>
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
                        <Icon className="w-5 h-5 text-gray-900" />
                      </div>
                    </div>
                    {i < 4 && <div className="w-0.5 flex-1 min-h-[32px] bg-gray-200 mt-1" />}
                  </div>
                  {/* Text */}
                  <div className="pb-6">
                    <p className="text-xs font-semibold text-gray-400">{t("home.step")} {step}</p>
                    <h4 className="font-bold text-base text-gray-900 mt-0.5">{title}</h4>
                    <p className="text-sm text-gray-500 mt-1">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

          </div>{/* end max-w-6xl — mobile only */}

          {/* Desktop: steps container — SVG wave is on the section above */}
          <div className="hidden lg:block relative w-full h-[420px]">

            {/* STEP 01 */}
            <div className="absolute top-[47%] left-[6%]">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-lime-500" />
                <div className="relative w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md">
                  <Upload className="w-7 h-7 text-gray-900" />
                </div>
              </div>
              <div className="text-center mt-4 w-40 -translate-x-8">
                <p className="text-xs font-semibold">{t("home.step")} 01</p>
                <h4 className="font-bold text-sm">{t("home.steps.upload.title")}</h4>
                <p className="text-xs text-gray-500">{t("home.steps.upload.desc")}</p>
              </div>
            </div>

            {/* STEP 02 */}
            <div className="absolute top-[15%] left-[24%]">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-emerald-500" />
                <div className="relative w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md">
                  <Cpu className="w-10 h-8 text-gray-900" />
                </div>
              </div>
              <div className="text-center mt-4 w-40 -translate-x-8">
                <p className="text-xs font-semibold">{t("home.step")} 02</p>
                <h4 className="font-bold text-sm">{t("home.steps.ai.title")}</h4>
                <p className="text-xs text-gray-500">{t("home.steps.ai.desc")}</p>
              </div>
            </div>

            {/* STEP 03 */}
            <div className="absolute top-[20%] left-[46%]">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-cyan-500" />
                <div className="relative w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md">
                  <ShieldCheck className="w-7 h-7 text-gray-900" />
                </div>
              </div>
              <div className="text-center mt-4 w-40 -translate-x-8">
                <p className="text-xs font-semibold">{t("home.step")} 03</p>
                <h4 className="font-bold text-sm">{t("home.steps.detect.title")}</h4>
                <p className="text-xs text-gray-500">{t("home.steps.detect.desc")}</p>
              </div>
            </div>

            {/* STEP 04 */}
            <div className="absolute top-[10%] left-[66%] flex flex-col items-center">
              <div className="text-center w-40 mb-6 -translate-x-8">
                <p className="text-xs font-semibold">{t("home.step")} 04</p>
                <h4 className="font-bold text-sm">{t("home.steps.result.title")}</h4>
                <p className="text-xs text-gray-500">{t("home.steps.result.desc")}</p>
              </div>
              <div className="relative w-24 h-24 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-blue-500" />
                <div className="relative w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md">
                  <Clock className="w-7 h-7 text-gray-900" />
                </div>
              </div>
            </div>

            {/* STEP 05 */}
            <div className="absolute top-[10%] left-[85%]">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-purple-600" />
                <div className="relative w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md">
                  <Target className="w-7 h-7 text-gray-900" />
                </div>
              </div>
              <div className="text-center mt-4 w-40 -translate-x-10">
                <p className="text-xs font-semibold">{t("home.step")} 05</p>
                <h4 className="font-bold text-sm">{t("home.steps.action.title")}</h4>
                <p className="text-xs text-gray-500">{t("home.steps.action.desc")}</p>
              </div>
            </div>{/* end step 05 */}
          </div>{/* end desktop full-width block */}
        </motion.div>
      </section>



      <section id="about" className="w-full py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* IMAGE SECTION */}
          <motion.div
            initial={{ opacity: 0, x: -80 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
            className="relative"
          >
            <img
              src={step1}
              alt="AI in Agriculture"
              className="rounded-3xl w-full object-cover shadow-xl"
            />

            {/* Floating badge */}

          </motion.div>

          {/* TEXT SECTION */}
          <motion.div
            initial={{ opacity: 0, x: 80 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-gray-900 leading-tight">
              {t("home.vision")}
            </h2>

            <p className="text-gray-600 mt-6 text-lg leading-relaxed">
              {t("home.visionText")}
            </p>

            {/* Feature Pills */}
            <div className="flex gap-4 mt-8 flex-wrap">
              <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full text-green-700 font-medium">
                🌿 {t("home.smartDetection")}
              </div>
              <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full text-blue-700 font-medium">
                🤖 {t("home.aiPowered")}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-10">
              {stats.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 * index }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <h3 className="text-3xl font-bold text-gray-900">
                    {item.value}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {item.label}
                  </p>
                </motion.div>
              ))}
            </div>



          </motion.div>

        </div>
      </section>





      <VoiceAssistant isOpen={showVoiceAssistant} onClose={() => setShowVoiceAssistant(false)} />
    </div >



  );
}
