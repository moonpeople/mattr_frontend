import { TextArea_Shadcn_ } from 'ui'

import type { WidgetDefinition } from '../types'
import { normalizeString } from '../helpers'
import { EditableTextAreaInspector } from './EditableTextArea.inspector'

type EditableTextAreaProps = {
  label: string
  labelCaption: string
  labelHide: boolean
  labelWrap: boolean
  labelPosition: 'left' | 'top'
  labelAlign: 'left' | 'right'
  labelWidthValue: string
  labelWidthUnit: 'px' | '%' | 'col'
  labelCaptionColor: string
  labelTextColor: string
  labelFont: string
  labelRequiredIndicatorColor: string
  placeholder: string
  value: string
  rows: number
  helperText: string
  disabled: boolean
  events: string
  editIcon: string
  tooltip: string
  addons?: string[]
  styles?: string[]
  validationRules?: string[]
  spellCheck: boolean
  enableBrowserAutofill: boolean
  autoCapitalize: 'none' | 'sentences' | 'words' | 'characters'
  readOnly: boolean
  loading: boolean
  formDataKey: string
  pattern: 'none' | 'email' | 'regex' | 'url'
  regex: string
  minLength?: number
  maxLength?: number
  required: boolean
  customRule: string
  showCharacterCount: boolean
  hideValidationMessage: boolean
  maintainSpaceWhenHidden: boolean
  alwaysShowInEditMode: boolean
  showOnDesktop: boolean
  showOnMobile: boolean
  accentColor: string
  baseTextColor: string
  fontFamily: string
  hoverBackground: string
  inputBorderRadius: string
  inputBackground: string
  inputPlaceholderColor: string
  inputTextColor: string
  placeholderColor: string
}

export const EditableTextAreaWidget: WidgetDefinition<EditableTextAreaProps> = {
  type: 'EditableTextArea',
  label: 'Editable Text Area',
  category: 'inputs',
  description: 'Inline editable multi-line text',
  defaultProps: {
    label: 'Label',
    labelCaption: '',
    labelHide: false,
    labelWrap: false,
    labelPosition: 'top',
    labelAlign: 'left',
    labelWidthValue: '',
    labelWidthUnit: 'col',
    labelCaptionColor: '',
    labelTextColor: '',
    labelFont: 'default',
    labelRequiredIndicatorColor: '',
    placeholder: 'Enter value',
    value: '',
    rows: 4,
    helperText: '',
    disabled: false,
    events: '[]',
    editIcon: 'edit',
    tooltip: '',
    spellCheck: true,
    enableBrowserAutofill: true,
    autoCapitalize: 'none',
    readOnly: false,
    loading: false,
    formDataKey: '{{self.id}}',
    pattern: 'none',
    regex: '',
    minLength: undefined,
    maxLength: undefined,
    required: false,
    customRule: '',
    showCharacterCount: false,
    hideValidationMessage: false,
    maintainSpaceWhenHidden: false,
    alwaysShowInEditMode: false,
    showOnDesktop: true,
    showOnMobile: true,
    accentColor: '',
    baseTextColor: '',
    fontFamily: '',
    hoverBackground: '',
    inputBorderRadius: '',
    inputBackground: '',
    inputPlaceholderColor: '',
    inputTextColor: '',
    placeholderColor: '',
  },
  fields: EditableTextAreaInspector.fields,
  render: (props, context) => (
    <div className="space-y-1">
      {!props.labelHide && props.label && (
        <label
          className={`text-xs font-medium text-foreground ${
            props.labelWrap ? 'whitespace-normal' : 'truncate'
          }`}
        >
          {props.label}
        </label>
      )}
      {!props.labelHide && props.labelCaption && (
        <div className="text-xs text-foreground-muted">{props.labelCaption}</div>
      )}
      <TextArea_Shadcn_
        rows={props.rows}
        placeholder={props.placeholder}
        value={normalizeString(context?.state?.value ?? props.value)}
        disabled={props.disabled}
        readOnly={props.readOnly}
        spellCheck={props.spellCheck}
        autoComplete={props.enableBrowserAutofill ? 'on' : 'off'}
        autoCapitalize={props.autoCapitalize}
        minLength={props.minLength}
        maxLength={props.maxLength}
        onChange={(event) => {
          const next = event.target.value
          context?.setState?.({ value: next })
          context?.runActions?.('change', { value: next })
        }}
      />
      {(props.helperText || props.showCharacterCount) && (
        <div className="flex items-center justify-between gap-2 text-xs text-foreground-muted">
          <span>{props.helperText}</span>
          {props.showCharacterCount && (
            <span>
              {normalizeString(context?.state?.value ?? props.value).length}
              {typeof props.maxLength === 'number' ? `/${props.maxLength}` : ''}
            </span>
          )}
        </div>
      )}
    </div>
  ),
}
