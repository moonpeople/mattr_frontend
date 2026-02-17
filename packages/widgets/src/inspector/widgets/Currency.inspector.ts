import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = [
  'value',
  'placeholder',
  'currency',
  'decimalPlaces',
  'label',
  'textBefore',
  'textAfter',
  'iconBefore',
  'iconAfter',
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

export const CurrencyInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  value: {
    valueType: ['number', 'string', 'void'],
  },
  placeholder: {
    placeholder: 'Enter amount',
  },
  decimalPlaces: {
    advanced: true,
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
  customValidation: {
    section: 'Validation rules',
  },
  validationMessage: {
    section: 'Validation rules',
  },
  hideValidationMessage: {
    section: 'Appearance',
    advanced: true,
  },
  showSeparators: {
    section: 'Appearance',
    label: 'Show thousands separator',
  },
  padDecimal: {
    section: 'Appearance',
    advanced: true,
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
  preventScroll: {
    section: 'Interaction',
    advanced: true,
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
  textAlign: {
    section: 'Appearance',
    label: 'Alignment',
    options: [
      { label: 'Left', value: 'left' },
      { label: 'Right', value: 'right' },
    ],
  },
})

