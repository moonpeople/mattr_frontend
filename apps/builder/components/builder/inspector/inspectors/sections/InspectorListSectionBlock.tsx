/**
 * Блок list-секции inspector: рендер списочных секций и связанных item-действий.
 */
import type { ReactNode } from 'react'

type InspectorListSectionBlockProps = {
  children: ReactNode
}

export const InspectorListSectionBlock = ({
  children,
}: InspectorListSectionBlockProps) => {
  return <div className="space-y-2">{children}</div>
}
