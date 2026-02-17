/**
 * Производные вычисления shell: target page, duplicate-валидность, runtime payload и preview policies.
 */
import { useMemo } from 'react'

import type { BuilderApp } from 'data/builder/builder-apps'
import type { BuilderJsFunction } from 'data/builder/builder-js'
import type { BuilderQuery } from 'data/builder/builder-queries'
import {
  buildRuntimePayload,
  type BuilderRuntimePayload,
} from 'data/builder/builder-runtime'
import type { BuilderAppTheme } from 'state/app-theme-state'

import type {
  BuilderAppLayout,
  BuilderPage,
  BuilderWidgetInstance,
} from '../../types'
import {
  canDuplicateWidgetForMode,
  type BuilderWidgetMode,
} from '../../utils/frame-ops'
import { collectPolicyKeys } from '../layout-ops'

export interface UseBuilderShellDerivedStateParams {
  activePage: BuilderPage | undefined
  activePageId: string | null
  pages: BuilderPage[]
  appLayout: BuilderAppLayout
  appFrameWidgets: BuilderWidgetInstance[]
  selectedWidget: BuilderWidgetInstance | null
  selectedWidgetMode: BuilderWidgetMode | null
  activeApp?: BuilderApp
  queries: BuilderQuery[]
  jsFunctions: BuilderJsFunction[]
  normalizedTheme: BuilderAppTheme
  runtimeData?: BuilderRuntimePayload
}

export const useBuilderShellDerivedState = ({
  activePage,
  activePageId,
  pages,
  appLayout,
  appFrameWidgets,
  selectedWidget,
  selectedWidgetMode,
  activeApp,
  queries,
  jsFunctions,
  normalizedTheme,
  runtimeData,
}: UseBuilderShellDerivedStateParams) => {
  const targetPageForFrameOps = useMemo(() => {
    const targetPageId = activePageId ?? pages[0]?.id
    if (!targetPageId) {
      return null
    }
    if (activePage?.id === targetPageId) {
      return activePage
    }
    return pages.find((page) => page.id === targetPageId) ?? null
  }, [activePage, activePageId, pages])

  const canDuplicateSelectedWidget = useMemo(
    () =>
      canDuplicateWidgetForMode({
        widget: selectedWidget,
        mode: selectedWidgetMode,
        appLayout,
        targetPage: targetPageForFrameOps,
      }),
    [appLayout, selectedWidget, selectedWidgetMode, targetPageForFrameOps]
  )

  const runtimePayload = useMemo(
    () =>
      activeApp
        ? buildRuntimePayload(activeApp, pages, queries, jsFunctions, appLayout, normalizedTheme)
        : null,
    [activeApp, normalizedTheme, pages, queries, jsFunctions, appLayout]
  )

  const localPolicyKeys = useMemo(
    () => collectPolicyKeys(pages, appFrameWidgets),
    [pages, appFrameWidgets]
  )

  const previewPolicies = useMemo(() => {
    const policies = runtimeData?.viewer?.policies
    if (!policies) {
      return undefined
    }
    const policyKeys = Object.keys(policies)
    if (policyKeys.length === 0) {
      return undefined
    }
    const coversAll = localPolicyKeys.every((key) => key in policies)
    return coversAll ? policies : undefined
  }, [runtimeData, localPolicyKeys])

  return {
    targetPageForFrameOps,
    canDuplicateSelectedWidget,
    runtimePayload,
    previewPolicies,
  }
}
