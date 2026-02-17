/**
 * Тесты code-ops hook-а BuilderShell.
 */
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { BuilderJsFunction } from 'data/builder/builder-js'
import type { BuilderQuery } from 'data/builder/builder-queries'

import { useBuilderShellCodeOps } from './useBuilderShellCodeOps'

const createQuery = (id: string, type = 'rest'): BuilderQuery => ({
  id,
  appId: 'app_1',
  name: id,
  type,
  config: {},
  trigger: null,
})

const createJs = (id: string): BuilderJsFunction => ({
  id,
  appId: 'app_1',
  name: id,
  code: 'export function main() {}',
  hash: null,
})

describe('useBuilderShellCodeOps', () => {
  it('opens tabs for selected code entities and resets selection if entity disappears', async () => {
    const query = createQuery('query_1')
    const { result, rerender } = renderHook(
      ({ queries }: { queries: BuilderQuery[] }) =>
        useBuilderShellCodeOps({
          activeAppId: 'app_1',
          queries,
          jsFunctions: [],
          canvasTabId: 'canvas',
        }),
      {
        initialProps: { queries: [query] },
      }
    )

    act(() => {
      result.current.handleSelectCodeItem({ type: 'query', id: query.id })
    })

    expect(result.current.codeSelection).toEqual({ type: 'query', id: query.id })
    expect(result.current.activeCodeTabId).toBe('query-query_1')
    expect(result.current.codeTabs.map((tab) => tab.id)).toContain('query-query_1')

    rerender({ queries: [] })

    await waitFor(() => {
      expect(result.current.codeSelection).toBeNull()
      expect(result.current.activeCodeTabId).toBe('canvas')
      expect(result.current.codeTabs).toEqual([{ id: 'canvas', type: 'canvas' }])
    })
  })

  it('resets runtime/tab state when active app changes', async () => {
    const query = createQuery('query_1')
    const js = createJs('js_1')

    const { result, rerender } = renderHook(
      ({ activeAppId }: { activeAppId: string }) =>
        useBuilderShellCodeOps({
          activeAppId,
          queries: [query],
          jsFunctions: [js],
          canvasTabId: 'canvas',
        }),
      {
        initialProps: { activeAppId: 'app_1' },
      }
    )

    act(() => {
      result.current.handleSelectCodeItem({ type: 'transformer', id: js.id })
      result.current.handleQueryRun({
        queryId: query.id,
        name: query.name,
        status: 'success',
        data: { ok: true },
      })
    })

    expect(result.current.lastQueryRun?.queryId).toBe(query.id)
    expect(result.current.queryRuns[query.id]?.status).toBe('success')
    expect(result.current.activeCodeTabId).toBe('transformer-js_1')

    rerender({ activeAppId: 'app_2' })

    await waitFor(() => {
      expect(result.current.lastQueryRun).toBeNull()
      expect(result.current.queryRuns).toEqual({})
      expect(result.current.codeSelection).toBeNull()
      expect(result.current.activeCodeTabId).toBe('canvas')
      expect(result.current.codeTabs).toEqual([{ id: 'canvas', type: 'canvas' }])
    })
  })
})
