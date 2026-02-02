import { Alert, Button } from 'ui'

type DeviceModelStepAlertsProps = {
  hasRuleChain: boolean
  onOpenRuleChain: () => void
}

export const DeviceModelStepAlerts = ({ hasRuleChain, onOpenRuleChain }: DeviceModelStepAlertsProps) => (
  <div className="space-y-4">
    <Alert variant="info" withIcon title="Alerts are configured in the core rule chain">
      Create and manage alerts inside the core rule chain for this device model.
    </Alert>
    {hasRuleChain ? (
      <div className="flex items-center gap-2">
        <Button size="tiny" type="primary" onClick={onOpenRuleChain}>
          Open core rule chain
        </Button>
      </div>
    ) : (
      <Alert variant="info" withIcon title="Save the device model to generate rule chains">
        Create or select a device model to access its core rule chain.
      </Alert>
    )}
  </div>
)
