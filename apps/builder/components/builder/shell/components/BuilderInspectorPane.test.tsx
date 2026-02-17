/**
 * Smoke-тесты панели inspector в shell (header/menu actions + route rendering).
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { BuilderWidgetInstance } from '../../types'
import {
  BuilderInspectorPane,
  type BuilderInspectorPaneProps,
} from './BuilderInspectorPane'

vi.mock('../../inspector', () => ({
  BuilderInspector: () => <div data-testid="widget-inspector" />, 
  BuilderFrameInspector: () => <div data-testid="frame-inspector" />, 
  BuilderOverlayInspector: () => <div data-testid="overlay-inspector" />, 
  BuilderPageComponentInspector: () => <div data-testid="page-component-inspector" />, 
  BuilderAppInspector: () => <div data-testid="app-inspector" />, 
  BuilderPageInspector: () => <div data-testid="page-inspector" />, 
}))

const selectedWidget: BuilderWidgetInstance = {
  id: 'text1',
  type: 'Text',
  props: {},
  layout: undefined,
  spacing: {
    heightMode: 'fixed',
  },
  policy: [],
  visibleWhen: '',
  disabledWhen: '',
}

const IconStub = () => <svg data-testid="icon" />

const buildProps = (overrides: Partial<BuilderInspectorPaneProps> = {}): BuilderInspectorPaneProps => ({
  isPreviewing: false,
  selectedWidget,
  selectedWidgetIcon: IconStub,
  isRenamingWidget: false,
  renameInputRef: { current: null },
  renameDraft: selectedWidget.id,
  setRenameDraft: vi.fn(),
  onCommitWidgetRename: vi.fn(),
  onCancelWidgetRename: vi.fn(),
  isAddonPanelActive: false,
  activeAddonPanelLabel: null,
  onClearAddonPanel: vi.fn(),
  onStartWidgetRename: vi.fn(),
  inspectorMenuOpen: true,
  setInspectorMenuOpen: vi.fn(),
  selectedDefinitionLabel: 'Text',
  hasClipboardWidget: true,
  canDuplicateSelectedWidget: true,
  canDeleteSelectedWidget: true,
  onOpenStatePanel: vi.fn(),
  onCopyWidget: vi.fn(),
  onCutWidget: vi.fn(),
  onDuplicateWidget: vi.fn(),
  onResetWidgetState: vi.fn(),
  onDeleteWidget: vi.fn(),
  onCloseInspector: vi.fn(),
  route: 'page',
  overlayInspectorProps: null,
  frameInspectorProps: null,
  widgetInspectorProps: null,
  appInspectorProps: {
    appId: null,
    appName: 'App',
    activePage: null,
    appMeta: {},
    onUpdateMeta: vi.fn(),
  },
  pageComponentInspectorProps: {
    page: null,
    onUpdateComponent: vi.fn(),
  },
  pageInspectorProps: {
    page: null,
    pages: [],
    onUpdatePage: vi.fn(),
    onUpdateMeta: vi.fn(),
    onUpdateMenu: vi.fn(),
  },
  ...overrides,
})

describe('BuilderInspectorPane', () => {
  it('triggers menu actions for state/copy/delete', () => {
    const onOpenStatePanel = vi.fn()
    const onCopyWidget = vi.fn()
    const onDeleteWidget = vi.fn()
    const setInspectorMenuOpen = vi.fn()

    render(
      <BuilderInspectorPane
        {...buildProps({
          onOpenStatePanel,
          onCopyWidget,
          onDeleteWidget,
          setInspectorMenuOpen,
        })}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'View state' }))
    expect(onOpenStatePanel).toHaveBeenCalledOnce()
    expect(setInspectorMenuOpen).toHaveBeenCalledWith(false)

    fireEvent.click(screen.getByRole('button', { name: /Copy/i }))
    expect(onCopyWidget).toHaveBeenCalledOnce()

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onDeleteWidget).toHaveBeenCalledOnce()
  })

  it('renders route-specific inspector view', () => {
    render(<BuilderInspectorPane {...buildProps({ route: 'widget', widgetInspectorProps: {} as never })} />)

    expect(screen.getByTestId('widget-inspector')).toBeInTheDocument()
  })
})
