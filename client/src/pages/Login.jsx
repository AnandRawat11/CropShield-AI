import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
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

    if (!formData.identifier || !formData.password) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/auth/login", {
        email: formData.identifier,
        password: formData.password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#dff5e6] relative overflow-hidden">
      
      {/* Soft background */}
      <div className="absolute inset-0 bg-[#21c45d] opacity-10"></div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-2xl p-8">
        
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-[#21c45d] hover:underline mb-4"
        >
          ← Back
        </button>

        <h2 className="text-center text-2xl font-bold text-gray-800 mb-6">
          LOGIN
        </h2>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <input
            type="email"
            name="identifier"
            value={formData.identifier}
            onChange={handleChange}
            placeholder="Enter email"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#21c45d] text-white py-2.5 rounded-full font-semibold hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? "Signing in..." : "SIGN IN"}
          </button>
        </form>

        <div className="text-center text-sm text-gray-500 mt-6">
          Don’t have an account?{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-[#21c45d] font-medium cursor-pointer hover:underline"
          >
            Sign up
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
