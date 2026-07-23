import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Load all JSON files dynamically from locales folder
const localeModules = import.meta.glob("./locales/*.json", { eager: true });

const resources: Record<string, { translation: any }> = {};

for (const path in localeModules) {
  const match = path.match(/\.\/locales\/([^.]+)\.json$/);
  if (match) {
    const lang = match[1];
    resources[lang] = {
      translation: (localeModules[path] as any).default || localeModules[path],
    };
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    keySeparator: false,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
