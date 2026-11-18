"use client";

// Universal PWA Install & Service Worker Controller for Muslim Construction ERP
// Handles Chromium (PC Chrome, Edge, Android) and Apple iOS (Safari Add to Home Screen)

export interface PWAState {
  canInstall: boolean;
  isInstalled: boolean;
  isIos: boolean;
  platform: "desktop" | "android" | "ios" | "unknown";
}

let deferredPrompt: any = null;
const listeners = new Set<(state: PWAState) => void>();

function detectPlatform(): "desktop" | "android" | "ios" | "unknown" {
  if (typeof window === "undefined") return "unknown";
  const ua = window.navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/windows|macintosh|linux/.test(ua)) return "desktop";
  return "unknown";
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes("android-app://")
  );
}

export function isIos(): boolean {
  return detectPlatform() === "ios";
}

export function getPWAState(): PWAState {
  const installed = isStandalone();
  const ios = isIos();
  return {
    canInstall: !installed && (!!deferredPrompt || ios),
    isInstalled: installed,
    isIos: ios,
    platform: detectPlatform(),
  };
}

function notifyListeners() {
  const state = getPWAState();
  listeners.forEach((fn) => {
    try {
      fn(state);
    } catch (err) {
      console.warn("[PWA] Listener error:", err);
    }
  });
}

export function subscribePWAState(callback: (state: PWAState) => void): () => void {
  listeners.add(callback);
  callback(getPWAState());
  return () => {
    listeners.delete(callback);
  };
}

// Global initialization in browser
if (typeof window !== "undefined") {
  // 1. Listen for Chromium beforeinstallprompt
  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log("[PWA] beforeinstallprompt captured successfully.");
    notifyListeners();
  });

  // 2. Listen for appinstalled
  window.addEventListener("appinstalled", () => {
    console.log("[PWA] App successfully installed.");
    deferredPrompt = null;
    notifyListeners();
  });

  // 3. Register Service Worker with robust error handling
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.log("[PWA] Service Worker registered with scope:", reg.scope);
          // Check for updates
          reg.onupdatefound = () => {
            const installing = reg.installing;
            if (installing) {
              installing.onstatechange = () => {
                if (installing.state === "installed" && navigator.serviceWorker.controller) {
                  console.log("[PWA] New version available.");
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn("[PWA] Service Worker registration failed:", err);
        });
    });
  }
}

/**
 * Triggers the native install prompt or returns false if instructions modal needed
 */
export async function triggerPWAInstall(): Promise<{
  success: boolean;
  outcome?: "accepted" | "dismissed";
  needsManualGuide: boolean;
  platform: "desktop" | "android" | "ios" | "unknown";
}> {
  const platform = detectPlatform();

  if (deferredPrompt) {
    try {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      const accepted = choice.outcome === "accepted";
      if (accepted) {
        deferredPrompt = null;
        notifyListeners();
      }
      return { success: accepted, outcome: choice.outcome, needsManualGuide: false, platform };
    } catch (err) {
      console.warn("[PWA] Prompt call failed:", err);
    }
  }

  // If deferredPrompt not available or iOS, user needs guided modal
  return {
    success: false,
    needsManualGuide: true,
    platform,
  };
}
