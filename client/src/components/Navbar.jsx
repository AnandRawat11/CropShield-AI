import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Crown, Menu, X, Globe, ChevronDown } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
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
    location.pathname === "/register";

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
        fixed top-0 w-full z-50 transition-all
        ${scrolled || menuOpen ? "bg-black/90 backdrop-blur border-b border-white/10" : "bg-transparent"}
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">

        {/* LOGO */}
        <NavLink to="/" className="flex items-center gap-2 text-white font-bold">
          <img src="/logo.png" alt="CropShield-AI" className="h-9 w-auto" />
          CropShield AI
        </NavLink>

        {/* DESKTOP HOME SCROLL MENU */}
        {isHome && (
          <div className="hidden md:flex gap-8 text-sm font-medium">
            <button onClick={() => scrollTo("home")} className="text-emerald-400">
              {t("nav.home")}
            </button>
            <button onClick={() => scrollTo("how")} className="text-white/70 hover:text-white">
              {t("nav.howItWorks")}
            </button>
            <button onClick={() => scrollTo("about")} className="text-white/70 hover:text-white">
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
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-xs hover:bg-white/20 transition"
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
              <NavLink to="/login" className="text-white/70 hover:text-white text-sm">
                {t("nav.login")}
              </NavLink>
              <NavLink
                to="/register"
                className="bg-emerald-600 px-5 py-2 rounded-full text-black font-semibold text-sm"
              >
                {t("nav.signUp")}
              </NavLink>
            </>
          ) : (
            <>
              {user.plan === "PREMIUM" && (
                <span className="flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full">
                  <Crown className="h-4 w-4" /> {t("dashboard.premiumBadge")}
                </span>
              )}
              <NavLink to="/dashboard" className="text-white/80 hover:text-white text-sm">
                {t("nav.dashboard")}
              </NavLink>
              <button onClick={logout} className="text-white/70 hover:text-red-400">
                <LogOut />
              </button>
            </>
          )}
        </div>

        {/* MOBILE: hamburger + auth condensed */}
        <div className="flex md:hidden items-center gap-3">
          {!user ? (
            <NavLink to="/login" className="text-white/80 text-sm font-medium">
              {t("nav.login")}
            </NavLink>
          ) : (
            <button onClick={logout} className="text-white/70 hover:text-red-400">
              <LogOut size={20} />
            </button>
          )}
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="text-white p-1"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* MOBILE DROPDOWN MENU */}
      {menuOpen && (
        <div className="md:hidden bg-black/95 border-t border-white/10 px-6 py-5 flex flex-col gap-4">
          {isHome && (
            <>
              <button onClick={() => scrollTo("home")} className="text-emerald-400 text-left font-medium">
                {t("nav.home")}
              </button>
              <button onClick={() => scrollTo("how")} className="text-white/80 hover:text-white text-left font-medium">
                {t("nav.howItWorks")}
              </button>
              <button onClick={() => scrollTo("about")} className="text-white/80 hover:text-white text-left font-medium">
                {t("nav.about")}
              </button>
              <div className="border-t border-white/10 my-1" />
            </>
          )}

          {/* Mobile Language Switcher */}
          <div className="flex gap-2 flex-wrap">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition
                  ${i18n.language === lang.code
                    ? "bg-emerald-600 text-white"
                    : "bg-white/10 text-white/80 hover:bg-white/20"}`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          {!user ? (
            <NavLink
              to="/register"
              className="bg-emerald-600 px-5 py-2 rounded-full text-black font-semibold text-sm text-center"
              onClick={() => setMenuOpen(false)}
            >
              {t("nav.signUp")}
            </NavLink>
          ) : (
            <>
              {user.plan === "PREMIUM" && (
                <span className="flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full w-fit">
                  <Crown className="h-4 w-4" /> {t("dashboard.premiumBadge")}
                </span>
              )}
              <NavLink
                to="/dashboard"
                className="text-white/80 hover:text-white font-medium"
                onClick={() => setMenuOpen(false)}
              >
                {t("nav.dashboard")}
              </NavLink>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
