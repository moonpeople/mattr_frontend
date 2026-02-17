/**
 * Компонент пустого состояния inspector, когда нет доступных секций/полей для рендера.
 */
type InspectorEmptyStateProps = {
  title: string
  description: string
}

export const InspectorEmptyState = ({
  title,
  description,
}: InspectorEmptyStateProps) => {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-xs text-foreground-muted">
      <div className="text-sm font-medium text-foreground">{title}</div>
      <div>{description}</div>
    </div>
  )
}
