/**
 * Инспектор frame-элемента: настройки frame props, поведения и внешнего вида.
 */
import { BuilderInspector, type BuilderInspectorProps } from './BuilderInspector'

export type BuilderFrameInspectorProps = Omit<
  BuilderInspectorProps,
  'parentWidget' | 'activeAddonPanel' | 'onActiveAddonPanelChange'
>

export const BuilderFrameInspector = (props: BuilderFrameInspectorProps) => (
  <BuilderInspector
    {...props}
    parentWidget={null}
    activeAddonPanel={null}
    onActiveAddonPanelChange={undefined}
  />
)
