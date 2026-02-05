import { proxy, snapshot, useSnapshot } from 'valtio'
import { IS_PLATFORM, LOCAL_STORAGE_KEYS } from './constants'

type ConsentCategory = {
  slug: string
  label: string
  description: string
  isEssential: boolean
  services: readonly {
    id: string
    consent: {
      status: boolean
    }
  }[]
}

type ConsentDecision = { serviceId: string; status: boolean } | { id: string; status: boolean }

const isBrowser = typeof window !== 'undefined'

const readStoredConsent = (): boolean | null => {
  if (!isBrowser) return null

  const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
  if (stored === 'true') return true
  if (stored === 'false') return false
  return null
}

const writeStoredConsent = (value: boolean) => {
  if (!isBrowser) return
  localStorage.setItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT, value.toString())
}

const resolveInitialConsent = (): boolean => {
  const stored = readStoredConsent()
  if (stored !== null) return stored

  if (!IS_PLATFORM) return true

  // Assume consent unless explicitly opted out.
  return true
}

export const consentState = proxy({
  categories: null as ConsentCategory[] | null,
  showConsentToast: false,
  hasConsented: resolveInitialConsent(),
  acceptAll: () => {
    setConsent(true)
  },
  denyAll: () => {
    setConsent(false)
  },
  updateServices: (decisions: ConsentDecision[]) => {
    if (!decisions?.length) return
    const allAccepted = decisions.every((decision) => decision.status === true)
    setConsent(allAccepted)
  },
})

function setConsent(value: boolean) {
  consentState.hasConsented = value
  consentState.showConsentToast = false
  writeStoredConsent(value)
}

// Public API for consent
export function hasConsented() {
  return snapshot(consentState).hasConsented
}

export function useConsentState() {
  const snap = useSnapshot(consentState)

  return {
    hasAccepted: snap.hasConsented,
    categories: snap.categories as ConsentCategory[] | null,
    acceptAll: snap.acceptAll,
    denyAll: snap.denyAll,
    updateServices: snap.updateServices,
  }
}
