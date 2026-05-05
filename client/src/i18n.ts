import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'fr',
    // de/es/ja/zh/ar/pt have stub translation files (~196 keys vs 1000+ in
    // en/fr) and produce missing-key warnings + half-translated UI. Keep the
    // files in /public/locales/ for future contribution but only expose the
    // two complete locales for now.
    supportedLngs: ['fr', 'en'],
    nonExplicitSupportedLngs: true,
    defaultNS: 'translation',
    ns: ['translation'],
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'postcommander-lang',
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: true,
    },
  });

export default i18n;
