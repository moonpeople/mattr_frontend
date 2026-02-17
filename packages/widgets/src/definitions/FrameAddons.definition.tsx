import { Button, cn } from 'ui'

import { renderWidgetIcon } from '../icon-library'
import { createWidgetDefinition } from '../types'
export type FrameSectionProps = {
  showSeparator: boolean
  padding: 'normal' | 'none'
}

const sectionPaddingClasses: Record<FrameSectionProps['padding'], string> = {
  normal: 'px-3 py-2',
  none: 'px-0 py-0',
}

const createFrameSection = (type: string, label: string) =>
  createWidgetDefinition<FrameSectionProps>({
    type,
    label,
    category: 'globals',
    description: `${label} area for overlay frames`,
    supportsChildren: true,
    defaultProps: {
      showSeparator: true,
      padding: 'normal',
    },
    render: (props) => (
      <div
        className={cn(
          'rounded-md border border-dashed border-border/40 text-[10px] uppercase text-muted-foreground',
          sectionPaddingClasses[props.padding],
          props.showSeparator ? 'border-border/40' : 'border-transparent'
        )}
      >
        {label}
      </div>
    ),
  })

export type FrameTitleProps = {
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

const createFrameTitle = (type: string, label: string) =>
  createWidgetDefinition<FrameTitleProps>({
    type,
    label,
    category: 'globals',
    description: `${label} text`,
    defaultProps: {
      text: 'Container title',
      size: 'lg',
      align: 'left',
    },
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

export type FrameCloseButtonProps = {
  label: string
  showLabel: boolean
  variant: 'text' | 'default' | 'outline'
  size: 'tiny' | 'small' | 'medium'
  events: unknown
}

const createFrameCloseButton = (type: string, label: string) =>
  createWidgetDefinition<FrameCloseButtonProps>({
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
    builder: {
      resizeHandles: [],
    },
    render: (props, context) => (
      <Button
        type={props.variant}
        size={props.size}
        icon={renderWidgetIcon('x', { library: context?.iconLibrary, size: 12 })}
        aria-label={props.label}
        className={props.variant === 'outline' ? 'border-transparent' : undefined}
        onClick={() => context?.runActions?.('click')}
      >
        {props.showLabel ? props.label : null}
      </Button>
    ),
  })

export const DrawerHeaderDefinition = createFrameSection('DrawerHeader', 'Drawer Header')
export const DrawerFooterDefinition = createFrameSection('DrawerFooter', 'Drawer Footer')
export const DrawerTitleDefinition = createFrameTitle('DrawerTitle', 'Drawer Title')
export const DrawerCloseButtonDefinition = createFrameCloseButton(
  'DrawerCloseButton',
  'Drawer Close Button'
)

export const ModalHeaderDefinition = createFrameSection('ModalHeader', 'Modal Header')
export const ModalFooterDefinition = createFrameSection('ModalFooter', 'Modal Footer')
export const ModalTitleDefinition = createFrameTitle('ModalTitle', 'Modal Title')
export const ModalCloseButtonDefinition = createFrameCloseButton(
  'ModalCloseButton',
  'Modal Close Button'
)
