import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Leaf, LogOut, Crown } from "lucide-react";
import { useEffect, useState } from "react";
import API from "../services/api";




const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();




  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [lang, setLang] = useState("en");

  const isHome = location.pathname === "/";
  const hideNavbar =
    location.pathname === "/login" ||
    location.pathname === "/register";

  /* ===== scroll effect ===== */
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
    if (location.pathname !== "/") {
      navigate("/", { state: { scrollTo: id } });
    } else {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  if (hideNavbar) return null;

  return (
    <nav
      className={`
        fixed top-0 w-full z-50 transition-all
        ${scrolled ? "bg-black/80 backdrop-blur border-b border-white/10" : "bg-transparent"}
      `}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

        {/* LOGO */}
        <NavLink to="/" className="flex items-center gap-2 text-white font-bold">
          <Leaf className="text-emerald-400" />
          CropShield AI
        </NavLink>

        {/* HOME SCROLL MENU */}
        {isHome && (
          <div className="hidden md:flex gap-8 text-sm font-medium">
            <button onClick={() => scrollTo("home")} className="text-emerald-400">
              Home
            </button>

            <button
              onClick={() => scrollTo("how")}
              className="text-white/70 hover:text-white"
            >
              How it works
            </button>
            <button
              onClick={() => scrollTo("about")}
              className="text-white/70 hover:text-white"
            >
              About
            </button>
          </div>
        )}

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-4">
          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            className="flex items-center gap-2 px-4 py-2
  rounded-full bg-white/10 text-white text-xs
  hover:bg-white/20 transition"
          >
            🌐
          </button>
          {!user ? (
            <>
              <NavLink
                to="/login"
                className="text-white/70 hover:text-white"
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className="bg-emerald-600 px-5 py-2 rounded-full text-black font-semibold"
              >
                Sign Up
              </NavLink>
            </>
          ) : (
            <>
              {user.plan === "PREMIUM" && (
                <span className="flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full">
                  <Crown className="h-4 w-4" /> Premium
                </span>
              )}

              <NavLink
                to="/dashboard"
                className="text-white/80 hover:text-white"
              >
                Dashboard
              </NavLink>

              <button
                onClick={logout}
                className="text-white/70 hover:text-red-400"
              >
                <LogOut />
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
