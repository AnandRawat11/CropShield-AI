import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Crown, Menu, X, Globe, ChevronDown } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import API from "../services/api";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "mr", label: "मराठी" },
];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);

  const isHome = location.pathname === "/";
  const hideNavbar =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/scan" ||
    location.pathname === "/dashboard";   // scan and dashboard have their own specialized layouts/headers
  // Pages with light (white) backgrounds need dark-text navbar
  const isLightPage = !isHome && !hideNavbar;


  /* ===== scroll effect ===== */
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ===== close mobile menu on route change ===== */
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  /* ===== close lang dropdown on outside click ===== */
  useEffect(() => {
    const handler = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ===== fetch user ===== */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return setUser(null);
    API.get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => setUser(null));
  }, [location.pathname]);

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  /* ===== smooth scroll ===== */
  const scrollTo = (id) => {
    setMenuOpen(false);
    if (location.pathname !== "/") {
      navigate("/", { state: { scrollTo: id } });
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  /* ===== change language ===== */
  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem("cropshield_lang", code);
    setLangOpen(false);
  };

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  if (hideNavbar) return null;

  return (
    <nav
      className={`
        fixed top-0 w-full z-50 transition-all duration-300
        ${isLightPage
          ? "bg-white border-b border-gray-200 shadow-sm"
          : scrolled || menuOpen
            ? "bg-white/75 backdrop-blur-[14px] border-b border-black/5 shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
            : "bg-transparent border-b border-transparent shadow-none"
        }
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 h-14 flex justify-between items-center">

        {/* LOGO */}
        <NavLink
          to="/"
          className={`flex items-center gap-2 text-lg font-bold transition-colors ${isLightPage ? "text-gray-900" : "text-[#1b5e20] hover:text-[#2e7d32]"
            }`}
        >
          <img src="/logo.png" alt="CropShield-AI" className="h-6 w-auto" />
          CropShield AI
        </NavLink>

        {/* DESKTOP HOME SCROLL MENU */}
        {isHome && (
          <div className="hidden md:flex gap-8 text-sm font-medium">
            <button onClick={() => scrollTo("home")} className="text-[#166534] font-bold border-b-2 border-[#166534] pb-0.5">
              {t("nav.home")}
            </button>
            <button onClick={() => scrollTo("how")} className="text-[#1b5e20] hover:text-[#2e7d32] transition-colors font-semibold">
              {t("nav.howItWorks")}
            </button>
            <button onClick={() => scrollTo("about")} className="text-[#1b5e20] hover:text-[#2e7d32] transition-colors font-semibold">
              {t("nav.about")}
            </button>
          </div>
        )}

        {/* RIGHT SIDE — desktop */}
        <div className="hidden md:flex items-center gap-4">

          {/* Language Switcher */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen((p) => !p)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition ${isLightPage ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-[#1b5e20]/10 text-[#1b5e20] hover:bg-[#1b5e20]/20"}`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{currentLang.label}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${langOpen ? "rotate-180" : ""}`} />
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-green-50 hover:text-green-700
                      ${i18n.language === lang.code ? "bg-green-50 text-green-700 font-semibold" : "text-gray-700"}`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!user ? (
            <>
              <NavLink
                to="/login"
                className={`text-sm transition-colors font-bold ${isLightPage ? "text-gray-600 hover:text-green-600" : "text-[#1b5e20] hover:text-[#2e7d32]"
                  }`}
              >
                {t("nav.login")}
              </NavLink>
              <NavLink
                to="/register"
                className="bg-emerald-600 px-4 py-1.5 rounded-full text-white font-semibold text-sm hover:bg-emerald-700 transition-colors"
              >
                {t("nav.signUp")}
              </NavLink>
            </>
          ) : (
            <>
              {user.plan === "PREMIUM" && (
                <span className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full ${isLightPage ? "bg-yellow-100 text-yellow-700" : "bg-yellow-500/20 text-yellow-300"
                  }`}>
                  <Crown className="h-4 w-4" /> {t("dashboard.premiumBadge")}
                </span>
              )}
              <NavLink
                to="/dashboard"
                className={`text-sm font-bold transition-colors ${isLightPage ? "text-gray-700 hover:text-green-600" : "text-[#1b5e20] hover:text-[#2e7d32]"
                  }`}
              >
                {t("nav.dashboard")}
              </NavLink>
              <button
                onClick={logout}
                className={`transition-colors flex items-center ${isLightPage ? "text-gray-500 hover:text-red-500" : "text-[#1b5e20] hover:text-[#2e7d32]"
                  }`}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* MOBILE: hamburger + auth condensed */}
        <div className="flex md:hidden items-center gap-3">
          {!user ? (
            <NavLink
              to="/login"
              className={`text-sm font-bold transition-colors ${isLightPage || scrolled || menuOpen ? "text-gray-700" : "text-white/90"
                }`}
            >
              {t("nav.login")}
            </NavLink>
          ) : (
            <button
              onClick={logout}
              className={`transition-colors ${isLightPage || scrolled || menuOpen ? "text-[#1b5e20] hover:text-[#2e7d32]" : "text-white/90 hover:text-red-400"
                }`}
            >
              <LogOut size={20} />
            </button>
          )}
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className={`p-1 mt-1 transition-colors ${isLightPage || scrolled || menuOpen ? "text-[#1b5e20]" : "text-white/90"
              }`}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={26} /> : <Menu size={26} strokeWidth={2.5} />}
          </button>
        </div>
      </div>

      {/* MOBILE DROPDOWN MENU */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="md:hidden bg-white/95 backdrop-blur-2xl border-t border-gray-100 shadow-2xl px-6 py-6 flex flex-col gap-5 rounded-b-[2rem] mx-4 mb-4"
          >
            {isHome && (
              <div className="flex flex-col gap-3">
                <button onClick={() => { scrollTo("home"); setMenuOpen(false); }} className="text-[#166534] text-left font-bold text-[17px]">
                  {t("nav.home")}
                </button>
                <button onClick={() => { scrollTo("how"); setMenuOpen(false); }} className="text-gray-600 hover:text-[#1b5e20] text-left font-bold text-[17px]">
                  {t("nav.howItWorks")}
                </button>
                <button onClick={() => { scrollTo("about"); setMenuOpen(false); }} className="text-gray-600 hover:text-[#1b5e20] text-left font-bold text-[17px]">
                  {t("nav.about")}
                </button>
              </div>
            )}

            <div className="border-t border-gray-100/60 my-1" />

            {/* Mobile Language Switcher */}
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">Language</p>
              <div className="flex gap-2 flex-wrap">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition
                    ${i18n.language === lang.code
                        ? "bg-[#166534] text-white shadow-sm"
                        : "bg-gray-50 text-gray-600 border border-gray-200"}`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100/60 my-1" />

            {!user ? (
              <NavLink
                to="/register"
                className="bg-[#166534] mt-2 py-3.5 rounded-2xl text-white font-bold text-sm text-center shadow-lg shadow-[#166534]/20"
                onClick={() => setMenuOpen(false)}
              >
                {t("nav.signUp")}
              </NavLink>
            ) : (
              <div className="flex flex-col gap-3 mt-2">
                {user.plan === "PREMIUM" && (
                  <span className="flex justify-center items-center gap-1.5 text-xs bg-yellow-50 text-yellow-600 border border-yellow-200 py-2 rounded-xl w-full font-bold">
                    <Crown className="h-4 w-4" /> {t("dashboard.premiumBadge")}
                  </span>
                )}
                <NavLink
                  to="/dashboard"
                  className="bg-[#166534] py-3.5 rounded-2xl text-white font-bold text-sm text-center shadow-lg shadow-[#166534]/20"
                  onClick={() => setMenuOpen(false)}
                >
                  {t("nav.dashboard")}
                </NavLink>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
