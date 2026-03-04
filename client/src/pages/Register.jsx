import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Leaf } from "lucide-react";
import { registerUser } from "../services/api";

/* ── shared input wrapper — defined OUTSIDE Register so React never remounts it ── */
const Field = ({ label, name, type, placeholder, showToggle, show, onToggle, formData, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label}
    </label>
    <div className="relative">
      {/* left icon */}
      {name === "name" && (
        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-400" />
      )}
      {name === "email" && (
        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-400" />
      )}
      {(name === "password" || name === "confirmPassword") && (
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-400" />
      )}

      <input
        type={showToggle ? (show ? "text" : "password") : type}
        name={name}
        value={formData[name]}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
      />

      {/* eye toggle */}
      {showToggle && (
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {show
            ? <EyeOff className="w-[15px] h-[15px]" />
            : <Eye className="w-[15px] h-[15px]" />}
        </button>
      )}
    </div>
  </div>
);

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword } = formData;

    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await registerUser({ name: name.trim(), email: email.trim(), password });
      navigate("/login");
    } catch (err) {
      console.error("Registration error:", err?.response || err);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Registration failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden py-8"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2070')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/25" />

      {/* ── Card ── */}
      <div className="relative z-10 w-full max-w-[400px] mx-4 bg-[#F7F8F6] rounded-2xl shadow-2xl px-10 py-10">

        {/* Logo */}
        <div className="flex justify-center mb-5">
          <img src="/logo.png" alt="CropShield-AI" className="h-20 w-auto" />
        </div>

        {/* Brand name */}
        <h1 className="text-center text-[1.6rem] font-extrabold text-gray-900 mb-1 tracking-tight">
          CropShield <span style={{ color: "#3ED500" }}>AI</span>
        </h1>

        {/* Tagline */}
        <p className="text-center text-sm text-gray-500 mb-8">
          Create your free account and start protecting crops
        </p>

        {/* Error banner */}
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <Field
            label="Full Name"
            name="name"
            type="text"
            placeholder="John Farmer"
            formData={formData}
            onChange={handleChange}
          />

          <Field
            label="Email Address"
            name="email"
            type="email"
            placeholder="farmer@example.com"
            formData={formData}
            onChange={handleChange}
          />

          <Field
            label="Password"
            name="password"
            type="password"
            placeholder="Min. 8 characters"
            showToggle
            show={showPassword}
            onToggle={() => setShowPassword((p) => !p)}
            formData={formData}
            onChange={handleChange}
          />

          <Field
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            placeholder="Re-enter password"
            showToggle
            show={showConfirm}
            onToggle={() => setShowConfirm((p) => !p)}
            formData={formData}
            onChange={handleChange}
          />

          {/* Create account button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3.5 rounded-lg transition-opacity disabled:opacity-60 disabled:cursor-not-allowed text-[15px] mt-2"
            style={{ background: "#3ED500" }}
          >
            {loading ? "Creating account…" : (
              <>Create Account <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[11px] text-gray-400 uppercase tracking-widest font-medium whitespace-nowrap">
            or continue with
          </span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Social buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              window.location.href = `${import.meta.env.VITE_BACKEND_URL}/api/auth/google`;
            }}
            className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm font-medium text-gray-700"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>

          <button className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm font-medium text-gray-700">
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.15-2.2 1.3-2.18 3.87.03 3.02 2.65 4.03 2.68 4.04l-.05.21z" />
              <path d="M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            Apple
          </button>
        </div>

        {/* Sign-in link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="font-medium hover:underline"
            style={{ color: "#3ED500" }}
          >
            Sign in
          </button>
        </p>
      </div>

      {/* ── Footer bar ── */}
      <div className="relative z-10 w-full px-8 mt-6 flex items-center justify-between max-w-4xl">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse block" />
          <span className="text-[11px] text-white/70 uppercase tracking-widest font-medium">
            AI Diagnostic Engine Online
          </span>
        </div>
        <div className="flex items-center gap-6">
          <button className="text-[11px] text-white/60 uppercase tracking-widest hover:text-white/90 transition">
            Help
          </button>
          <button className="text-[11px] text-white/60 uppercase tracking-widest hover:text-white/90 transition">
            Privacy
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
