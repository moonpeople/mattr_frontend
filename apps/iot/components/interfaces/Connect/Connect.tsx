import { Plug } from 'lucide-react'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import type { ReactNode } from 'react'

import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import {
  Button,
  DIALOG_PADDING_X,
  DIALOG_PADDING_Y,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tabs_Shadcn_,
  cn,
} from 'ui'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { CONNECTION_TYPES } from './Connect.constants'

const FALLBACK_HOST =
  typeof window !== 'undefined' && window.location?.hostname
    ? window.location.hostname
    : 'localhost'

const resolveValue = (value: string | undefined, fallback: string) => {
  if (!value) return fallback
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : fallback
}


const HTTP_ADAPTER_URL = resolveValue(
  process.env.NEXT_PUBLIC_HTTP_ADAPTER_URL,
  `http://${FALLBACK_HOST}:8080`
)
const MQTT_HOST = resolveValue(process.env.NEXT_PUBLIC_MQTT_HOST, FALLBACK_HOST)
const MQTT_PORT = resolveValue(process.env.NEXT_PUBLIC_MQTT_PORT, '1883')
const MQTT_TOPIC = resolveValue(
  process.env.NEXT_PUBLIC_MQTT_TOPIC,
  'telemetry/{project}/{device_id}'
)
const COAP_HOST = resolveValue(process.env.NEXT_PUBLIC_COAP_HOST, FALLBACK_HOST)
const COAP_PORT = resolveValue(process.env.NEXT_PUBLIC_COAP_PORT, '5683')
const LWM2M_HOST = resolveValue(process.env.NEXT_PUBLIC_LWM2M_HOST, FALLBACK_HOST)
const LWM2M_PORT = resolveValue(process.env.NEXT_PUBLIC_LWM2M_PORT, '5685')
const SNMP_HOST = resolveValue(process.env.NEXT_PUBLIC_SNMP_HOST, FALLBACK_HOST)
const SNMP_PORT = resolveValue(process.env.NEXT_PUBLIC_SNMP_PORT, '1620')
const CLICKHOUSE_HOST = resolveValue(process.env.NEXT_PUBLIC_CLICKHOUSE_HOST, FALLBACK_HOST)
const CLICKHOUSE_PORT = resolveValue(process.env.NEXT_PUBLIC_CLICKHOUSE_PORT, '8123')
const CLICKHOUSE_DB = resolveValue(process.env.NEXT_PUBLIC_CLICKHOUSE_DB, 'iot')
const POSTGRES_HOST = resolveValue(process.env.NEXT_PUBLIC_PG_HOST, FALLBACK_HOST)
const POSTGRES_PORT = resolveValue(process.env.NEXT_PUBLIC_PG_PORT, '5433')
const POSTGRES_DB = resolveValue(process.env.NEXT_PUBLIC_PG_DB, 'iot')


const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="space-y-2">
    <h4 className="text-sm font-semibold text-foreground">{title}</h4>
    <div className="text-sm text-foreground-light space-y-2">{children}</div>
  </div>
)

const CodeBlock = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-md border border-default bg-surface-100 px-3 py-2 font-mono text-xs text-foreground">
    {children}
  </div>
)

const GlobalNote = () => (
  <p className="text-sm text-foreground-light">
    Все адреса, порты и параметры подключения к протоколам задаются глобально в настройках
    инстанса и одинаковы для всех моделей.
  </p>
)

