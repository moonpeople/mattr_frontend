import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const globalHeaderFieldKeys: string[] = []
const globalSidebarFieldKeys = [
  'description',
  'side',
  'width',
  'collapsible',
  'open',
  'showHeader',
  'showFooter',
]
const globalOverlayFieldKeys = [
  'showHeader',
  'showFooter',
  'showOverlay',
  'closeOnOutsideClick',
  'expandToFit',
  'padding',
  'bordered',
  'background',
  'events',
]

export const GlobalHeaderFrameInspector: WidgetInspectorConfig = buildInspectorConfig(
  globalHeaderFieldKeys,
  {}
)

export const GlobalSidebarFrameInspector: WidgetInspectorConfig = buildInspectorConfig(
  globalSidebarFieldKeys,
  {
    description: {
      placeholder: 'Optional description',
    },
    side: {
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' },
      ],
    },
    width: {
      section: 'Appearance',
      min: 120,
      max: 640,
      step: 10,
    },
  }
)

export const GlobalOverlayFrameInspector: WidgetInspectorConfig = buildInspectorConfig(
  globalOverlayFieldKeys,
  {
    events: {
      section: 'Interaction',
      placeholder: '[{"event":"toggle","type":"query","queryName":"onOverlayToggle"}]',
    },
  }
)
