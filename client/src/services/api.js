import axios from "axios";

const base = import.meta.env.VITE_API_BASE || "http://localhost:5001/api";

const API = axios.create({
  baseURL: base,
});

// Attach JWT token automatically
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Named exports
export const loginUser = (data) => API.post("/auth/login", data);
export const registerUser = (data) => API.post("/auth/register", data);
export const detectDisease = (formData) =>
  API.post("/disease/detect", formData);

// ✅ DEFAULT EXPORT (THIS FIXES YOUR ERROR)
export default API;
