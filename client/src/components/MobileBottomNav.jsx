import { NavLink, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    History,
    Map,
    Camera,
    Sprout
} from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * MobileBottomNav
 * Global mobile navigation bar visible on < lg.
 */

const NAV_ITEMS = [
    {
        labelKey: "home.startScan",
        fallback: "Scan",
        icon: Camera,
        to: "/scan",
    },

    {
        labelKey: "nav.guide",
        fallback: "Guide",
        icon: Sprout,
        to: "/guide",
    },
    {
        labelKey: "nav.history",
        fallback: "History",
        icon: History,
        to: "/dashboard?tab=history",
    },
    {
        labelKey: "nav.dashboard",
        fallback: "Dashboard",
        icon: LayoutDashboard,
        to: "/dashboard",
    }
];

/* Pages where the bottom nav should NOT appear */
const HIDE_ON = ["/login", "/register", "/"];

export default function MobileBottomNav() {
    const { t } = useTranslation();
    const location = useLocation();

    if (HIDE_ON.includes(location.pathname)) return null;

    return (
        <>
            {/* Floating bar */}
            <nav
                className="lg:hidden fixed bottom-4 left-4 right-4 bg-white/75 backdrop-blur-[14px] border-t border-black/5 shadow-[0_4px_12px_rgba(0,0,0,0.05)] rounded-[24px] flex items-center justify-around py-2.5 px-3 z-[100]"
                role="navigation"
                aria-label="Mobile navigation"
                style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom, 10px))" }}
            >
                {NAV_ITEMS.map(({ labelKey, fallback, icon: Icon, to }) => {
                    const url = new URL(to, window.location.href);
                    const tabParam = url.searchParams.get("tab");
                    const currentTab = new URLSearchParams(location.search).get("tab");

                    const isActive =
                        location.pathname === url.pathname &&
                        (tabParam === null ? !currentTab : currentTab === tabParam);

                    return (
                        <NavLink
                            key={to}
                            to={to}
                            className={`flex flex-col items-center gap-1.5 transition-colors duration-200 outline-none select-none ${isActive ? "text-[#166534]" : "text-gray-500 hover:text-[#1b5e20]"}`}
                            style={{ WebkitTapHighlightColor: "transparent" }}
                            aria-current={isActive ? "page" : undefined}
                        >
                            <Icon className={`w-5 h-5 transition-colors duration-200 ${isActive ? "stroke-[2.5]" : "stroke-[2]"}`} />
                            <span className="text-[9px] font-bold tracking-wide">
                                {t(labelKey, fallback)}
                            </span>
                        </NavLink>
                    );
                })}
            </nav>

            {/* Invisible spacer so page content isn't hidden behind the bar */}
            <div className="h-24 lg:hidden" aria-hidden="true" />
        </>
    );
}
