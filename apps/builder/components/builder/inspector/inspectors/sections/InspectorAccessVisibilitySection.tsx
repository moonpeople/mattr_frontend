/**
 * Секция access/visibility: настройки доступности и видимости сущности в inspector.
 */
import { Input_Shadcn_, Textarea } from 'ui'

type InspectorAccessVisibilitySectionProps = {
  policyValue: string
  visibleWhen?: string
  disabledWhen?: string
  onUpdateAccess: (patch: {
    policy?: string[]
    visibleWhen?: string
    disabledWhen?: string
  }) => void
}

export const InspectorAccessVisibilitySection = ({
  policyValue,
  visibleWhen,
  disabledWhen,
  onUpdateAccess,
}: InspectorAccessVisibilitySectionProps) => {
  return (
    <div className="space-y-3 px-4">
      <div className="text-[12px] font-semibold text-foreground">Access & visibility</div>
      <div className="space-y-2">
        <div className="text-xs text-foreground">Policy keys</div>
        <Input_Shadcn_
          value={policyValue}
          onChange={(event) => {
            const next = event.target.value
            const policies = next
              .split(',')
              .map((value) => value.trim())
              .filter(Boolean)
            onUpdateAccess({ policy: policies })
          }}
          placeholder="project.read, project.update"
          className="h-7"
        />
      </div>
      <div className="space-y-2">
        <div className="text-xs text-foreground">Visible when</div>
        <Textarea
          value={visibleWhen ?? ''}
          onChange={(event) => onUpdateAccess({ visibleWhen: event.target.value })}
          placeholder={'{{ policy.allow("project.read") }}'}
        />
      </div>
      <div className="space-y-2">
        <div className="text-xs text-foreground">Disabled when</div>
        <Textarea
          value={disabledWhen ?? ''}
          onChange={(event) => onUpdateAccess({ disabledWhen: event.target.value })}
          placeholder={'{{ row.status !== "pending" }}'}
        />
      </div>
    </div>
  )
}