const DataAccessTab = () => (
  <div className="space-y-6">
    <Section title="Где хранятся данные">
      <ul className="list-disc space-y-1 pl-5">
        <li>Телеметрия и вычисленные поля — ClickHouse.</li>
        <li>Метаданные (модели, устройства, атрибуты, ключи, правила) — Postgres.</li>
      </ul>
    </Section>

    <Section title="Как подключиться">
      <p>Параметры подключения берутся из глобальных настроек инстанса.</p>
      <div className="space-y-2">
        <CodeBlock>{`ClickHouse: host=${CLICKHOUSE_HOST} port=${CLICKHOUSE_PORT} db=${CLICKHOUSE_DB}`}</CodeBlock>
        <CodeBlock>{`Postgres: host=${POSTGRES_HOST} port=${POSTGRES_PORT} db=${POSTGRES_DB}`}</CodeBlock>
      </div>
    </Section>

    <Section title="Где какие настройки">
      <ul className="list-disc space-y-1 pl-5">
        <li>
          Инстанс: адреса/порты протоколов, глобальные флаги
          <span className="font-mono text-xs"> DEVICE_LOOKUP / REQUIRE_* / PROVISION_ON_INGEST / ALLOW_MISSING_DEVICE_ID</span>
          <span className="text-xs text-foreground-lighter"> (настраивается в Project Settings → IoT Settings)</span>.
        </li>
        <li>
          Device model: <span className="font-mono text-xs">transport_type</span> и
          <span className="font-mono text-xs"> provision_config</span> (стратегия провижининга).
        </li>
        <li>
          Device: <span className="font-mono text-xs">device_uid</span>,
          <span className="font-mono text-xs"> serial_number</span>,
          <span className="font-mono text-xs"> device_key_id</span> (token),
          <span className="font-mono text-xs"> aes</span> ключ (для HTTP‑шифрования).
        </li>
      </ul>
    </Section>

    <Section title="Когда данные принимаются">
      <ul className="list-disc space-y-1 pl-5">
        <li>Устройство найдено и прошло авторизацию.</li>
        <li>
          Если устройства нет — оно может быть создано автоматически по модели (если включён
          <span className="font-mono text-xs"> PROVISION_ON_INGEST</span> и стратегия модели разрешает).
        </li>
        <li>
          Если включены <span className="font-mono text-xs">REQUIRE_*</span> — нужен token,
          api‑key или provisioning credentials.
        </li>
      </ul>
    </Section>

  </div>
)

const HttpTab = () => (
  <div className="space-y-6">
    <GlobalNote />

    <Section title="Куда отправлять">
      <div className="space-y-2">
        <CodeBlock>{`POST ${HTTP_ADAPTER_URL}`}</CodeBlock>
      </div>
      <p className="text-xs text-foreground-lighter">
        HTTP устройства отправляют все сообщения на порт 8080 без отдельных endpoints.
        Тип сообщения передаётся в заголовках или в теле.
      </p>
    </Section>

    <Section title="Что нужно передать">
      <ul className="list-disc space-y-1 pl-5">
        <li>
          Идентификатор устройства:
          <span className="font-mono text-xs"> x-device-id</span> или
          <span className="font-mono text-xs"> x-device-uid</span> или
          <span className="font-mono text-xs"> serial_number</span> в payload.
        </li>
        <li>
          Token устройства:
          <span className="font-mono text-xs"> device_key_id</span>
          (в заголовке <span className="font-mono text-xs">x-device-key-id</span> или в payload).
        </li>
        <li>
          Тип сообщения:
          <span className="font-mono text-xs"> x-message-type</span> /
          <span className="font-mono text-xs"> message_type</span>.
          Допустимые значения: <span className="font-mono text-xs">telemetry</span>,
          <span className="font-mono text-xs">attributes</span>,
          <span className="font-mono text-xs">rpc_request</span>,
          <span className="font-mono text-xs">rpc_response</span>,
          <span className="font-mono text-xs">gateway_telemetry</span>,
          <span className="font-mono text-xs">gateway_attributes</span>.
        </li>
        <li>
          Если включён проектный ключ —
          <span className="font-mono text-xs"> x-api-key</span> или
          <span className="font-mono text-xs"> Authorization: Bearer &lt;token&gt;</span>.
        </li>
        <li>
          Для автопровижининга:
          <span className="font-mono text-xs"> model_id</span> и
          <span className="font-mono text-xs"> provision_device_key/provision_device_secret</span>
          или сертификат.
        </li>
      </ul>
    </Section>

    <Section title="Авторизация">
      <ul className="list-disc space-y-1 pl-5">
        <li>Token устройства (device_key_id).</li>
        <li>API‑key проекта (если включён).</li>
        <li>Provision strategy модели (DISABLED / ALLOW_CREATE_NEW_DEVICES / CHECK_PRE_PROVISIONED_DEVICES / X509_CERTIFICATE_CHAIN).</li>
      </ul>
    </Section>

    <Section title="Шифрование (HTTP)">
      <ul className="list-disc space-y-1 pl-5">
        <li><span className="font-mono text-xs">x-connection-encrypted: true</span></li>
        <li><span className="font-mono text-xs">x-nonce</span> — base64 IV</li>
        <li>Payload шифруется AES‑128‑CBC, ключ хранится в credentials устройства</li>
      </ul>
    </Section>
  </div>
)

