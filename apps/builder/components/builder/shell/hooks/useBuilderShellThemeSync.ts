/**
 * Theme-sync hook BuilderShell: синхронизация темы app<->editor и debounce-сохранение изменений.
 */
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { useTheme } from 'next-themes'

import {
  appThemeState,
  buildAppThemeCssVars,
  mapShadcnVariablesToThemeColors,
  normalizeAppTheme,
  useAppThemeSnapshot,
} from 'state/app-theme-state'
import type { BuilderAppTheme } from 'state/app-theme-state'
import { getComponentSetPreset } from 'state/app-theme-presets'

import { stableStringify } from '../../autosave'

export interface UseBuilderShellThemeSyncParams {
  activeAppId?: string | null
  activeAppTheme?: unknown
  persistTheme: (theme: BuilderAppTheme) => void
}

const hasShadcnVariables = (variables?: Record<string, Record<string, string> | undefined>) => {
  if (!variables) {
    return false
  }
  return Object.values(variables).some((modeVars) => modeVars && Object.keys(modeVars).length > 0)
}

const applyComponentSetPresetToTheme = (theme: BuilderAppTheme) => {
  const preset = getComponentSetPreset(theme.componentSetId)
  if (!preset) {
    return
  }

  const currentShadcn = appThemeState.theme.shadcn ?? {}
  const mergedCssVariables = preset.cssVariables
    ? { ...(currentShadcn.cssVariables ?? {}), ...preset.cssVariables }
    : currentShadcn.cssVariables
  const shadcnPatch = {
    ...(preset.shadcnConfig ?? {}),
    ...(preset.cssVariables ? { cssVariables: mergedCssVariables } : null),
  }
  if (Object.keys(shadcnPatch).length > 0) {
    appThemeState.setShadcnConfig(shadcnPatch)
  }

  const lightVars = preset.shadcnVariables.light ?? {}
  const darkVars = preset.shadcnVariables.dark ?? {}

  appThemeState.setShadcnVariablesByMode({
    light: lightVars,
    dark: darkVars,
  })

  if (Object.keys(lightVars).length > 0) {
    const nextColors = mapShadcnVariablesToThemeColors(lightVars, theme.modes.light.colors, {
      mode: 'light',
      mapping: preset.colorMapping,
    })
    appThemeState.setThemeColors(nextColors, 'light')
    appThemeState.setThemeRadii(preset.radii, 'light')
  }

  if (Object.keys(darkVars).length > 0) {
    const nextColors = mapShadcnVariablesToThemeColors(darkVars, theme.modes.dark.colors, {
      mode: 'dark',
      mapping: preset.colorMapping,
    })
    appThemeState.setThemeColors(nextColors, 'dark')
    appThemeState.setThemeRadii(preset.radii, 'dark')
  }
}

export const useBuilderShellThemeSync = ({
  activeAppId,
  activeAppTheme,
  persistTheme,
}: UseBuilderShellThemeSyncParams) => {
  const { resolvedTheme } = useTheme()
  const appTheme = useAppThemeSnapshot()
  const themeSaveReadyRef = useRef(false)
  const lastSavedThemeSignatureRef = useRef<string | null>(null)

  const normalizedTheme = useMemo(
    () => normalizeAppTheme(appTheme.theme as Partial<BuilderAppTheme>),
    [appTheme.theme]
  )
  const debouncedTheme = useDebounce(normalizedTheme, 600)

  const applyPresetIfNeeded = useCallback((theme: BuilderAppTheme) => {
    if (!hasShadcnVariables(theme.shadcn?.variables)) {
      applyComponentSetPresetToTheme(theme)
    }
  }, [])

  useEffect(() => {
    if (!activeAppId) {
      return
    }
    const hasStoredTheme = Boolean(activeAppTheme)
    themeSaveReadyRef.current = !hasStoredTheme
    const normalized = normalizeAppTheme(activeAppTheme ?? null)
    lastSavedThemeSignatureRef.current = hasStoredTheme ? stableStringify(normalized) : null
    appThemeState.setTheme(normalized)
    applyPresetIfNeeded(normalized)
  }, [activeAppId, activeAppTheme, applyPresetIfNeeded])

  useEffect(() => {
    if (!activeAppId) {
      return
    }
    if (!themeSaveReadyRef.current) {
      themeSaveReadyRef.current = true
      return
    }
    const signature = stableStringify(debouncedTheme)
    if (signature === lastSavedThemeSignatureRef.current) {
      return
    }
    lastSavedThemeSignatureRef.current = signature
    persistTheme(debouncedTheme)
  }, [activeAppId, debouncedTheme, persistTheme])

  const appThemeMode = useMemo(() => {
    if (normalizedTheme.mode === 'system') {
      return resolvedTheme?.includes('dark') ? 'dark' : 'light'
    }
    return normalizedTheme.mode
  }, [normalizedTheme.mode, resolvedTheme])

  const appThemeCssVars = useMemo(
    () => buildAppThemeCssVars(normalizedTheme, appThemeMode),
    [normalizedTheme, appThemeMode]
  )

  return {
    appTheme,
    normalizedTheme,
    appThemeMode,
    appThemeCssVars,
  }
}
