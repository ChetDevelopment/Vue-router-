import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { en } from './en';
import { kh, TranslationKeys } from './kh';

type Language = 'en' | 'kh';

interface LanguageContextType {
  lang: Language;
  t: TranslationKeys;
  setLanguage: (lang: Language) => Promise<void>;
}

const translations: Record<Language, TranslationKeys> = { en, kh };
const LANG_KEY = 'toklok_language';

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  t: en,
  setLanguage: async () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then((stored) => {
      if (stored === 'kh' || stored === 'en') setLang(stored);
    }).catch(() => {});
  }, []);

  const setLanguage = async (newLang: Language) => {
    setLang(newLang);
    await AsyncStorage.setItem(LANG_KEY, newLang).catch(() => {});
  };

  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang], setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