const MqttTab = () => (
  <div className="space-y-6">
    <GlobalNote />

    <Section title="Куда отправлять">
      <div className="space-y-2">
        <CodeBlock>{`Broker: ${MQTT_HOST}:${MQTT_PORT}`}</CodeBlock>
        <CodeBlock>{`Topic (пример): ${MQTT_TOPIC}`}</CodeBlock>
      </div>
      <p className="text-xs text-foreground-lighter">
        MQTT сообщения принимаются брокером (EMQX) и пересылаются в
        <span className="font-mono text-xs"> mqtt_adapter</span> по глобальным настройкам.
      </p>
    </Section>

    <Section title="Что нужно настроить на устройстве">
      <ul className="list-disc space-y-1 pl-5">
        <li><span className="font-mono text-xs">clientId</span> = device_uid или serial_number.</li>
        <li><span className="font-mono text-xs">username</span> = device_key_id (token).</li>
        <li><span className="font-mono text-xs">password</span> = api_key (если включена проверка API‑key).</li>
      </ul>
    </Section>

    <Section title="Авторизация">
      <ul className="list-disc space-y-1 pl-5">
        <li>Token устройства (device_key_id).</li>
        <li>API‑key проекта (если включён).</li>
        <li>Provision strategy модели (если устройство ещё не создано).</li>
      </ul>
    </Section>
  </div>
)

const CoapTab = () => (
  <div className="space-y-6">
    <GlobalNote />

    <Section title="Куда отправлять">
      <div className="space-y-2">
        <CodeBlock>{`CoAP gateway: coap://${COAP_HOST}:${COAP_PORT}`}</CodeBlock>
        <CodeBlock>{'Path (пример): /api/v1/{device_token}/telemetry'}</CodeBlock>
      </div>
      <p className="text-xs text-foreground-lighter">
        CoAP устройства обычно работают через gateway/bridge, который проксирует запросы в
        <span className="font-mono text-xs"> coap_adapter</span>.
      </p>
    </Section>

    <Section title="Что нужно передать">
      <ul className="list-disc space-y-1 pl-5">
        <li>device_id / device_uid / serial_number (в опциях или payload).</li>
        <li>device_key_id (token) или api_key (если включены REQUIRE_*).</li>
        <li>model_id + provision creds — для автосоздания устройства.</li>
      </ul>
    </Section>

    <Section title="Авторизация">
      <ul className="list-disc space-y-1 pl-5">
        <li>Token устройства или API‑key проекта.</li>
        <li>Provision strategy модели, если устройства ещё нет.</li>
      </ul>
    </Section>
  </div>
)

const Lwm2mTab = () => (
  <div className="space-y-6">
    <GlobalNote />

    <Section title="Куда подключаться">
      <div className="space-y-2">
        <CodeBlock>{`LwM2M gateway: coap://${LWM2M_HOST}:${LWM2M_PORT}`}</CodeBlock>
        <CodeBlock>{'Registration: /rd?ep=<serial_number>&model_id=<model_id>&device_key_id=<device_key_id>'}</CodeBlock>
      </div>
    </Section>

    <Section title="Что нужно настроить на устройстве">
      <ul className="list-disc space-y-1 pl-5">
        <li><span className="font-mono text-xs">endpoint (ep)</span> = serial_number.</li>
        <li>model_id + device_key_id — если нужен автопровижининг.</li>
      </ul>
    </Section>

    <Section title="Авторизация">
      <ul className="list-disc space-y-1 pl-5">
        <li>Token устройства (device_key_id), если включён REQUIRE_DEVICE_KEY.</li>
        <li>Provision strategy модели для создания новых устройств.</li>
      </ul>
    </Section>
  </div>
)

