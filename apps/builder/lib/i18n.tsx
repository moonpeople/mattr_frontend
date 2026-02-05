import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react'

import { LOCAL_STORAGE_KEYS } from 'common'
import en from '../i18n/en.json'
import ru from '../i18n/ru.json'

type Language = 'en' | 'ru'

type Dictionary = Record<string, unknown>

type I18nContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string, fallback?: string) => string
}

const dictionaries: Record<Language, Dictionary> = {
  en,
  ru,
}

const LANGUAGE_STORAGE_KEY = LOCAL_STORAGE_KEYS.UI_LANGUAGE
const DEFAULT_LANGUAGE: Language = 'en'

const I18nContext = createContext<I18nContextValue | undefined>(undefined)

const resolveKey = (dict: Dictionary, key: string): string | undefined => {
  const parts = key.split('.')
  let current: unknown = dict

  for (const part of parts) {
    if (!current || typeof current !== 'object') return undefined
    const record = current as Record<string, unknown>
    if (!(part in record)) return undefined
    current = record[part]
  }

  return typeof current === 'string' ? current : undefined
}

const getStoredLanguage = (): Language | null => {
  if (typeof window === 'undefined') return null
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  return stored === 'ru' || stored === 'en' ? stored : null
}

export const LanguageProvider = ({ children }: PropsWithChildren) => {
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE)

  useEffect(() => {
    const stored = getStoredLanguage()
    if (stored) setLanguage(stored)
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.lang = language
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  }, [language])

  const value = useMemo<I18nContextValue>(() => {
    const dictionary = dictionaries[language] ?? dictionaries[DEFAULT_LANGUAGE]

    const t = (key: string, fallback?: string) => {
      return (
        resolveKey(dictionary, key) ??
        resolveKey(dictionaries[DEFAULT_LANGUAGE], key) ??
        fallback ??
        key
      )
    }

    return { language, setLanguage, t }
  }, [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export const useI18n = () => {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within LanguageProvider')
  }
  return context
}
