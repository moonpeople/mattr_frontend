import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const sectionFieldKeys = ['showSeparator', 'padding']
const titleFieldKeys = ['text', 'size', 'align']
const closeButtonFieldKeys = ['label', 'showLabel', 'variant', 'size']

export const FrameSectionInspector: WidgetInspectorConfig = buildInspectorConfig(sectionFieldKeys, {
  padding: {
    options: [
      { label: 'Normal', value: 'normal' },
      { label: 'None', value: 'none' },
    ],
  },
})

export const FrameTitleInspector: WidgetInspectorConfig = buildInspectorConfig(titleFieldKeys, {
  text: {
    placeholder: 'Title',
  },
  size: {
    type: 'select',
    options: [
      { label: 'Small', value: 'sm' },
      { label: 'Medium', value: 'md' },
      { label: 'Large', value: 'lg' },
    ],
  },
})

export const FrameCloseButtonInspector: WidgetInspectorConfig = buildInspectorConfig(
  closeButtonFieldKeys,
  {
    label: {
      placeholder: 'Close',
    },
    variant: {
      options: [
        { label: 'Text', value: 'text' },
        { label: 'Default', value: 'default' },
        { label: 'Outline', value: 'outline' },
      ],
    },
    size: {
      type: 'select',
      options: [
        { label: 'Tiny', value: 'tiny' },
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
      ],
    },
  }
)
