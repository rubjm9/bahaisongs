'use client';

import { useCallback, useEffect, useState } from 'react';

/** Chrome/Edge/Android `beforeinstallprompt` event (not in TS lib DOM). */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_KEY = 'bs-pwa-install-dismissed';
/** Re-show the prompt this many days after a dismissal. */
const DISMISS_DAYS = 30;

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function recentlyDismissed(): boolean {
  if (typeof localStorage === 'undefined') return false;
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const ts = Number(raw);
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

export interface InstallPromptState {
  /** True when a custom install affordance should be shown. */
  canShow: boolean;
  /** True on iOS, where install is manual (Share → Add to Home Screen). */
  isIos: boolean;
  /** Trigger the native install prompt (no-op on iOS). */
  install: () => Promise<void>;
  /** Dismiss the prompt and remember the choice. */
  dismiss: () => void;
}

/**
 * Manages the custom "install this app" affordance:
 * captures `beforeinstallprompt` on supported browsers, and surfaces manual
 * instructions on iOS Safari (which never fires that event).
 */
export function useInstallPrompt(): InstallPromptState {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosEligible, setIosEligible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) {
      setDismissed(true);
      return;
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setDismissed(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    // iOS never fires beforeinstallprompt — offer manual instructions instead.
    if (isIos()) setIosEligible(true);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* storage unavailable — best effort */
    }
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    if (choice.outcome === 'dismissed') dismiss();
  }, [deferred, dismiss]);

  const canShow = !dismissed && (deferred !== null || iosEligible);

  return { canShow, isIos: iosEligible, install, dismiss };
}
