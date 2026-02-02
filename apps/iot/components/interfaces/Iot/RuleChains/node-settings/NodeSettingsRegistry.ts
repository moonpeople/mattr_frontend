import type { ReactElement } from 'react'
import { DefaultNodeSettingsProps } from './DefaultNodeSettings'
import ActionLogNodeSettings from './ActionLogNodeSettings'
import RpcSendRPCRequestNodeSettings from './RpcSendRPCRequestNodeSettings'
import RpcSendRPCReplyNodeSettings from './RpcSendRPCReplyNodeSettings'
import DelayMsgDelayNodeSettings from './DelayMsgDelayNodeSettings'
import FlowCheckpointNodeSettings from './FlowCheckpointNodeSettings'
import FlowRuleChainInputNodeSettings from './FlowRuleChainInputNodeSettings'
import FlowRuleChainOutputNodeSettings from './FlowRuleChainOutputNodeSettings'
import FlowAckNodeSettings from './FlowAckNodeSettings'
import RestRestApiCallNodeSettings from './RestRestApiCallNodeSettings'
import MailMsgToEmailNodeSettings from './MailMsgToEmailNodeSettings'
import MailSendEmailNodeSettings from './MailSendEmailNodeSettings'
import SmsSendSmsNodeSettings from './SmsSendSmsNodeSettings'
import TelegramSendTelegramNodeSettings from './TelegramSendTelegramNodeSettings'
import FilterAssetTypeSwitchNodeSettings from './FilterAssetTypeSwitchNodeSettings'
import FilterCheckAlarmStatusNodeSettings from './FilterCheckAlarmStatusNodeSettings'
import FilterDeviceTypeSwitchNodeSettings from './FilterDeviceTypeSwitchNodeSettings'
import ActionCreateAlarmNodeSettings from './ActionCreateAlarmNodeSettings'
import ActionClearAlarmNodeSettings from './ActionClearAlarmNodeSettings'
import ActionMsgCountNodeSettings from './ActionMsgCountNodeSettings'
import ActionDeviceStateNodeSettings from './ActionDeviceStateNodeSettings'
import KafkaKafkaNodeSettings from './KafkaKafkaNodeSettings'
import ActionCreateRelationNodeSettings from './ActionCreateRelationNodeSettings'
import ActionDeleteRelationNodeSettings from './ActionDeleteRelationNodeSettings'
import FilterCheckRelationNodeSettings from './FilterCheckRelationNodeSettings'
import MathMathNodeSettings from './MathMathNodeSettings'
import MetadataCalculateDeltaNodeSettings from './MetadataCalculateDeltaNodeSettings'
import MetadataGetAttributesNodeSettings from './MetadataGetAttributesNodeSettings'
import MetadataGetDeviceAttrNodeSettings from './MetadataGetDeviceAttrNodeSettings'
import MetadataGetRelatedAttributeNodeSettings from './MetadataGetRelatedAttributeNodeSettings'
import MetadataGetTelemetryNodeSettings from './MetadataGetTelemetryNodeSettings'
import MetadataFetchDeviceCredentialsNodeSettings from './MetadataFetchDeviceCredentialsNodeSettings'
import ProfileDeviceProfileNodeSettings from './ProfileDeviceProfileNodeSettings'
import TelemetryCalculatedFieldsNodeSettings from './TelemetryCalculatedFieldsNodeSettings'
import TelemetryMsgDeleteAttributesNodeSettings from './TelemetryMsgDeleteAttributesNodeSettings'
import TransformCopyKeysNodeSettings from './TransformCopyKeysNodeSettings'
import TransformDeleteKeysNodeSettings from './TransformDeleteKeysNodeSettings'
import TransformRenameKeysNodeSettings from './TransformRenameKeysNodeSettings'
import TransformSplitArrayMsgNodeSettings from './TransformSplitArrayMsgNodeSettings'
import DeduplicationMsgDeduplicationNodeSettings from './DeduplicationMsgDeduplicationNodeSettings'

export type DefaultNodeSettingsComponent = (
  props: DefaultNodeSettingsProps
) => ReactElement

export const DEFAULT_NODE_SETTINGS_COMPONENTS: Record<string, DefaultNodeSettingsComponent> = {
  'Action.LogNode': ActionLogNodeSettings,
  'Rpc.SendRPCRequestNode': RpcSendRPCRequestNodeSettings,
  'Rpc.SendRPCReplyNode': RpcSendRPCReplyNodeSettings,
  'Delay.MsgDelayNode': DelayMsgDelayNodeSettings,
  'Flow.CheckpointNode': FlowCheckpointNodeSettings,
  'Flow.RuleChainInputNode': FlowRuleChainInputNodeSettings,
  'Flow.RuleChainOutputNode': FlowRuleChainOutputNodeSettings,
  'Flow.AckNode': FlowAckNodeSettings,
  'Ingest.IngestOutputNode': FlowRuleChainOutputNodeSettings,
  'Rest.RestApiCallNode': RestRestApiCallNodeSettings,
  'Mail.MsgToEmailNode': MailMsgToEmailNodeSettings,
  'Mail.SendEmailNode': MailSendEmailNodeSettings,
  'Sms.SendSmsNode': SmsSendSmsNodeSettings,
  'Telegram.SendTelegramNode': TelegramSendTelegramNodeSettings,
  'Filter.AssetTypeSwitchNode': FilterAssetTypeSwitchNodeSettings,
  'Filter.CheckAlarmStatusNode': FilterCheckAlarmStatusNodeSettings,
  'Filter.DeviceTypeSwitchNode': FilterDeviceTypeSwitchNodeSettings,
  'Action.CreateAlarmNode': ActionCreateAlarmNodeSettings,
  'Action.ClearAlarmNode': ActionClearAlarmNodeSettings,
  'Action.MsgCountNode': ActionMsgCountNodeSettings,
  'Action.DeviceStateNode': ActionDeviceStateNodeSettings,
  'Kafka.KafkaNode': KafkaKafkaNodeSettings,
  'Action.CreateRelationNode': ActionCreateRelationNodeSettings,
  'Action.DeleteRelationNode': ActionDeleteRelationNodeSettings,
  'Filter.CheckRelationNode': FilterCheckRelationNodeSettings,
  'Math.MathNode': MathMathNodeSettings,
  'Metadata.CalculateDeltaNode': MetadataCalculateDeltaNodeSettings,
  'Metadata.GetAttributesNode': MetadataGetAttributesNodeSettings,
  'Metadata.GetDeviceAttrNode': MetadataGetDeviceAttrNodeSettings,
  'Metadata.GetRelatedAttributeNode': MetadataGetRelatedAttributeNodeSettings,
  'Metadata.GetTelemetryNode': MetadataGetTelemetryNodeSettings,
  'Metadata.FetchDeviceCredentialsNode': MetadataFetchDeviceCredentialsNodeSettings,
  'Profile.DeviceProfileNode': ProfileDeviceProfileNodeSettings,
  'Telemetry.CalculatedFieldsNode': TelemetryCalculatedFieldsNodeSettings,
  'Telemetry.MsgDeleteAttributesNode': TelemetryMsgDeleteAttributesNodeSettings,
  'Transform.CopyKeysNode': TransformCopyKeysNodeSettings,
  'Transform.DeleteKeysNode': TransformDeleteKeysNodeSettings,
  'Transform.RenameKeysNode': TransformRenameKeysNodeSettings,
  'Transform.SplitArrayToMsgNode': TransformSplitArrayMsgNodeSettings,
  'Deduplication.MsgDeduplicationNode': DeduplicationMsgDeduplicationNodeSettings,
}
