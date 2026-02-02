import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button, Card, CardContent, Input, Switch, copyToClipboard } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import {
  useIotInstanceSettingsQuery,
  useIotInstanceSettingsUpdateMutation,
} from 'data/iot/instance-settings'
import type { IotInstanceSettings } from 'data/iot/types'

const CodeBlock = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-md border border-default bg-surface-100 px-3 py-2 font-mono text-xs text-foreground whitespace-pre-wrap">
    {children}
  </div>
)

export const IotInstanceSettings = () => {
  const { data, isPending } = useIotInstanceSettingsQuery()
  const { mutate: updateSettings, isPending: isUpdating } =
    useIotInstanceSettingsUpdateMutation()

  const [settings, setSettings] = useState<IotInstanceSettings | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)
  const [showEncryptionKey, setShowEncryptionKey] = useState(false)
  const [copiedEncryptionKey, setCopiedEncryptionKey] = useState(false)
  const [isEditingEncryptionKey, setIsEditingEncryptionKey] = useState(false)
  const [encryptionKeyDraft, setEncryptionKeyDraft] = useState('')

  useEffect(() => {
    if (data) setSettings(data)
  }, [data])

  useEffect(() => {
    if (settings && !isEditingEncryptionKey) {
      setEncryptionKeyDraft(settings.encryption_key ?? '')
    }
  }, [settings, isEditingEncryptionKey])

  const handleToggle =
    (key: keyof IotInstanceSettings) => (checked: boolean) => {
      if (!settings) return
      const previous = settings
      const next = { ...settings, [key]: checked }
      setSettings(next)

      updateSettings(
        { payload: { [key]: checked } },
        {
          onError: (error) => {
            setSettings(previous)
            toast.error(error?.message || 'Не удалось обновить настройки')
          },
          onSuccess: (updated) => {
            setSettings(updated)
          },
        }
      )
    }

  const apiKey = settings?.global_api_key || ''
  const maskedApiKey = apiKey ? `${apiKey.slice(0, 6)}****${apiKey.slice(-4)}` : 'не задан'
  const encryptionKey = settings?.encryption_key || ''
  const maskedEncryptionKey = encryptionKey
    ? `${encryptionKey.slice(0, 6)}****${encryptionKey.slice(-4)}`
    : 'не задан'

  const handleCopyKey = async () => {
    if (!apiKey) return
    await copyToClipboard(apiKey)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  const handleCopyEncryptionKey = async () => {
    if (!encryptionKey) return
    await copyToClipboard(encryptionKey)
    setCopiedEncryptionKey(true)
    setTimeout(() => setCopiedEncryptionKey(false), 2000)
  }

  const handleSaveEncryptionKey = () => {
    if (!settings) return
    const previous = settings
    const normalized = encryptionKeyDraft.trim()
    const next = { ...settings, encryption_key: normalized === '' ? null : normalized }
    setSettings(next)

    updateSettings(
      { payload: { encryption_key: normalized === '' ? null : normalized } },
      {
        onError: (error) => {
          setSettings(previous)
          toast.error(error?.message || 'Не удалось обновить ключ шифрования')
        },
        onSuccess: (updated) => {
          setSettings(updated)
          setIsEditingEncryptionKey(false)
        },
      }
    )
  }

  return (
    <>
      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Глобальные флаги инстанса</PageSectionTitle>
            <PageSectionDescription>
              Настройки применяются сразу. Адаптеры читают значения из кэша и периодически
              обновляют их из базы.
            </PageSectionDescription>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          {isPending && !settings ? (
            <GenericSkeletonLoader />
          ) : (
            <Card>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-4 rounded-md border border-default px-3 py-2">
                  <div className="space-y-1">
                    <p className="text-sm text-foreground">REQUIRE_DEVICE_KEY</p>
                    <p className="text-xs text-foreground-lighter">Требовать device token.</p>
                  </div>
                  <Switch
                    checked={settings?.require_device_key ?? false}
                    onCheckedChange={handleToggle('require_device_key')}
                    disabled={isUpdating}
                  />
                </div>
                <div className="flex items-start justify-between gap-4 rounded-md border border-default px-3 py-2">
                  <div className="space-y-1">
                    <p className="text-sm text-foreground">REQUIRE_PROJECT_KEY</p>
                    <p className="text-xs text-foreground-lighter">Требовать ключ проекта.</p>
                  </div>
                  <Switch
                    checked={settings?.require_project_key ?? false}
                    onCheckedChange={handleToggle('require_project_key')}
                    disabled={isUpdating}
                  />
                </div>
                <div className="flex items-start justify-between gap-4 rounded-md border border-default px-3 py-2">
                  <div className="space-y-1">
                    <p className="text-sm text-foreground">REQUIRE_API_KEY</p>
                    <p className="text-xs text-foreground-lighter">Требовать API ключ (общий).</p>
                  </div>
                  <Switch
                    checked={settings?.require_api_key ?? false}
                    onCheckedChange={handleToggle('require_api_key')}
                    disabled={isUpdating}
                  />
                </div>
                <div className="flex items-start justify-between gap-4 rounded-md border border-default px-3 py-2">
                  <div className="space-y-1">
                    <p className="text-sm text-foreground">PROVISION_ON_INGEST</p>
                    <p className="text-xs text-foreground-lighter">
                      Автосоздание устройства при первом сообщении.
                    </p>
                  </div>
                  <Switch
                    checked={settings?.provision_on_ingest ?? false}
                    onCheckedChange={handleToggle('provision_on_ingest')}
                    disabled={isUpdating}
                  />
                </div>
                <div className="flex items-start justify-between gap-4 rounded-md border border-default px-3 py-2">
                  <div className="space-y-1">
                    <p className="text-sm text-foreground">ALLOW_MISSING_DEVICE_ID</p>
                    <p className="text-xs text-foreground-lighter">
                      Разрешить сообщения без device_id.
                    </p>
                  </div>
                  <Switch
                    checked={settings?.allow_missing_device_id ?? false}
                    onCheckedChange={handleToggle('allow_missing_device_id')}
                    disabled={isUpdating}
                  />
                </div>
                <div className="flex items-start justify-between gap-4 rounded-md border border-default px-3 py-2">
                  <div className="space-y-1">
                    <p className="text-sm text-foreground">GATEWAY_LOWERCASE_KEYS</p>
                    <p className="text-xs text-foreground-lighter">
                      Приводить ключи телеметрии/атрибутов от gateway к lower-case.
                    </p>
                  </div>
                  <Switch
                    checked={settings?.gateway_lowercase_keys ?? true}
                    onCheckedChange={handleToggle('gateway_lowercase_keys')}
                    disabled={isUpdating}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </PageSectionContent>
      </PageSection>

      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Глобальный API ключ</PageSectionTitle>
            <PageSectionDescription>
              Ключ хранится в базе и используется для проверки авторизации.
            </PageSectionDescription>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          {isPending && !settings ? (
            <GenericSkeletonLoader />
          ) : (
            <Card>
              <CardContent className="flex flex-wrap items-center gap-2">
                <CodeBlock>{showApiKey ? apiKey || 'не задан' : maskedApiKey}</CodeBlock>
                <Button type="default" size="tiny" onClick={() => setShowApiKey((prev) => !prev)}>
                  {showApiKey ? 'Скрыть' : 'Показать'}
                </Button>
                <Button
                  type="default"
                  size="tiny"
                  onClick={handleCopyKey}
                  disabled={!apiKey}
                  icon={copiedKey ? <Check size={12} /> : undefined}
                >
                  {copiedKey ? 'Скопировано' : 'Скопировать'}
                </Button>
              </CardContent>
            </Card>
          )}
        </PageSectionContent>
      </PageSection>

      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Ключ шифрования</PageSectionTitle>
            <PageSectionDescription>
              Глобальный ключ для шифрования/дешифрования полезной нагрузки (если используется).
            </PageSectionDescription>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          {isPending && !settings ? (
            <GenericSkeletonLoader />
          ) : (
            <Card>
              <CardContent className="space-y-3">
                {isEditingEncryptionKey ? (
                  <div className="space-y-2">
                    <Input
                      value={encryptionKeyDraft}
                      onChange={(event) => setEncryptionKeyDraft(event.target.value)}
                      placeholder="Введите ключ шифрования"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="default"
                        size="tiny"
                        onClick={handleSaveEncryptionKey}
                        disabled={isUpdating}
                      >
                        Сохранить
                      </Button>
                      <Button
                        type="default"
                        size="tiny"
                        onClick={() => {
                          setEncryptionKeyDraft(encryptionKey)
                          setIsEditingEncryptionKey(false)
                        }}
                      >
                        Отмена
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <CodeBlock>
                      {showEncryptionKey
                        ? encryptionKey || 'не задан'
                        : maskedEncryptionKey}
                    </CodeBlock>
                    <Button
                      type="default"
                      size="tiny"
                      onClick={() => setShowEncryptionKey((prev) => !prev)}
                    >
                      {showEncryptionKey ? 'Скрыть' : 'Показать'}
                    </Button>
                    <Button
                      type="default"
                      size="tiny"
                      onClick={handleCopyEncryptionKey}
                      disabled={!encryptionKey}
                      icon={copiedEncryptionKey ? <Check size={12} /> : undefined}
                    >
                      {copiedEncryptionKey ? 'Скопировано' : 'Скопировать'}
                    </Button>
                    <Button
                      type="default"
                      size="tiny"
                      onClick={() => setIsEditingEncryptionKey(true)}
                    >
                      Изменить
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </PageSectionContent>
      </PageSection>
    </>
  )
}
