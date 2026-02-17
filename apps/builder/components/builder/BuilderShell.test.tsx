/**
 * Controller-level smoke тест BuilderShell:
 * add widget -> select widget -> save draft -> preview/publish.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { BuilderShell } from './BuilderShell'

const mocks = vi.hoisted(() => ({
  useParams: vi.fn(),
  useUser: vi.fn(),
  useRouter: vi.fn(),
  useSelectedOrganizationQuery: vi.fn(),
  useOrganizationsQuery: vi.fn(),
  useAiAssistantState: vi.fn(),
  useBuilderShellData: vi.fn(),
  useBuilderShellThemeSync: vi.fn(),
  useBuilderShellCodeOps: vi.fn(),
  useBuilderDraftAutosave: vi.fn(),
  useBuilderPreviewPublishActions: vi.fn(),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

vi.mock('nuqs', async () => {
  const React = await import('react')
  return {
    parseAsString: {
      withDefault: (_value: string) => '',
    },
    useQueryState: (_key: string) => React.useState(''),
  }
})

vi.mock('common', () => ({
  LOCAL_STORAGE_KEYS: {
    LAST_VISITED_ORGANIZATION: 'last-visited-organization',
  },
  useParams: () => mocks.useParams(),
  useUser: () => mocks.useUser(),
}))

vi.mock('next/router', () => ({
  useRouter: () => mocks.useRouter(),
}))

vi.mock('hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: () => mocks.useSelectedOrganizationQuery(),
}))

vi.mock('data/organizations/organizations-query', () => ({
  useOrganizationsQuery: () => mocks.useOrganizationsQuery(),
}))

vi.mock('state/ai-assistant-state', () => ({
  useAiAssistantState: () => mocks.useAiAssistantState(),
}))

vi.mock('hooks/misc/useLocalStorage', async () => {
  const React = await import('react')
  return {
    useLocalStorageQuery: <T,>(_key: string, initialValue: T) => React.useState(initialValue),
  }
})

vi.mock('./shell/hooks', async () => {
  const actual = await vi.importActual<typeof import('./shell/hooks')>('./shell/hooks')
  return {
    ...actual,
    useBuilderShellData: (params: unknown) => mocks.useBuilderShellData(params),
    useBuilderShellThemeSync: (params: unknown) => mocks.useBuilderShellThemeSync(params),
    useBuilderShellCodeOps: (params: unknown) => mocks.useBuilderShellCodeOps(params),
  }
})

vi.mock('./autosave', async () => {
  const actual = await vi.importActual<typeof import('./autosave')>('./autosave')
  return {
    ...actual,
    useBuilderDraftAutosave: (params: unknown) => mocks.useBuilderDraftAutosave(params),
    useBuilderPreviewPublishActions: (params: unknown) => mocks.useBuilderPreviewPublishActions(params),
  }
})

vi.mock('./shell/components/BuilderShellView', () => ({
  BuilderShellView: (props: {
    canvasProps: { widgets?: Array<{ id?: string }>; onSelectWidget: (widgetId: string) => void }
    sidebarProps: { onAddWidget: (widgetType: string) => void }
    publishDialogProps: { onConfirmPublish: () => void }
    inspectorPaneProps: { route: string }
    headerActions: ReactNode
  }) => {
    const firstWidgetId = props.canvasProps.widgets?.[0]?.id as string | undefined
    return (
      <div data-testid="shell-view">
        <div data-testid="widgets-count">{String(props.canvasProps.widgets?.length ?? 0)}</div>
        <div data-testid="inspector-route">{props.inspectorPaneProps.route}</div>
        <button type="button" onClick={() => props.sidebarProps.onAddWidget('Text')}>
          mock-add-widget
        </button>
        <button
          type="button"
          onClick={() => {
            if (firstWidgetId) {
              props.canvasProps.onSelectWidget(firstWidgetId)
            }
          }}
        >
          mock-select-first
        </button>
        <button type="button" onClick={() => props.publishDialogProps.onConfirmPublish()}>
          mock-confirm-publish
        </button>
        {props.headerActions}
      </div>
    )
  },
}))

describe('BuilderShell controller smoke', () => {
  it('handles add/select/save/preview/publish flow via shell controller actions', async () => {
    const saveNow = vi.fn(async () => undefined)
    const openPreview = vi.fn()
    const confirmPublish = vi.fn()
    const aiSetContext = vi.fn()
    const routerPush = vi.fn()

    document.body.innerHTML = '<div id="builder-header-actions"></div>'

    mocks.useParams.mockReturnValue({ ref: 'project_ref', appId: 'app_1' })
    mocks.useUser.mockReturnValue({ id: 'user_1' })
    mocks.useRouter.mockReturnValue({ push: routerPush, asPath: '/builder?appId=app_1' })
    mocks.useSelectedOrganizationQuery.mockReturnValue({ data: { slug: 'org_1' } })
    mocks.useOrganizationsQuery.mockReturnValue({
      data: [{ slug: 'org_1', name: 'Org 1' }],
      isPending: false,
    })
    mocks.useAiAssistantState.mockReturnValue({ setContext: aiSetContext })

    mocks.useBuilderShellData.mockReturnValue({
      apps: [
        {
          id: 'app_1',
          name: 'Test app',
          orgSlug: 'org_1',
          projectRef: 'project_ref',
          theme: null,
        },
      ],
      isAppsLoading: false,
      activeApp: {
        id: 'app_1',
        name: 'Test app',
        orgSlug: 'org_1',
        projectRef: 'project_ref',
        theme: null,
      },
      activeAppId: 'app_1',
      activeProjectRef: 'project_ref',
      project: {
        name: 'Project 1',
        restUrl: null,
        connectionString: null,
      },
      draftData: { schema: {} },
      isDraftLoading: false,
      remotePages: [
        {
          id: 'page_1',
          appId: 'app_1',
          name: 'Main',
          access: 'auth',
          menu: null,
          layout: {
            pageLayout: {
              main: {
                expandToFit: false,
                background: '',
                paddingMode: 'normal',
                paddingFxEnabled: false,
                paddingFx: '',
              },
              widgets: [],
              frames: { drawers: [], modals: [] },
            },
            pageMeta: {},
          },
        },
      ],
      isPagesLoading: false,
      createAppMutation: { isPending: false, mutate: vi.fn(), error: null },
      updateAppMutation: { isPending: false, mutate: vi.fn() },
      createPageMutation: { isPending: false, mutate: vi.fn() },
      deletePageMutation: { isPending: false, mutate: vi.fn() },
      queries: [],
      createQueryMutation: { mutate: vi.fn() },
      updateQueryMutation: { mutate: vi.fn() },
      jsFunctions: [],
      createJsMutation: { mutate: vi.fn() },
      updateJsMutation: { mutate: vi.fn() },
      runtimeData: null,
      publishRuntimeMutation: { isPending: false, mutate: vi.fn() },
      upsertDraftMutation: { isPending: false, mutateAsync: vi.fn(async () => ({})) },
    })

    mocks.useBuilderShellThemeSync.mockReturnValue({
      appTheme: { theme: { customCss: '', shadcn: { iconLibrary: 'lucide' } } },
      normalizedTheme: { mode: 'light' },
      appThemeCssVars: {},
    })

    mocks.useBuilderShellCodeOps.mockReturnValue({
      lastQueryRun: null,
      setLastQueryRun: vi.fn(),
      queryRuns: {},
      codeSelection: null,
      setCodeSelection: vi.fn(),
      codeTabs: [{ id: 'canvas', type: 'canvas' }],
      activeCodeTabId: 'canvas',
      handleQueryRun: vi.fn(),
      handleSelectCodeItem: vi.fn(),
      handleSelectCodeTab: vi.fn(),
      handleCloseCodeTab: vi.fn(),
    })

    mocks.useBuilderDraftAutosave.mockReturnValue({
      isSaving: false,
      isDraftSynced: true,
      saveNow,
      flushLatest: vi.fn(async () => undefined),
    })
    mocks.useBuilderPreviewPublishActions.mockReturnValue({
      openPreview,
      confirmPublish,
      canPublish: true,
    })

    render(<BuilderShell />)

    expect(await screen.findByTestId('shell-view')).toBeInTheDocument()
    expect(screen.getByTestId('widgets-count')).toHaveTextContent('0')
    expect(screen.getByTestId('inspector-route')).toHaveTextContent('page')

    fireEvent.click(screen.getByRole('button', { name: 'mock-add-widget' }))
    await waitFor(() => {
      expect(screen.getByTestId('widgets-count')).toHaveTextContent('1')
    })

    fireEvent.click(screen.getByRole('button', { name: 'mock-select-first' }))
    await waitFor(() => {
      expect(screen.getByTestId('inspector-route')).toHaveTextContent('widget')
    })

    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))
    await waitFor(() => {
      expect(saveNow).toHaveBeenCalledTimes(1)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
    expect(openPreview).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'mock-confirm-publish' }))
    expect(confirmPublish).toHaveBeenCalledTimes(1)
  })
})
