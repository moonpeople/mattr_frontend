/**
 * Тесты runtime-context hook-а BuilderShell.
 */
import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { BuilderApp } from 'data/builder/builder-apps'
import type { BuilderJsFunction } from 'data/builder/builder-js'
import type { BuilderQuery } from 'data/builder/builder-queries'

import {
  createDefaultMainFrame,
  createEmptyPageFrames,
  type BuilderPage,
  type BuilderQueryRunResult,
  type BuilderWidgetInstance,
} from '../../types'
import { useBuilderShellRuntimeContexts } from './useBuilderShellRuntimeContexts'

const createWidget = (
  id: string,
  type = 'TextInput',
  props: Record<string, unknown> = {}
): BuilderWidgetInstance => ({
  id,
  type,
  props,
})

const createPage = (id = 'page_1', widgets: BuilderWidgetInstance[] = []): BuilderPage => ({
  id,
  name: id,
  layout: {},
  pageLayout: {
    main: createDefaultMainFrame(),
    widgets,
    frames: createEmptyPageFrames(),
  },
  menu: null,
  pageMeta: { url: id },
})

describe('useBuilderShellRuntimeContexts', () => {
  it('builds assistant context and event/query maps', () => {
    const pageWidget = createWidget('input_1', 'TextInput', {
      formDataKey: '{{ self.id }}',
      value: 'A',
    })
    const page = createPage('page_1', [pageWidget])

    const apps: BuilderApp[] = [
      {
        id: 'app_1',
        name: 'App One',
        orgSlug: 'org_1',
      },
    ]
    const queries: BuilderQuery[] = [
      {
        id: 'query_users',
        appId: 'app_1',
        name: 'queryUsers',
        type: 'rest',
        config: {},
      },
      {
        id: 'state_count',
        appId: 'app_1',
        name: 'stateCount',
        type: 'variable',
        config: {},
      },
    ]
    const queryRuns: Record<string, BuilderQueryRunResult> = {
      query_users: {
        queryId: 'query_users',
        name: 'queryUsers',
        status: 'running',
        data: null,
      },
      state_count: {
        queryId: 'state_count',
        name: 'stateCount',
        status: 'success',
        data: 42,
      },
    }
    const jsFunctions: BuilderJsFunction[] = [
      {
        id: 'js_1',
        appId: 'app_1',
        name: 'transformerOne',
        code: 'export function main() {}',
        hash: null,
      },
    ]

    const { result } = renderHook(() =>
      useBuilderShellRuntimeContexts({
        activeAppId: 'app_1',
        activeAppName: 'App One',
        activeAppOrgSlug: 'org_1',
        appName: 'Fallback App Name',
        appUrl: 'app-one',
        organizationSlug: 'org_1',
        activePage: page,
        pages: [page],
        apps,
        queries,
        queryRuns,
        jsFunctions,
        appFrameWidgets: [],
        activePageFrameWidgets: [],
        activePageWidgets: [pageWidget],
        user: { id: 'user_1', email: 'user@example.com' },
        viewport: { width: 1440, height: 900 },
        normalizedThemeMode: 'light',
        routerAsPath: '/builder?appId=app_1',
      })
    )

    expect(result.current.builderAssistantContext).toMatchObject({
      appId: 'app_1',
      appName: 'App One',
      orgSlug: 'org_1',
      activePage: { id: 'page_1', name: 'page_1', url: 'page_1' },
      pages: [{ id: 'page_1', name: 'page_1', url: 'page_1' }],
      widgetSummary: {
        total: 1,
        byType: { TextInput: 1 },
      },
    })

    expect(result.current.eventTargets).toEqual([
      {
        id: 'input_1',
        label: expect.stringContaining('input_1'),
        type: 'TextInput',
      },
    ])
    expect(result.current.eventQueries).toEqual([
      { id: 'query_users', label: 'queryUsers' },
    ])
    expect(result.current.eventVariables).toEqual([
      { id: 'stateCount', label: 'stateCount' },
    ])

    const inspectorInfo = result.current.inspectorFxContextInfo as {
      runningQueries: string[]
      queryResults: Record<string, { data?: unknown; isFetching?: boolean }>
      widgetValues: Record<string, Record<string, unknown>>
    }

    expect(inspectorInfo.runningQueries).toEqual(['queryUsers'])
    expect(inspectorInfo.queryResults.query_users).toMatchObject({
      data: null,
      isFetching: true,
    })
    expect(inspectorInfo.queryResults.stateCount).toMatchObject({ data: 42 })
    expect(inspectorInfo.widgetValues.input_1).toMatchObject({
      id: 'input_1',
      type: expect.any(String),
      hidden: false,
    })

    const canvasContext = result.current.canvasEvaluationContext as {
      widgets: Record<string, Record<string, unknown>>
      state: Record<string, unknown>
      queries: Record<string, { data?: unknown; isFetching?: boolean }>
    }

    expect(canvasContext.widgets.input_1?.formDataKey).toBe('input_1')
    expect(canvasContext.state.stateCount).toBe(42)
    expect(canvasContext.queries.queryUsers).toMatchObject({ isFetching: true })
  })
})