const SnmpTab = () => (
  <div className="space-y-6">
    <GlobalNote />

    <Section title="Куда отправлять">
      <div className="space-y-2">
        <CodeBlock>{`SNMP traps: udp://${SNMP_HOST}:${SNMP_PORT}`}</CodeBlock>
      </div>
    </Section>

    <Section title="Как определяется устройство">
      <ul className="list-disc space-y-1 pl-5">
        <li>По IP источника, если он совпадает с <span className="font-mono text-xs">devices.transport_config.snmp.host</span>.</li>
        <li>Либо через device_id / device_uid (если передаются шлюзом).</li>
      </ul>
    </Section>

    <Section title="Авторизация">
      <ul className="list-disc space-y-1 pl-5">
        <li>Чаще всего работает без токена, если REQUIRE_* выключены.</li>
        <li>Если REQUIRE_* включены — требуется проксирование через шлюз с token/api‑key.</li>
      </ul>
    </Section>
  </div>
)

const renderTab = (key: string) => {
  switch (key) {
    case 'data':
      return <DataAccessTab />
    case 'http':
      return <HttpTab />
    case 'mqtt':
      return <MqttTab />
    case 'coap':
      return <CoapTab />
    case 'lwm2m':
      return <Lwm2mTab />
    case 'snmp':
      return <SnmpTab />
    default:
      return null
  }
}

export const Connect = () => {
  const { data: selectedProject } = useSelectedProjectQuery()
  const isActiveHealthy = selectedProject?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  const [showConnect, setShowConnect] = useQueryState(
    'showConnect',
    parseAsBoolean.withDefault(false)
  )
  const [tab, setTab] = useQueryState('connectTab', parseAsString.withDefault('data'))

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      setShowConnect(null)
      setTab(null)
    } else {
      setShowConnect(open)
    }
  }

  if (!isActiveHealthy) {
    return (
      <ButtonTooltip
        disabled
        type="default"
        className="rounded-full"
        icon={<Plug className="rotate-90" />}
        tooltip={{
          content: {
            text: 'Connect is disabled because the project is not active or healthy.',
          },
        }}
      >
        <span>Connect</span>
      </ButtonTooltip>
    )
  }

  return (
    <Dialog open={showConnect} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button type="default" className="rounded-full" icon={<Plug className="rotate-90" />}>
          <span>Connect</span>
        </Button>
      </DialogTrigger>
      <DialogContent className={cn('sm:max-w-5xl p-0 rounded-lg')} centered={false}>
        <DialogHeader className={cn('text-left', DIALOG_PADDING_X)}>
          <DialogTitle>Подключение устройств</DialogTitle>
          <DialogDescription>
            Куда отправлять данные и как настроить авторизацию по каждому протоколу.
          </DialogDescription>
        </DialogHeader>

        <Tabs_Shadcn_ value={tab} onValueChange={(value) => setTab(value)}>
          <TabsList_Shadcn_ className={cn('flex overflow-x-scroll gap-x-4', DIALOG_PADDING_X)}>
            {CONNECTION_TYPES.map((type) => (
              <TabsTrigger_Shadcn_ key={type.key} value={type.key} className="px-0">
                {type.label}
              </TabsTrigger_Shadcn_>
            ))}
          </TabsList_Shadcn_>

          {CONNECTION_TYPES.map((type) => (
            <TabsContent_Shadcn_
              key={`content-${type.key}`}
              value={type.key}
              className={cn(DIALOG_PADDING_X, DIALOG_PADDING_Y, '!mt-0')}
            >
              {renderTab(type.key)}
            </TabsContent_Shadcn_>
          ))}
        </Tabs_Shadcn_>
      </DialogContent>
    </Dialog>
  )
}
