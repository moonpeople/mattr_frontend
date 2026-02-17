/**
 * Тесты assistant-sync hook-а BuilderShell.
 */
import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useBuilderShellAssistantSync } from './useBuilderShellAssistantSync'

describe('useBuilderShellAssistantSync', () => {
  it('clears assistant context when app or builder context is missing', () => {
    const setAssistantContext = vi.fn()

    renderHook(() =>
      useBuilderShellAssistantSync({
        activeAppId: null,
        activeAppOrgSlug: null,
        organizationSlug: 'org_1',
        builderAssistantContext: null,
        setAssistantContext,
      })
    )

    expect(setAssistantContext).toHaveBeenCalledWith({
      assistantMode: undefined,
      storageKey: undefined,
      builder: undefined,
    })
  })

  it('sets builder assistant context for active app', () => {
    const setAssistantContext = vi.fn()
    const builderAssistantContext = {
      appId: 'app_1',
      appName: 'App',
      pages: [{ id: 'p_1', name: 'Main' }],
    }

    renderHook(() =>
      useBuilderShellAssistantSync({
        activeAppId: 'app_1',
        activeAppOrgSlug: 'org_active',
        organizationSlug: 'org_fallback',
        builderAssistantContext,
        setAssistantContext,
      })
    )

    expect(setAssistantContext).toHaveBeenCalledWith({
      assistantMode: 'builder',
      storageKey: 'builder:app_1',
      orgSlug: 'org_active',
      builder: builderAssistantContext,
    })
  })
})
