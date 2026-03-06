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

// Handle 401 (Invalid Token) globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const onAuthPage = ["/login", "/register"].some((p) =>
        window.location.pathname.startsWith(p)
      );
      if (!onAuthPage) {
        console.warn("Session expired or invalid token. Logging out...");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Named exports
export const loginUser = (data) => API.post("/auth/login", data);
export const registerUser = (data) => API.post("/auth/register", data);
export const detectDisease = (formData, config = {}) =>
  API.post("/disease/detect", formData, config);

// ✅ DEFAULT EXPORT (THIS FIXES YOUR ERROR)
export default API;
