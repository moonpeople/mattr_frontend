import { X } from 'lucide-react'
import { Button, cn } from 'ui'

import type { WidgetDefinition } from '../types'

type FrameSectionProps = {
  showSeparator: boolean
  padding: 'normal' | 'none'
}

const sectionPaddingClasses: Record<FrameSectionProps['padding'], string> = {
  normal: 'px-3 py-2',
  none: 'px-0 py-0',
}

const createFrameSection = (
  type: string,
  label: string
): WidgetDefinition<FrameSectionProps> => ({
  type,
  label,
  category: 'globals',
  description: `${label} area for overlay frames`,
  supportsChildren: true,
  defaultProps: {
    showSeparator: true,
    padding: 'normal',
  },
  fields: [
    { key: 'showSeparator', label: 'Show separator', type: 'boolean' },
    {
      key: 'padding',
      label: 'Padding',
      type: 'select',
      options: [
        { label: 'Normal', value: 'normal' },
        { label: 'None', value: 'none' },
      ],
    },
  ],
  render: (props) => (
    <div
      className={cn(
        'rounded-md border border-dashed border-foreground-muted/40 text-[10px] uppercase text-foreground-muted',
        sectionPaddingClasses[props.padding],
        props.showSeparator ? 'border-foreground-muted/40' : 'border-transparent'
      )}
    >
      {label}
    </div>
  ),
})

type FrameTitleProps = {
  text: string
  size: 'sm' | 'md' | 'lg'
  align: 'left' | 'center' | 'right'
}

const titleSizeClasses: Record<FrameTitleProps['size'], string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
}

const titleAlignClasses: Record<FrameTitleProps['align'], string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

const createFrameTitle = (
  type: string,
  label: string
): WidgetDefinition<FrameTitleProps> => ({
  type,
  label,
  category: 'globals',
  description: `${label} text`,
  defaultProps: {
    text: 'Container title',
    size: 'lg',
    align: 'left',
  },
  fields: [
    { key: 'text', label: 'Text', type: 'text', placeholder: 'Title' },
    {
      key: 'size',
      label: 'Size',
      type: 'select',
      options: [
        { label: 'Small', value: 'sm' },
        { label: 'Medium', value: 'md' },
        { label: 'Large', value: 'lg' },
      ],
    },
    {
      key: 'align',
      label: 'Align',
      type: 'select',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' },
      ],
    },
  ],
  render: (props) => (
    <div
      className={cn(
        'font-semibold text-foreground',
        titleSizeClasses[props.size],
        titleAlignClasses[props.align]
      )}
    >
      {props.text}
    </div>
  ),
})

type FrameCloseButtonProps = {
  label: string
  showLabel: boolean
  variant: 'text' | 'default' | 'outline'
  size: 'tiny' | 'small' | 'medium'
  events: unknown
}

const createFrameCloseButton = (
  type: string,
  label: string
): WidgetDefinition<FrameCloseButtonProps> => ({
  type,
  label,
  category: 'globals',
  description: `${label} button`,
  defaultProps: {
    label: 'Close',
    showLabel: false,
    variant: 'outline',
    size: 'tiny',
    events: [],
  },
  fields: [
    { key: 'label', label: 'Label', type: 'text', placeholder: 'Close' },
    { key: 'showLabel', label: 'Show label', type: 'boolean' },
    {
      key: 'variant',
      label: 'Variant',
      type: 'select',
      options: [
        { label: 'Text', value: 'text' },
        { label: 'Default', value: 'default' },
        { label: 'Outline', value: 'outline' },
      ],
    },
    {
      key: 'size',
      label: 'Size',
      type: 'select',
      options: [
        { label: 'Tiny', value: 'tiny' },
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
      ],
    },
  ],
  builder: {
    resizeHandles: [],
  },
  render: (props, context) => (
    <Button
      type={props.variant}
      size={props.size}
      icon={<X size={12} />}
      aria-label={props.label}
      className={props.variant === 'outline' ? 'border-transparent' : undefined}
      onClick={() => context?.runActions?.('click')}
    >
      {props.showLabel ? props.label : null}
    </Button>
  ),
})

export const DrawerHeaderWidget = createFrameSection('DrawerHeader', 'Drawer Header')
export const DrawerFooterWidget = createFrameSection('DrawerFooter', 'Drawer Footer')
export const DrawerTitleWidget = createFrameTitle('DrawerTitle', 'Drawer Title')
export const DrawerCloseButtonWidget = createFrameCloseButton(
  'DrawerCloseButton',
  'Drawer Close Button'
)

export const ModalHeaderWidget = createFrameSection('ModalHeader', 'Modal Header')
export const ModalFooterWidget = createFrameSection('ModalFooter', 'Modal Footer')
export const ModalTitleWidget = createFrameTitle('ModalTitle', 'Modal Title')
export const ModalCloseButtonWidget = createFrameCloseButton(
  'ModalCloseButton',
  'Modal Close Button'
)
