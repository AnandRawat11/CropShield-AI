import { useState } from "react";
import { useTranslation } from "react-i18next";
import API from "@/services/api";

const PremiumModal = ({ open, onClose, onUpgraded }) => {
  const { t } = useTranslation();
  if (!open) return null;

  const handleUpgrade = async () => {
    try {
      await new Promise((res) => setTimeout(res, 1200));
      const res = await API.post("/auth/upgrade");
      alert(t("premium.successAlert"));
      onUpgraded(res.data);
      onClose();
    } catch {
      alert(t("premium.failAlert"));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl bg-[#0f1412] p-6 border border-white/10 shadow-2xl">

        <h2 className="text-2xl font-semibold text-white mb-4 text-center">
          🚀 {t("premium.title")}
        </h2>

        <p className="text-center text-white/70 mb-6">
          {t("premium.subtitle")}
        </p>

        {/* COMPARISON TABLE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

          {/* FREE */}
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <h3 className="text-lg font-semibold mb-3 text-white/80">
              {t("premium.freePlan")}
            </h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li>✔ {t("premium.free.scans")}</li>
              <li>✔ {t("premium.free.basicDetection")}</li>
              <li>✖ {t("premium.free.limitedTreatment")}</li>
              <li>✖ {t("premium.free.noHistory")}</li>
              <li>✖ {t("premium.free.noSupport")}</li>
            </ul>
          </div>

          {/* PREMIUM */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <h3 className="text-lg font-semibold mb-3 text-emerald-300">
              {t("premium.premiumPlan")} ⭐
            </h3>
            <ul className="space-y-2 text-sm text-white">
              <li>✅ {t("premium.pro.unlimited")}</li>
              <li>✅ {t("premium.pro.advanced")}</li>
              <li>✅ {t("premium.pro.treatment")}</li>
              <li>✅ {t("premium.pro.history")}</li>
              <li>✅ {t("premium.pro.support")}</li>
            </ul>
          </div>

        </div>

        {/* ACTIONS */}
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/20 py-3 text-white/80 hover:bg-white/5 transition"
          >
            {t("premium.maybeLater")}
          </button>

          <button
            onClick={handleUpgrade}
            className="flex-1 rounded-xl bg-emerald-600 py-3 font-semibold text-black hover:bg-emerald-500 transition"
          >
            {t("premium.upgradeNow")}
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-white/40">
          {t("premium.demoNote")}
        </p>
      </div>
    </div>
  );
};

export default PremiumModal;
