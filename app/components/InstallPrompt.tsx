"use client";
import React, { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [iosPromptType, setIosPromptType] = useState<
    "safari" | "chrome" | null
  >(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if already installed (standalone mode)
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    // Chrome / Edge — capture the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Detect iOS
    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    if (isIOS) {
      const isCriOS = /CriOS/.test(ua);
      const isFxiOS = /FxiOS/.test(ua);
      if (isCriOS || isFxiOS) {
        setIosPromptType("chrome"); // Chrome or Firefox on iOS
      } else {
        setIosPromptType("safari"); // Safari on iOS
      }
    }

    // Listen for successful install
    const onInstalled = () => setIsInstalled(true);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  // Render nothing on server or before mount (prevents hydration mismatch)
  if (!mounted) return null;

  // Don't render if already installed or user dismissed
  if (isInstalled || dismissed) return null;

  // Nothing to show (not iOS, and no beforeinstallprompt fired)
  if (!deferredPrompt && !iosPromptType) return null;

  return (
    <details className="w-full rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 mb-6 group">
      <summary className="flex items-center gap-3 p-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <div className="text-2xl">📲</div>
        <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm flex-1">
          Install this app
        </p>
        <svg className="w-4 h-4 text-zinc-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2 } d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="px-4 pb-4 pl-[3.25rem]">

        {/* Chrome / Edge / other Chromium browsers on desktop & Android */ }
        { deferredPrompt && (
          <>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              Add to your home screen for quick access.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={ handleInstallClick }
                className="px-4 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Install
              </button>
              <button
                onClick={ () => setDismissed(true) }
                className="px-4 py-1.5 text-xs font-medium rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
              >
                Not now
              </button>
            </div>
          </>
        ) }

        {/* iOS Safari — manual instructions */ }
        { iosPromptType === "safari" && !deferredPrompt && (
          <>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
              Tap the{ " " }
              <span className="inline-flex items-center font-medium text-blue-600 dark:text-blue-400">
                Share
                <svg
                  className="inline w-4 h-4 ml-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={ 2 }
                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 3v12m0-12l-4 4m4-4l4 4"
                  />
                </svg>
              </span>{ " " }
              button, then tap{ " " }
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                &quot;Add to Home Screen&quot;
              </span>
              .
            </p>
            <button
              onClick={ () => setDismissed(true) }
              className="mt-3 px-4 py-1.5 text-xs font-medium rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
            >
              Dismiss
            </button>
          </>
        ) }

        {/* iOS Chrome / Firefox — manual instructions */ }
        { iosPromptType === "chrome" && !deferredPrompt && (
          <>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
              Tap the{ " " }
              <span className="inline-flex items-center font-medium text-blue-600 dark:text-blue-400">
                Share
                <svg
                  className="inline w-4 h-4 ml-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={ 2 }
                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 3v12m0-12l-4 4m4-4l4 4"
                  />
                </svg>
              </span>{ " " }
              button on the right of the address bar, then tap{ " " }
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                &quot;Add to Home Screen&quot;
              </span>
              .
            </p>
            <button
              onClick={ () => setDismissed(true) }
              className="mt-3 px-4 py-1.5 text-xs font-medium rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
            >
              Dismiss
            </button>
          </>
        ) }
      </div>
    </details>
  );
};

export default InstallPrompt;
