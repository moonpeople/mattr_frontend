import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

// Упорядоченный список ключей полей: формирует секции инспектора и их порядок.
const fieldKeys = [
  'value',
  'placeholder',
  'format',
  'currency',
  'decimalPlaces',
  'label',
  'textBefore',
  'textAfter',
  'iconBefore',
  'iconAfter',
  'editIcon',
  'tooltipText',
  'helperText',
  'labelCaption',
  'labelHide',
  'labelWrap',
  'labelPosition',
  'labelAlign',
  'labelWidthValue',
  'labelWidthUnit',
  'loading',
  'events',
  'formDataKey',
  'required',
  'min',
  'max',
  'allowNull',
  'customValidation',
  'validationMessage',
  'readOnly',
  'showStepper',
  'textAlign',
  'showSeparators',
  'showClear',
  'padDecimal',
  'disabled',
  'preventScroll',
  'hideValidationMessage',
  'maintainSpaceWhenHidden',
  'alwaysShowInEditMode',
  'showOnDesktop',
  'showOnMobile',
  'accentColor',
  'baseTextColor',
  'fontFamily',
  'hoverBackground',
  'inputBorderRadius',
  'inputBackground',
  'inputPlaceholderColor',
  'inputTextColor',
  'placeholderColor',
  'margin',
]

// Конфиг инспектора для EditableNumber: реестр полей + локальные переопределения.
export const EditableNumberInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  value: {
    valueType: ['number', 'string', 'void'],
  },
  placeholder: {
    placeholder: 'Enter number',
  },
  min: {
    section: 'Validation rules',
  },
  max: {
    section: 'Validation rules',
  },
  allowNull: {
    section: 'Validation rules',
  },
  hideValidationMessage: {
    section: 'Appearance',
    advanced: true,
  },
  textAlign: {
    section: 'Appearance',
    label: 'Alignment',
    options: [
      { label: 'Left', value: 'left' },
      { label: 'Right', value: 'right' },
    ],
  },
  padDecimal: {
    section: 'Appearance',
    advanced: true,
  },
  showSeparators: {
    section: 'Appearance',
    label: 'Show thousands separator',
  },
  showClear: {
    section: 'Appearance',
    label: 'Show clear button',
  },
  showStepper: {
    section: 'Interaction',
    advanced: true,
    supportsFx: true,
    valueType: ['boolean', 'void'],
  },
  formDataKey: {
    section: 'Interaction',
  },
  readOnly: {
    section: 'Interaction',
    advanced: true,
  },
  disabled: {
    section: 'Appearance',
    advanced: true,
  },
  preventScroll: {
    section: 'Appearance',
    advanced: true,
  },
  labelHide: {
    supportsFx: true,
    valueType: ['boolean', 'void'],
  },
  maintainSpaceWhenHidden: {
    section: 'Appearance',
    advanced: true,
  },
})
