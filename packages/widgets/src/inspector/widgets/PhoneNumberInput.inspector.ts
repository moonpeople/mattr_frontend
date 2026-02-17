import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = [
  'value',
  'placeholder',
  'defaultCountry',
  'enableCountryChange',
  'international',
  'countryCallingCodeEditable',
  'limitMaxLength',
  'focusInputOnCountrySelection',
  'label',
  'labelPosition',
  'labelAlign',
  'labelWidthValue',
  'labelWidthUnit',
  'labelCaption',
  'labelHide',
  'labelWrap',
  'tooltipText',
  'helperText',
  'readOnly',
  'disabled',
  'required',
  'customRule',
  'validationMessage',
  'hideValidationMessage',
  'showClearButton',
  'loading',
  'events',
  'formDataKey',
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

export const PhoneNumberInputInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  value: {
    placeholder: '+15550000000',
    valueType: ['string', 'void'],
  },
  placeholder: {
    placeholder: '+1 (555) 000-0000',
  },
  defaultCountry: {
    placeholder: 'US',
  },
  customRule: {
    section: 'Validation rules',
  },
  validationMessage: {
    section: 'Validation rules',
  },
})

