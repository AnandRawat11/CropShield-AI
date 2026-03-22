import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ScanCrop from "./pages/ScanCrop";
import SmartFarmingGuide from "./pages/SmartFarmingGuide";
import Navbar from "./components/Navbar";
import MobileBottomNav from "./components/MobileBottomNav";

import OAuthSuccess from "./pages/OAuthSuccess";
import ProtectedRoute from "./components/ProtectedRoute";
import LoadingScreen from "./components/LoadingScreen";
import { checkHealth } from "./services/api";


function App() {
  const [isServerReady, setIsServerReady] = useState(false);

  useEffect(() => {
    // Ping backend to wake up resources (Node.js and AI model)
    checkHealth()
      .then(() => setIsServerReady(true))
      .catch((err) => {
        console.warn("Health check failed, proceeding anyway", err);
        setIsServerReady(true);
      });
  }, []);

  if (!isServerReady) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/oauth-success" element={<OAuthSuccess />} />


        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/scan"
          element={
            <ProtectedRoute>
              <ScanCrop />
            </ProtectedRoute>
          }
        />

        <Route
          path="/guide"
          element={
            <ProtectedRoute>
              <SmartFarmingGuide />
            </ProtectedRoute>
          }
        />
      </Routes>
      <MobileBottomNav />
    </BrowserRouter>
  );
}

export default App;
