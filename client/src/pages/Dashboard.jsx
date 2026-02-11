import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ScanLine,
  Upload,
  TrendingUp,
  TriangleAlert,
  CalendarDays,
  Leaf,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import API from "@/services/api";
import PremiumModal from "@/components/PremiumModal";

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [scans, setScans] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPremium, setShowPremium] = useState(false);

  /* ================= AUTH ================= */
  useEffect(() => {
    API.get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.clear();
        navigate("/login");
      });
  }, [navigate]);

  /* ================= SCAN HISTORY ================= */
  useEffect(() => {
    API.get("/disease/history")
      .then((res) => setScans(res.data || []))
      .catch(() => { });
  }, []);

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading Dashboard...</div>;
  }

  /* ================= COMPUTED VALUES ================= */
  const scansUsed =
    user.dailyLimit === "Unlimited"
      ? scans.length
      : user.dailyLimit - user.remainingScans;

  const issuesCount = scans.filter(
    (s) => s?.severity && s.severity !== "Low"
  ).length;

  const trendData = scans.slice(-6).map((s, i) => ({
    month: `Scan ${i + 1}`,
    healthy: s.severity === "Low" ? 1 : 0,
    issues: s.severity !== "Low" ? 1 : 0,
  }));

  /* ================= AI SCAN ================= */
  const handleUpload = async () => {
    if (!file) {
      alert("Please select an image first");
      return;
    }

    if (user.plan !== "Premium" && user.remainingScans <= 0) {
      setShowPremium(true);
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      setLoading(true);

      const res = await API.post("/disease/detect", formData);

      alert(
        `Disease Detected: ${res.data?.disease?.disease || "Unknown"
        }`
      );

      setScans((prev) => [res.data, ...prev]);

      // refresh user data (remaining scans / plan)
      const me = await API.get("/auth/me");
      setUser(me.data);
    } catch {
      alert("AI scan failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f0c] text-white p-6">
      {/* ================= HEADER ================= */}
      <header className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold flex items-center gap-2">
              Welcome back, {user.name}
              <Leaf className="h-6 w-6 text-emerald-300" />
            </h1>

            <p className="mt-2 text-sm text-white/60">
              Plan: <b>{user.plan}</b> • Remaining Scans:{" "}
              {user.plan === "Premium"
                ? "Unlimited"
                : user.remainingScans}
            </p>
          </div>

          {user.plan !== "Premium" && (
            <button
              onClick={() => setShowPremium(true)}
              className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-black hover:bg-emerald-500"
            >
              Upgrade to Premium
            </button>
          )}
        </div>
      </header>

      {/* ================= STATS ================= */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-4 mb-6">
        <Stat title="Scans Used" value={scansUsed} icon={<ScanLine />} />
        <Stat
          title="Remaining Scans"
          value={
            user.plan === "Premium"
              ? "∞"
              : user.remainingScans
          }
          icon={<CalendarDays />}
        />
        <Stat title="Health Score" value="89%" icon={<TrendingUp />} />
        <Stat
          title="Issues Flagged"
          value={issuesCount}
          icon={<TriangleAlert />}
        />
      </section>

      {/* ================= MAIN ================= */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* UPLOAD */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold mb-4">
            Upload Crop Image
          </h2>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
            className="mb-4"
          />

          <button
            onClick={handleUpload}
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-black hover:bg-emerald-500 disabled:opacity-60"
          >
            {loading ? "Scanning..." : "Upload & Scan"}
          </button>
        </div>

        {/* CHART */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold mb-4">
            Crop Health Trends
          </h2>

          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="month" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip />
              <Legend />
              <Line
                dataKey="healthy"
                stroke="#22c55e"
                strokeWidth={2}
              />
              <Line
                dataKey="issues"
                stroke="#facc15"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ================= PREMIUM POPUP ================= */}
      <PremiumModal
        open={showPremium}
        onClose={() => setShowPremium(false)}
        onUpgraded={(data) =>
          setUser((prev) => ({ ...prev, ...data }))
        }
      />
    </div>
  );
}

/* ================= SMALL STAT CARD ================= */
const Stat = ({ title, value, icon }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-white/60">{title}</p>
        <p className="text-3xl font-semibold">{value}</p>
      </div>
      <div className="h-11 w-11 grid place-items-center rounded-xl bg-emerald-500/10">
        {icon}
      </div>
    </div>
  </div>
);
