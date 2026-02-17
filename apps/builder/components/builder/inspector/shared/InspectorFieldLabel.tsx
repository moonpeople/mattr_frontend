/**
 * Базовый label для поля inspector с поддержкой подсказок и сервисных индикаторов.
 */
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { formatValueTypeLabel } from '../../components'

type InspectorFieldLabelProps = {
  label: string
  valueType?: string | string[]
  description?: string
}

export const InspectorFieldLabel = ({
  label,
  valueType,
  description,
}: InspectorFieldLabelProps) => {
  const valueTypeLabel = formatValueTypeLabel(valueType)
  if (!valueTypeLabel && !description) {
    return <span className="truncate text-foreground">{label}</span>
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="truncate cursor-help text-foreground">{label}</span>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-[240px]">
        <div className="space-y-1">
          {valueTypeLabel && <div className="text-[11px] font-semibold">{valueTypeLabel}</div>}
          {description && <div className="text-[11px] text-foreground-muted">{description}</div>}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
