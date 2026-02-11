import API from "@/services/api";

const PremiumModal = ({ open, onClose, onUpgraded }) => {
  if (!open) return null;

  const handleUpgrade = async () => {
    try {
      // 🔹 Virtual payment simulation
      await new Promise((res) => setTimeout(res, 1200));

      // 🔹 Call backend to upgrade plan
      const res = await API.post("/auth/upgrade");

      alert("🎉 Payment Successful! You are now Premium.");

      onUpgraded(res.data);
      onClose();
    } catch {
      alert("Upgrade failed. Try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl bg-[#0f1412] p-6 border border-white/10 shadow-2xl">
        
        <h2 className="text-2xl font-semibold text-white mb-4 text-center">
          🚀 Upgrade to Premium
        </h2>

        <p className="text-center text-white/70 mb-6">
          Unlock unlimited AI-powered crop analysis and advanced insights
        </p>

        {/* COMPARISON TABLE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

          {/* FREE */}
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <h3 className="text-lg font-semibold mb-3 text-white/80">
              Free Plan
            </h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li>✔ 2–3 scans per day</li>
              <li>✔ Basic disease detection</li>
              <li>✖ Limited treatment details</li>
              <li>✖ No history insights</li>
              <li>✖ No priority support</li>
            </ul>
          </div>

          {/* PREMIUM */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <h3 className="text-lg font-semibold mb-3 text-emerald-300">
              Premium Plan ⭐
            </h3>
            <ul className="space-y-2 text-sm text-white">
              <li>✅ Unlimited AI scans</li>
              <li>✅ Advanced disease detection</li>
              <li>✅ Detailed treatment & dosage</li>
              <li>✅ Scan history & analytics</li>
              <li>✅ Priority expert support</li>
            </ul>
          </div>

        </div>

        {/* ACTIONS */}
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/20 py-3 text-white/80 hover:bg-white/5 transition"
          >
            Maybe Later
          </button>

          <button
            onClick={handleUpgrade}
            className="flex-1 rounded-xl bg-emerald-600 py-3 font-semibold text-black hover:bg-emerald-500 transition"
          >
            Upgrade Now (Demo)
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-white/40">
          * Virtual payment for demo purposes only
        </p>
      </div>
    </div>
  );
};

export default PremiumModal;
