"use client";

import { useEffect, useState } from "react";
import {
  Download,
  X,
  Laptop,
  Smartphone,
  Share,
  PlusSquare,
  MoreVertical,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import {
  subscribePWAState,
  triggerPWAInstall,
  PWAState,
} from "@/lib/pwa";

// Global custom event for opening the installation guide from any button (header, menu, etc.)
export const PWA_OPEN_GUIDE_EVENT = "open_pwa_install_guide";

export function openPWAInstallGuide() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PWA_OPEN_GUIDE_EVENT));
  }
}

export function PWAInstallPrompt() {
  const [pwaState, setPwaState] = useState<PWAState>({
    canInstall: false,
    isInstalled: false,
    isIos: false,
    platform: "unknown",
  });
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"desktop" | "android" | "ios">("desktop");

  useEffect(() => {
    const unsub = subscribePWAState((state) => {
      setPwaState(state);
      if (!state.isInstalled) {
        const dismissed = sessionStorage.getItem("pwa_banner_dismissed");
        if (!dismissed) {
          setShowBanner(true);
        }
      }
      if (state.platform === "ios") setActiveTab("ios");
      else if (state.platform === "android") setActiveTab("android");
      else setActiveTab("desktop");
    });

    const handleOpenEvent = () => {
      setShowModal(true);
    };

    window.addEventListener(PWA_OPEN_GUIDE_EVENT, handleOpenEvent);

    return () => {
      unsub();
      window.removeEventListener(PWA_OPEN_GUIDE_EVENT, handleOpenEvent);
    };
  }, []);

  const handleInstallClick = async () => {
    const res = await triggerPWAInstall();
    if (res.success) {
      setShowBanner(false);
      setShowModal(false);
    } else {
      // If native prompt is not directly available, show the interactive guide
      if (res.platform === "ios") setActiveTab("ios");
      else if (res.platform === "android") setActiveTab("android");
      else setActiveTab("desktop");
      setShowModal(true);
    }
  };

  const handleDismissBanner = () => {
    setShowBanner(false);
    sessionStorage.setItem("pwa_banner_dismissed", "true");
  };

  return (
    <>
      {/* 1. FLOATING INSTALL BANNER (Mobile & Desktop) */}
      {!pwaState.isInstalled && showBanner && !showModal && (
        <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50 animate-in slide-in-from-bottom duration-300">
          <div className="bg-slate-900/95 backdrop-blur-md border-2 border-amber-500 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center font-black text-slate-950 text-xl shadow flex-shrink-0">
                🏗️
              </div>
              <div className="min-w-0">
                <h4 className="font-black text-xs sm:text-sm text-slate-100 truncate">
                  Install Muslim Construction ERP
                </h4>
                <p className="text-[10px] sm:text-[11px] text-amber-300 truncate">
                  Work 100% offline with zero lag & instant launch
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={handleInstallClick}
                className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-xs px-3 py-2 rounded-xl shadow transition whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Install</span>
              </button>
              <button
                type="button"
                onClick={handleDismissBanner}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition flex-shrink-0"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. INTERACTIVE INSTALLATION GUIDE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 space-y-0 text-slate-800">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center font-black text-slate-950 text-xl shadow">
                  🏗️
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-white">
                    Install Muslim Construction ERP
                  </h3>
                  <p className="text-[11px] text-amber-300">
                    Standalone Desktop & Mobile Application
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick One-Click Trigger Button */}
            <div className="p-5 border-b border-slate-100 bg-amber-50/60 flex items-center justify-between gap-3">
              <div>
                <p className="font-black text-xs text-slate-900">Direct 1-Click Install</p>
                <p className="text-[11px] text-slate-600">Click below to launch your browser&apos;s installer</p>
              </div>
              <button
                type="button"
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow transition"
              >
                <Download className="w-4 h-4" />
                <span>Install Now</span>
              </button>
            </div>

            {/* Platform Selection Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab("desktop")}
                className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition ${
                  activeTab === "desktop"
                    ? "border-amber-500 text-slate-900 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Laptop className="w-4 h-4" />
                <span>PC / Laptop</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("android")}
                className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition ${
                  activeTab === "android"
                    ? "border-amber-500 text-slate-900 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Android Phone</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ios")}
                className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition ${
                  activeTab === "ios"
                    ? "border-amber-500 text-slate-900 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>🍏 iPhone / iPad</span>
              </button>
            </div>

            {/* Platform Instructions Content */}
            <div className="p-6 text-xs space-y-4">
              {activeTab === "desktop" && (
                <div className="space-y-3">
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-amber-500" />
                    <span>How to Install on PC / Laptop (Chrome / Edge / Brave):</span>
                  </h4>
                  <ol className="space-y-2.5 text-slate-700">
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                        1
                      </span>
                      <span>
                        Look at your browser&apos;s <strong>top address bar</strong> (right side, near the bookmark star).
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                        2
                      </span>
                      <span>
                        Click the <strong>Install Icon</strong> (looks like a monitor with an arrow 🖥️ or &apos;App available&apos;).
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                        3
                      </span>
                      <span>
                        Or click the three dots (<strong>⋮</strong>) in the top-right $\rightarrow$ <strong>Cast, save, and share</strong> $\rightarrow$ <strong>Install Muslim Construction ERP</strong>.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                        ✓
                      </span>
                      <span className="font-semibold text-emerald-700">
                        The software opens in its own clean window with a desktop shortcut created!
                      </span>
                    </li>
                  </ol>
                </div>
              )}

              {activeTab === "android" && (
                <div className="space-y-3">
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-500" />
                    <span>How to Install on Android (Chrome / Samsung Internet):</span>
                  </h4>
                  <ol className="space-y-2.5 text-slate-700">
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                        1
                      </span>
                      <span>
                        Click the <strong>&quot;Install Now&quot;</strong> button above, OR tap the <strong>three dots (⋮)</strong> at the top-right of Chrome.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                        2
                      </span>
                      <span>
                        Select <strong>&quot;Install app&quot;</strong> (or <strong>&quot;Add to Home screen&quot;</strong>).
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                        3
                      </span>
                      <span>
                        Tap <strong>&quot;Install&quot;</strong> in the confirmation popup.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                        ✓
                      </span>
                      <span className="font-semibold text-emerald-700">
                        Muslim Construction app icon will appear on your phone home screen!
                      </span>
                    </li>
                  </ol>
                </div>
              )}

              {activeTab === "ios" && (
                <div className="space-y-3">
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <span>🍏</span>
                    <span>How to Install on iPhone / iPad (Safari):</span>
                  </h4>
                  <ol className="space-y-2.5 text-slate-700">
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                        1
                      </span>
                      <span>
                        Open this website in <strong>Safari</strong> on your iPhone or iPad.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                        2
                      </span>
                      <span>
                        Tap the <strong>Share button</strong> at the bottom of the screen (the square with an arrow pointing up 📤).
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                        3
                      </span>
                      <span>
                        Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong> (<PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-slate-600" />).
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                        4
                      </span>
                      <span>
                        Tap <strong>&quot;Add&quot;</strong> in the top-right corner.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                        ✓
                      </span>
                      <span className="font-semibold text-emerald-700">
                        The app is installed as a native full-screen mobile app!
                      </span>
                    </li>
                  </ol>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-500 text-[11px] font-semibold">
                Software By Roonjha Developers : 03152914836
              </span>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition shadow"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
