import { Button, Checkbox, Input, SelectField, Textarea } from 'ui'
import { PROVISION_TYPES } from './constants'

type DeviceModelStepProvisioningProps = {
  provisionConfig: any
  setProvisionConfig: (updater: any) => void
}

export const DeviceModelStepProvisioning = ({
  provisionConfig,
  setProvisionConfig,
}: DeviceModelStepProvisioningProps) => (
  <div className="grid gap-6">
    <div className="space-y-4 rounded-md border border-muted p-3">
      <p className="text-sm font-medium">Provisioning</p>
      <SelectField
        label="Provision strategy"
        type="select"
        value={provisionConfig.type}
        onChange={(nextValue) =>
          setProvisionConfig((current: any) => ({
            ...current,
            type: nextValue,
          }))
        }
      >
        {PROVISION_TYPES.map((option) => (
          <SelectField.Option
            key={option.value}
            id={option.value}
            label={option.label}
            value={option.value}
          >
            {option.label}
          </SelectField.Option>
        ))}
      </SelectField>
      {provisionConfig.type === 'X509_CERTIFICATE_CHAIN' && (
        <>
          <Checkbox
            label="Allow create new devices by X509 certificate"
            checked={provisionConfig.allowCreateNewDevicesByX509Certificate}
            onChange={(event) =>
              setProvisionConfig((current: any) => ({
                ...current,
                allowCreateNewDevicesByX509Certificate: event.target.checked,
              }))
            }
          />
          <div className="space-y-1">
            <p className="text-sm text-foreground-light">Certificate value</p>
            <Textarea
              id="provision-certificate-value"
              value={provisionConfig.certificateValue}
              onChange={(event) =>
                setProvisionConfig((current: any) => ({
                  ...current,
                  certificateValue: event.target.value,
                }))
              }
              rows={4}
            />
          </div>
          <Input
            id="provision-certificate-regex"
            label="Certificate CN regex"
            value={provisionConfig.certificateRegExPattern}
            onChange={(event) =>
              setProvisionConfig((current: any) => ({
                ...current,
                certificateRegExPattern: event.target.value,
              }))
            }
          />
        </>
      )}
      {provisionConfig.type === 'ENCRYPTION' && (
        <>
          <SelectField
            label="Encryption type"
            type="select"
            value={provisionConfig.encryptionType}
            onChange={(nextValue) =>
              setProvisionConfig((current: any) => ({
                ...current,
                encryptionType: nextValue,
              }))
            }
          >
            <SelectField.Option id="AES128" label="AES128" value="AES128">
              AES128
            </SelectField.Option>
            <SelectField.Option id="AES256" label="AES256" value="AES256">
              AES256
            </SelectField.Option>
          </SelectField>
          <Input
            id="provision-encryption-key"
            label="Model encryption key (optional)"
            value={provisionConfig.encryptionKey}
            onChange={(event) =>
              setProvisionConfig((current: any) => ({
                ...current,
                encryptionKey: event.target.value,
              }))
            }
            description="Если пусто — используется глобальный ключ инстанса."
          />
        </>
      )}
      {provisionConfig.type !== 'DISABLED' &&
        provisionConfig.type !== 'X509_CERTIFICATE_CHAIN' &&
        provisionConfig.type !== 'ENCRYPTION' && (
          <>
            <Input
              id="provision-device-key"
              label="Provision device key"
              value={provisionConfig.provisionDeviceKey}
              onChange={(event) =>
                setProvisionConfig((current: any) => ({
                  ...current,
                  provisionDeviceKey: event.target.value,
                }))
              }
            />
            <Input
              id="provision-device-secret"
              label="Provision device secret"
              value={provisionConfig.provisionDeviceSecret}
              onChange={(event) =>
                setProvisionConfig((current: any) => ({
                  ...current,
                  provisionDeviceSecret: event.target.value,
                }))
              }
            />
          </>
        )}
    </div>
  </div>
)
