/**
 * Тесты panel-sync hook-а BuilderShell.
 */
import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { ImperativePanelHandle } from 'ui'

import { useBuilderShellPanelSync } from './useBuilderShellPanelSync'

describe('useBuilderShellPanelSync', () => {
  it('syncs collapse/expand with sidebar and inspector visibility flags', () => {
    const sidebarHandle = {
      expand: vi.fn(),
      collapse: vi.fn(),
      resize: vi.fn(),
      getSize: vi.fn(() => 30),
    }
    const inspectorHandle = {
      expand: vi.fn(),
      collapse: vi.fn(),
      resize: vi.fn(),
      getSize: vi.fn(() => 30),
    }

    renderHook(() =>
      useBuilderShellPanelSync({
        showSidebar: false,
        inspectorOpen: true,
        isSettingsSection: false,
        sidebarPanelRef: { current: sidebarHandle as unknown as ImperativePanelHandle },
        inspectorPanelRef: { current: inspectorHandle as unknown as ImperativePanelHandle },
        sidebarPreviousSizeRef: { current: null },
      })
    )

    expect(sidebarHandle.collapse).toHaveBeenCalledTimes(1)
    expect(inspectorHandle.expand).toHaveBeenCalledTimes(1)
  })

  it('stores sidebar width in settings mode and restores it after exit', () => {
    const sidebarHandle = {
      expand: vi.fn(),
      collapse: vi.fn(),
      resize: vi.fn(),
      getSize: vi.fn(() => 24),
    }
    const inspectorHandle = {
      expand: vi.fn(),
      collapse: vi.fn(),
      resize: vi.fn(),
      getSize: vi.fn(() => 30),
    }
    const sidebarPreviousSizeRef = { current: null as number | null }
    const sidebarPanelRef = {
      current: sidebarHandle as unknown as ImperativePanelHandle,
    }
    const inspectorPanelRef = {
      current: inspectorHandle as unknown as ImperativePanelHandle,
    }

    const { rerender } = renderHook(
      (props: { isSettingsSection: boolean }) =>
        useBuilderShellPanelSync({
          showSidebar: true,
          inspectorOpen: false,
          isSettingsSection: props.isSettingsSection,
          sidebarPanelRef,
          inspectorPanelRef,
          sidebarPreviousSizeRef,
        }),
      { initialProps: { isSettingsSection: true } }
    )

    expect(sidebarHandle.getSize).toHaveBeenCalledTimes(1)
    expect(sidebarHandle.resize).toHaveBeenCalledWith(40)
    expect(sidebarPreviousSizeRef.current).toBe(24)

    rerender({ isSettingsSection: false })

    expect(sidebarHandle.resize).toHaveBeenCalledWith(24)
    expect(sidebarPreviousSizeRef.current).toBeNull()
  })
})
