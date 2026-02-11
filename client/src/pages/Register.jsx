import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API, { registerUser } from "../services/api";

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      // trim name/email before sending
      await registerUser({ name: name.trim(), email: email.trim(), password });

      navigate("/login");
    } catch (err) {
      // log full error for debugging
      console.error("Registration error:", err?.response || err);
      const msg =
        err?.response?.data?.error || err?.response?.data?.message || err?.message || "Registration failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#dff5e6] relative px-4">

      {/* Soft background */}
      <div className="absolute inset-0 bg-[#21c45d] opacity-10"></div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-2xl p-8">

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-[#21c45d] hover:underline mb-4"
        >
          ← Back
        </button>

        <h2 className="text-center text-2xl font-bold text-gray-800 mb-6">
          CREATE ACCOUNT
        </h2>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Full name"
            className="w-full px-4 py-2 bg-gray-100 rounded-full outline-none focus:ring-2 focus:ring-[#21c45d]"
          />

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email address"
            className="w-full px-4 py-2 bg-gray-100 rounded-full outline-none focus:ring-2 focus:ring-[#21c45d]"
          />

          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            className="w-full px-4 py-2 bg-gray-100 rounded-full outline-none focus:ring-2 focus:ring-[#21c45d]"
          />

          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm password"
            className="w-full px-4 py-2 bg-gray-100 rounded-full outline-none focus:ring-2 focus:ring-[#21c45d]"
          />

          <div className="text-xs text-gray-500">
            Password must be at least 8 characters long.
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#21c45d] text-white py-2.5 rounded-full font-semibold hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? "Creating account..." : "SIGN UP"}
          </button>
        </form>

        <div className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-[#21c45d] font-medium cursor-pointer hover:underline"
          >
            Sign in
          </span>
        </div>
      </div>
    </div>
  );
};

export default Signup;
