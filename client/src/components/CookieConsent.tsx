import { useEffect, useState } from 'react';

/**
 * Minimal RGPD/ePrivacy-compliant cookie consent banner.
 *
 *   - Stores the user's choice in localStorage (`pc-cookie-consent`).
 *   - On "Accept all" : sets the flag so PostHog + Sentry can initialize on
 *     subsequent renders ; emits a CustomEvent so already-mounted code can
 *     opt in their respective SDKs without waiting for a page reload.
 *   - On "Refuse" : sets the flag to 'refused' ; analytics stays off.
 *   - Strictly necessary cookies (auth session) are exempt — no consent UI
 *     for the `token` cookie.
 *
 * Read the flag from anywhere via `hasCookieConsent()` ; subscribe to
 * changes via the `pc-cookie-consent-changed` window event.
 */

export type CookieConsentValue = 'accepted' | 'refused' | null;
const STORAGE_KEY = 'pc-cookie-consent';
const EVENT = 'pc-cookie-consent-changed';

export function hasCookieConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(STORAGE_KEY) === 'accepted';
}

export function readCookieConsent(): CookieConsentValue {
  if (typeof window === 'undefined') return null;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === 'accepted' || v === 'refused' ? v : null;
}

function setConsent(value: 'accepted' | 'refused') {
  window.localStorage.setItem(STORAGE_KEY, value);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { value } }));
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (readCookieConsent() === null) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4"
    >
      <h2
        id="cookie-consent-title"
        className="text-sm font-semibold text-gray-900 dark:text-white mb-1"
      >
        Cookies & confidentialité
      </h2>
      <p id="cookie-consent-desc" className="text-xs text-gray-600 dark:text-gray-300 mb-3">
        Nous utilisons des cookies strictement nécessaires (session) et, avec votre accord, des
        cookies analytiques (PostHog, Sentry) pour améliorer l'application.{' '}
        <a href="/privacy" className="underline">
          En savoir plus
        </a>
        .
      </p>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => {
            setConsent('refused');
            setVisible(false);
          }}
          className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
        >
          Refuser
        </button>
        <button
          type="button"
          onClick={() => {
            setConsent('accepted');
            setVisible(false);
          }}
          className="px-3 py-1.5 text-xs font-medium bg-violet-600 text-white hover:bg-violet-700 rounded"
        >
          Tout accepter
        </button>
      </div>
    </div>
  );
}
