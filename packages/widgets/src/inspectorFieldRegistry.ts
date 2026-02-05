import type { WidgetField } from './types'

const iconOptions = [
  { label: 'None', value: 'none' },
  { label: 'Edit', value: 'edit' },
  { label: 'Star', value: 'star' },
  { label: 'Alert', value: 'alert' },
  { label: 'User', value: 'user' },
  { label: 'Settings', value: 'settings' },
  { label: 'Check', value: 'check' },
]

const fontOptions = [
  { label: 'Default', value: 'default' },
  { label: 'Body', value: 'body' },
  { label: 'Heading', value: 'heading' },
  { label: 'Monospace', value: 'mono' },
]

const labelPositionOptions = [
  { label: 'Left', value: 'left' },
  { label: 'Top', value: 'top' },
]

const labelAlignOptions = [
  { label: 'Left', value: 'left' },
  { label: 'Right', value: 'right' },
]

const labelWidthUnitOptions = [
  { label: 'Col', value: 'col' },
  { label: 'Px', value: 'px' },
  { label: '%', value: '%' },
]

const autoCapitalizeOptions = [
  { label: 'None', value: 'none' },
  { label: 'Sentences', value: 'sentences' },
  { label: 'Words', value: 'words' },
  { label: 'Characters', value: 'characters' },
]

const patternOptions = [
  { label: 'None', value: 'none' },
  { label: 'Email', value: 'email' },
  { label: 'Regex', value: 'regex' },
  { label: 'URL', value: 'url' },
]

