import type { WidgetDefinition } from 'widgets/runtime'

import type { BuilderWidgetInstance, BuilderWidgetSpacing } from './types'

const DEFAULT_MARGIN = '4px 8px'

export const buildSelfContext = ({
  widget,
  definition,
  spacing,
  widgetValues,
}: {
  widget: BuilderWidgetInstance
  definition?: WidgetDefinition
  spacing: Required<BuilderWidgetSpacing>
  widgetValues?: Record<string, Record<string, unknown>>
}) => {
  const base =
    widgetValues?.[widget.id] ??
    ({
      ...(definition?.defaultProps ?? {}),
      ...(widget.props ?? {}),
    } as Record<string, unknown>)

  const margin = spacing.marginMode === 'none' ? '0px' : DEFAULT_MARGIN
  const labelHide = base.labelHide ?? base.hideLabel
  const labelWidthValue = base.labelWidthValue ?? base.labelWidth
  const labelWidthUnit = base.labelWidthUnit ?? 'col'

  return {
    pluginType:
      base.pluginType ??
      (definition?.type === 'EditableText' ? 'EditableTextWidget2' : definition?.type ?? ''),
    id: widget.id,
    ...base,
    labelHide,
    hideLabel: labelHide,
    labelWidth: labelWidthValue,
    labelWidthValue,
    labelWidthUnit,
    showClear: base.showClear ?? base.showClearButton,
    textBefore: base.textBefore ?? base.prefix ?? '',
    textAfter: base.textAfter ?? base.suffix ?? '',
    iconBefore: base.iconBefore ?? base.prefixIcon ?? '',
    iconAfter: base.iconAfter ?? base.suffixIcon ?? '',
    tooltipText: base.tooltipText ?? base.tooltip ?? '',
    formDataKey: base.formDataKey ?? widget.id,
    margin,
    _desktopMargin: margin,
    _mobileMargin: margin,
  }
}

