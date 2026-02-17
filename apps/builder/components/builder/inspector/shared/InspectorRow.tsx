/**
 * Базовая строка inspector: стандартный контейнер для label/control в панели.
 */
import type { ReactNode } from 'react'

type InspectorRowProps = {
  label: ReactNode
  topAligned?: boolean
  stacked?: boolean
  children: ReactNode
  labelBasis?: number
}

export const InspectorRow = ({
  label,
  topAligned = false,
  stacked = false,
  children,
  labelBasis = 96,
}: InspectorRowProps) => {
  return (
    <div
      className={`group min-h-7 text-[12px] leading-4 ${
        stacked ? 'space-y-1' : 'flex items-center'
      }`}
    >
      <div
        className={`flex w-full gap-2 ${
          stacked ? 'flex-col' : topAligned ? 'items-start' : 'items-center'
        }`}
      >
        <div
          className={`flex shrink-0 justify-between text-foreground ${
            !stacked && topAligned ? 'mt-1' : ''
          }`}
          style={stacked ? undefined : { flexBasis: labelBasis }}
        >
          {label}
        </div>
        <div className={`min-w-0 ${stacked ? 'w-full' : 'flex-1'}`}>{children}</div>
      </div>
    </div>
  )
}
