/**
 * Тело секции inspector: контейнер для field rows и служебных блоков секции.
 */
import type { ReactNode } from 'react'

type InspectorSectionBodyProps = {
  isCollapsed: boolean
  children: ReactNode
}

export const InspectorSectionBody = ({
  isCollapsed,
  children,
}: InspectorSectionBodyProps) => {
  if (isCollapsed) {
    return null
  }
  return <>{children}</>
}
