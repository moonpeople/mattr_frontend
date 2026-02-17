/**
 * Code-ops hook BuilderShell: tabs/selection и состояние запусков query в code-режиме.
 */
import { useCallback, useEffect, useState } from 'react'

import type { BuilderJsFunction } from 'data/builder/builder-js'
import type { BuilderQuery } from 'data/builder/builder-queries'

import type { BuilderCodeTab } from '../../BuilderCodeTabs'
import type { BuilderCodeSelection } from '../../BuilderCodeUtils'
import type { BuilderQueryRunResult } from '../../types'
import { buildCodeTab, normalizeCodeTabs } from '../selectors'

const DEFAULT_CANVAS_TAB_ID = 'canvas'

export interface UseBuilderShellCodeOpsParams {
  activeAppId?: string | null
  queries: BuilderQuery[]
  jsFunctions: BuilderJsFunction[]
  canvasTabId?: string
}

export const useBuilderShellCodeOps = ({
  activeAppId,
  queries,
  jsFunctions,
  canvasTabId = DEFAULT_CANVAS_TAB_ID,
}: UseBuilderShellCodeOpsParams) => {
  const [lastQueryRun, setLastQueryRun] = useState<BuilderQueryRunResult | null>(null)
  const [queryRuns, setQueryRuns] = useState<Record<string, BuilderQueryRunResult>>({})
  const [codeSelection, setCodeSelection] = useState<BuilderCodeSelection>(null)
  const [codeTabs, setCodeTabs] = useState<BuilderCodeTab[]>([{ id: canvasTabId, type: 'canvas' }])
  const [activeCodeTabId, setActiveCodeTabId] = useState(canvasTabId)

  useEffect(() => {
    setLastQueryRun(null)
    setQueryRuns({})
  }, [activeAppId])

  useEffect(() => {
    setCodeTabs([{ id: canvasTabId, type: 'canvas' }])
    setActiveCodeTabId(canvasTabId)
    setCodeSelection(null)
  }, [activeAppId, canvasTabId])

  useEffect(() => {
    if (!codeSelection) {
      return
    }
    if (
      (codeSelection.type === 'query' || codeSelection.type === 'variable') &&
      !queries.some((query) => query.id === codeSelection.id)
    ) {
      setCodeSelection(null)
      return
    }
    if (
      codeSelection.type === 'transformer' &&
      !jsFunctions.some((func) => func.id === codeSelection.id)
    ) {
      setCodeSelection(null)
    }
  }, [codeSelection, jsFunctions, queries])

  useEffect(() => {
    const tab = buildCodeTab(codeSelection, canvasTabId)
    if (!tab) {
      return
    }
    setCodeTabs((prev) => (prev.some((item) => item.id === tab.id) ? prev : [...prev, tab]))
    setActiveCodeTabId(tab.id)
  }, [canvasTabId, codeSelection])

  useEffect(() => {
    setCodeTabs((prev) => {
      const next = prev.filter((tab) => {
        if (tab.type === 'canvas') {
          return true
        }
        if (tab.type === 'transformer') {
          return jsFunctions.some((func) => func.id === tab.entityId)
        }
        return queries.some((query) => query.id === tab.entityId)
      })
      const normalized = normalizeCodeTabs(next, canvasTabId)
      if (normalized.length === prev.length) {
        const unchanged = normalized.every((tab, index) => {
          const current = prev[index]
          return (
            current &&
            tab.id === current.id &&
            tab.type === current.type &&
            tab.entityId === current.entityId
          )
        })
        if (unchanged) {
          return prev
        }
      }
      return normalized
    })
  }, [canvasTabId, jsFunctions, queries])

  useEffect(() => {
    if (codeTabs.some((tab) => tab.id === activeCodeTabId)) {
      return
    }
    const fallback = codeTabs[codeTabs.length - 1]?.id ?? canvasTabId
    setActiveCodeTabId(fallback)
    const fallbackTab = codeTabs.find((tab) => tab.id === fallback)
    if (!fallbackTab || fallbackTab.type === 'canvas') {
      setCodeSelection(null)
      return
    }
    setCodeSelection({ type: fallbackTab.type, id: fallbackTab.entityId ?? '' })
  }, [activeCodeTabId, canvasTabId, codeTabs])

  const handleQueryRun = useCallback((result: BuilderQueryRunResult) => {
    setLastQueryRun(result)
    setQueryRuns((prev) => ({ ...prev, [result.queryId]: result }))
  }, [])

  const handleSelectCodeItem = useCallback(
    (selection: BuilderCodeSelection) => {
      if (!selection) {
        setCodeSelection(null)
        return
      }
      setCodeSelection(selection)
      const tab = buildCodeTab(selection, canvasTabId)
      if (!tab) {
        return
      }
      setCodeTabs((prev) => (prev.some((item) => item.id === tab.id) ? prev : [...prev, tab]))
      setActiveCodeTabId(tab.id)
    },
    [canvasTabId]
  )

  const handleSelectCodeTab = useCallback(
    (tabId: string) => {
      setActiveCodeTabId(tabId)
      const tab = codeTabs.find((item) => item.id === tabId)
      if (!tab || tab.type === 'canvas') {
        setCodeSelection(null)
        return
      }
      setCodeSelection({ type: tab.type, id: tab.entityId ?? '' })
    },
    [codeTabs]
  )

  const handleCloseCodeTab = useCallback(
    (tabId: string) => {
      if (tabId === canvasTabId) {
        return
      }
      const nextTabs = codeTabs.filter((tab) => tab.id !== tabId)
      setCodeTabs(normalizeCodeTabs(nextTabs, canvasTabId))
      if (activeCodeTabId !== tabId) {
        return
      }
      const fallback = nextTabs[nextTabs.length - 1]?.id ?? canvasTabId
      setActiveCodeTabId(fallback)
      const fallbackTab = nextTabs.find((tab) => tab.id === fallback)
      if (!fallbackTab || fallbackTab.type === 'canvas') {
        setCodeSelection(null)
        return
      }
      setCodeSelection({ type: fallbackTab.type, id: fallbackTab.entityId ?? '' })
    },
    [activeCodeTabId, canvasTabId, codeTabs]
  )

  return {
    lastQueryRun,
    setLastQueryRun,
    queryRuns,
    setQueryRuns,
    codeSelection,
    setCodeSelection,
    codeTabs,
    setCodeTabs,
    activeCodeTabId,
    setActiveCodeTabId,
    handleQueryRun,
    handleSelectCodeItem,
    handleSelectCodeTab,
    handleCloseCodeTab,
  }
}