const fieldRegistry = new Map<string, WidgetField>([
  [
    'value',
    {
      key: 'value',
      label: 'Default value',
      type: 'text',
      placeholder: 'Default value',
      section: 'Content',
      supportsFx: true,
      valueType: 'String | Void',
      description:
        'Sets the value on initial render. If the default value is dynamic ({{ ... }}), the component will update when the value changes.',
    },
  ],
  [
    'placeholder',
    {
      key: 'placeholder',
      label: 'Placeholder',
      type: 'text',
      placeholder: 'Placeholder',
      section: 'Content',
      supportsFx: true,
      valueType: 'String | Void',
      description: 'Placeholder text shown when the value is empty.',
    },
  ],
  [
    'rows',
    {
      key: 'rows',
      label: 'Rows',
      type: 'number',
      min: 2,
      max: 12,
      step: 1,
      section: 'Content',
      valueType: 'Number | Void',
      description: 'Number of visible text rows.',
    },
  ],
  [
    'label',
    {
      key: 'label',
      label: 'Label',
      type: 'text',
      placeholder: 'Label',
      section: 'Add-ons',
      supportsFx: true,
      valueType: 'String | Void',
      description: 'Show a label for the input.',
    },
  ],
  [
    'prefix',
    {
      key: 'prefix',
      label: 'Prefix',
      type: 'text',
      placeholder: 'Prefix',
      section: 'Add-ons',
      supportsFx: true,
      valueType: 'String | Void',
      description: 'Add text to the front of the value.',
    },
  ],
  [
    'suffix',
    {
      key: 'suffix',
      label: 'Suffix',
      type: 'text',
      placeholder: 'Suffix',
      section: 'Add-ons',
      supportsFx: true,
      valueType: 'String | Void',
      description: 'Add text to the back of the value.',
    },
  ],
  [
    'prefixIcon',
    {
      key: 'prefixIcon',
      label: 'Prefix icon',
      type: 'select',
      options: iconOptions,
      section: 'Add-ons',
      valueType: 'String',
      description: 'Icon shown before the value.',
    },
  ],
  [
    'suffixIcon',
    {
      key: 'suffixIcon',
      label: 'Suffix icon',
      type: 'select',
      options: iconOptions,
      section: 'Add-ons',
      valueType: 'String',
      description: 'Icon shown after the value.',
    },
  ],
  [
    'editIcon',
    {
      key: 'editIcon',
      label: 'Edit icon',
      type: 'select',
      options: iconOptions,
      section: 'Add-ons',
      valueType: 'String',
      description:
        'Icon that appears on the right in non-edit mode to signal that the text is editable.',
    },
  ],
  [
    'tooltip',
    {
      key: 'tooltip',
      label: 'Tooltip',
      type: 'text',
      placeholder: 'Tooltip',
      section: 'Add-ons',
      supportsFx: true,
      valueType: 'String | Void',
      description: 'Show a tooltip on the component or its label on hover.',
    },
  ],
  [
    'helperText',
    {
      key: 'helperText',
      label: 'Helper text',
      type: 'text',
      placeholder: 'Helper text',
      section: 'Add-ons',
      supportsFx: true,
      valueType: 'String | Void',
      description: 'Show helper text below the input on focus.',
    },
  ],
  [
    'labelCaption',
    {
      key: 'labelCaption',
      label: 'Caption',
      type: 'text',
      placeholder: 'Caption',
      section: 'Label',
      supportsFx: true,
      valueType: 'String | Void',
      description: 'Caption text shown under the label.',
    },
  ],
  [
    'labelHide',
    {
      key: 'labelHide',
      label: 'Hide label',
      type: 'boolean',
      section: 'Label',
      supportsFx: true,
      valueType: 'Boolean | Void',
      description: 'Visually hide the label while keeping it for screen readers.',
    },
  ],
  [
    'labelWrap',
    {
      key: 'labelWrap',
      label: 'Allow wrapping',
      type: 'boolean',
      section: 'Label',
      supportsFx: true,
      valueType: 'Boolean | Void',
      description: 'Allow the label to wrap to multiple lines.',
    },
  ],
  [
    'labelPosition',
    {
      key: 'labelPosition',
      label: 'Position',
      type: 'select',
      options: labelPositionOptions,
      section: 'Label',
      valueType: 'String',
      description: 'Position the label relative to the input.',
    },
  ],
  [
    'labelAlign',
    {
      key: 'labelAlign',
      label: 'Alignment',
      type: 'select',
      options: labelAlignOptions,
      section: 'Label',
      valueType: 'String',
      description: 'Align the label text.',
    },
  ],
  [
    'labelWidthValue',
    {
      key: 'labelWidthValue',
      label: 'Width',
      type: 'text',
      placeholder: '12',
      section: 'Label',
      supportsFx: true,
      dependsOn: { key: 'labelPosition', value: 'left' },
      valueType: 'String | Void',
      description: 'Set label width when position is left.',
    },
  ],
  [
    'labelWidthUnit',
    {
      key: 'labelWidthUnit',
      label: 'Width unit',
      type: 'select',
      options: labelWidthUnitOptions,
      section: 'Label',
      dependsOn: { key: 'labelPosition', value: 'left' },
      valueType: 'String',
      description: 'Units for the label width.',
    },
  ],
  [
    'labelCaptionColor',
    {
      key: 'labelCaptionColor',
      label: 'Caption color',
      type: 'color',
      section: 'Label',
      valueType: 'String',
      description: 'Override the caption color.',
    },
  ],
  [
    'labelFont',
    {
      key: 'labelFont',
      label: 'Font',
      type: 'select',
      options: fontOptions,
      section: 'Label',
      valueType: 'String',
      description: 'Typography for the label.',
    },
  ],
  [
    'labelTextColor',
    {
      key: 'labelTextColor',
      label: 'Label color',
      type: 'color',
      section: 'Label',
      valueType: 'String',
      description: 'Override the label color.',
    },
  ],
  [
    'labelRequiredIndicatorColor',
    {
      key: 'labelRequiredIndicatorColor',
      label: 'Required indicator',
      type: 'color',
      section: 'Label',
      valueType: 'String',
      description: 'Override the required indicator color.',
    },
  ],
  [
    'spellCheck',
    {
      key: 'spellCheck',
      label: 'Enable spell check',
      type: 'boolean',
      section: 'Interaction',
      advanced: true,
      valueType: 'Boolean',
      description: 'Whether the input should be checked for spelling errors.',
    },
  ],
  [
    'enableBrowserAutofill',
    {
      key: 'enableBrowserAutofill',
      label: 'Enable browser autofill',
      type: 'boolean',
      section: 'Interaction',
      advanced: true,
      valueType: 'Boolean',
      description: 'Allow the browser to autofill the input.',
    },
  ],
  [
    'autoCapitalize',
    {
      key: 'autoCapitalize',
      label: 'Capitalize',
      type: 'select',
      options: autoCapitalizeOptions,
      section: 'Interaction',
      advanced: true,
      valueType: 'String',
      description: 'Sets the autocapitalize attribute for virtual keyboards.',
    },
  ],
  [
    'readOnly',
    {
      key: 'readOnly',
      label: 'Read only',
      type: 'boolean',
      section: 'Interaction',
      advanced: true,
      supportsFx: true,
      valueType: 'Boolean | Void',
      description:
        'Read only inputs are focusable and selectable but cannot be modified.',
    },
  ],
  [
    'disabled',
    {
      key: 'disabled',
      label: 'Disabled',
      type: 'boolean',
      section: 'Interaction',
      supportsFx: true,
      valueType: 'Boolean | Void',
      description: 'Prevent interaction with the input.',
    },
  ],
  [
    'showCharacterCount',
    {
      key: 'showCharacterCount',
      label: 'Show character count',
      type: 'boolean',
      section: 'Interaction',
      advanced: true,
      valueType: 'Boolean',
      description: 'Show the current character count.',
    },
  ],
  [
    'loading',
    {
      key: 'loading',
      label: 'Loading',
      type: 'boolean',
      section: 'Interaction',
      supportsFx: true,
      valueType: 'Boolean | Void',
      description: 'Show a loading indicator for the input.',
    },
  ],
  [
    'formDataKey',
    {
      key: 'formDataKey',
      label: 'Form data key',
      type: 'text',
      placeholder: 'formDataKey',
      section: 'Interaction',
      supportsFx: true,
      valueType: 'String | Void',
      description: 'Key for the wrapping form data. Empty or duplicate keys are omitted.',
    },
  ],
  [
    'pattern',
    {
      key: 'pattern',
      label: 'Pattern',
      type: 'select',
      options: patternOptions,
      section: 'Validation rules',
      valueType: 'String',
      description: 'Choose a built-in pattern or use Regex for custom rules.',
    },
  ],
  [
    'regex',
    {
      key: 'regex',
      label: 'Regex',
      type: 'text',
      placeholder: '^[A-Za-z]+',
      section: 'Validation rules',
      dependsOn: { key: 'pattern', value: 'regex' },
      valueType: 'String',
      description: 'JavaScript regular expression.',
    },
  ],
  [
    'minLength',
    {
      key: 'minLength',
      label: 'Min length',
      type: 'number',
      min: 0,
      section: 'Validation rules',
      valueType: 'Number | Void',
      description: 'Minimum number of characters.',
    },
  ],
  [
    'maxLength',
    {
      key: 'maxLength',
      label: 'Max length',
      type: 'number',
      min: 0,
      section: 'Validation rules',
      valueType: 'Number | Void',
      description: 'Maximum number of characters.',
    },
  ],
  [
    'required',
    {
      key: 'required',
      label: 'Required',
      type: 'boolean',
      section: 'Validation rules',
      supportsFx: true,
      valueType: 'Boolean | Void',
      description: 'Require a non-empty value.',
    },
  ],
  [
    'customRule',
    {
      key: 'customRule',
      label: 'Custom rule',
      type: 'text',
      placeholder: '{{ value }}',
      section: 'Validation rules',
      valueType: 'String | Void',
      description: 'Custom validation rule.',
    },
  ],
  [
    'showClearButton',
    {
      key: 'showClearButton',
      label: 'Show clear button',
      type: 'boolean',
      section: 'Appearance',
      supportsFx: true,
      valueType: 'Boolean | Void',
      description: 'Show a clear button inside the input.',
    },
  ],
  [
    'hideValidationMessage',
    {
      key: 'hideValidationMessage',
      label: 'Hide validation message',
      type: 'boolean',
      section: 'Appearance',
      advanced: true,
      supportsFx: true,
      valueType: 'Boolean | Void',
      description: 'Hide the inline error message when invalid.',
    },
  ],
  [
    'maintainSpaceWhenHidden',
    {
      key: 'maintainSpaceWhenHidden',
      label: 'Maintain space when hidden',
      type: 'boolean',
      section: 'Appearance',
      advanced: true,
      supportsFx: true,
      valueType: 'Boolean | Void',
      description: 'Visually hide the component without affecting layout.',
    },
  ],
  [
    'alwaysShowInEditMode',
    {
      key: 'alwaysShowInEditMode',
      label: 'Always show in edit mode',
      type: 'boolean',
      section: 'Appearance',
      advanced: true,
      valueType: 'Boolean',
      description: 'Show outline in edit mode instead of hiding.',
    },
  ],
  [
    'showOnDesktop',
    {
      key: 'showOnDesktop',
      label: 'Show on desktop',
      type: 'boolean',
      section: 'Appearance',
      advanced: true,
      valueType: 'Boolean',
      description: 'Show on desktop screens.',
    },
  ],
  [
    'showOnMobile',
    {
      key: 'showOnMobile',
      label: 'Show on mobile',
      type: 'boolean',
      section: 'Appearance',
      advanced: true,
      valueType: 'Boolean',
      description: 'Show on mobile screens.',
    },
  ],
  [
    'accentColor',
    {
      key: 'accentColor',
      label: 'Accent',
      type: 'color',
      section: 'Styles',
      valueType: 'String',
      description: 'Accent color for the input.',
    },
  ],
  [
    'baseTextColor',
    {
      key: 'baseTextColor',
      label: 'Base text',
      type: 'color',
      section: 'Styles',
      valueType: 'String',
      description: 'Base text color.',
    },
  ],
  [
    'fontFamily',
    {
      key: 'fontFamily',
      label: 'Font',
      type: 'select',
      options: fontOptions,
      section: 'Styles',
      valueType: 'String',
      description: 'Typography for the input.',
    },
  ],
  [
    'hoverBackground',
    {
      key: 'hoverBackground',
      label: 'Hover background',
      type: 'color',
      section: 'Styles',
      valueType: 'String',
      description: 'Background color on hover.',
    },
  ],
  [
    'inputBorderRadius',
    {
      key: 'inputBorderRadius',
      label: 'Input border radius',
      type: 'text',
      placeholder: '4px',
      section: 'Styles',
      supportsFx: true,
      valueType: 'String | Void',
      description: 'Border radius for the input.',
    },
  ],
  [
    'inputBackground',
    {
      key: 'inputBackground',
      label: 'Input background',
      type: 'color',
      section: 'Styles',
      valueType: 'String',
      description: 'Background color for the input.',
    },
  ],
  [
    'inputPlaceholderColor',
    {
      key: 'inputPlaceholderColor',
      label: 'Input placeholder',
      type: 'color',
      section: 'Styles',
      valueType: 'String',
      description: 'Placeholder color.',
    },
  ],
  [
    'inputTextColor',
    {
      key: 'inputTextColor',
      label: 'Input text',
      type: 'color',
      section: 'Styles',
      valueType: 'String',
      description: 'Input text color.',
    },
  ],
  [
    'placeholderColor',
    {
      key: 'placeholderColor',
      label: 'Placeholder',
      type: 'color',
      section: 'Styles',
      valueType: 'String',
      description: 'Placeholder color for the label.',
    },
  ],
])

export const getInspectorField = (key: string) => fieldRegistry.get(key)

export const resolveInspectorFields = (
  keys: string[],
  overrides?: Record<string, Partial<WidgetField>>
) => {
  return keys
    .map((key) => {
      const base = fieldRegistry.get(key)
      if (!base) {
        return null
      }
      const override = overrides?.[key] ?? {}
      return { ...base, ...override, key: base.key ?? key } as WidgetField
    })
    .filter((field): field is WidgetField => Boolean(field))
}

export const buildInspectorConfig = (
  fieldKeys: string[],
  fieldOverrides?: Record<string, Partial<WidgetField>>
) => {
  return {
    fieldKeys,
    fieldOverrides,
    fields: resolveInspectorFields(fieldKeys, fieldOverrides),
  }
}
