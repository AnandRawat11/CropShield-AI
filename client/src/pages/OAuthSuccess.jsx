import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Leaf } from "lucide-react";
import API from "../services/api";

const OAuthSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [error, setError] = useState("");

    useEffect(() => {
        // Extract token from URL search params
        const params = new URLSearchParams(location.search);
        const token = params.get("token");

        if (!token) {
            setError("No token found. Authentication failed.");
            setTimeout(() => navigate("/login"), 3000);
            return;
        }

        // Attempt to fetch user profile with the token
        const fetchUserProfile = async () => {
            try {
                const res = await API.get("/auth/me", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                // Save to localStorage
                localStorage.setItem("token", token);
                localStorage.setItem("user", JSON.stringify(res.data));

                // Redirect to dashboard
                navigate("/dashboard");
            } catch (err) {
                console.error("Failed to fetch user after OAuth:", err);
                setError("Failed to retrieve user profile.");
                setTimeout(() => navigate("/login"), 3000);
            }
        };

        fetchUserProfile();
    }, [location, navigate]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F8F6]">
            <div className="flex flex-col items-center gap-4">
                <img src="/logo.png" alt="CropShield-AI" className="h-20 w-auto animate-pulse" />

                {error ? (
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-red-600 mb-2">Authentication Error</h2>
                        <p className="text-gray-600">{error}</p>
                        <p className="text-sm text-gray-500 mt-4">Redirecting back to login...</p>
                    </div>
                ) : (
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Authenticating</h2>
                        <p className="text-gray-600">Please wait while we log you in...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OAuthSuccess;
