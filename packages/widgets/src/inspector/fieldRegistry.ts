import type { WidgetField } from '../types'
import { getCountries, getCountryCallingCode } from 'react-phone-number-input'

const iconOptions = [
  { label: 'None', value: 'none' },
  { label: 'Edit', value: 'edit' },
  { label: 'Star', value: 'star' },
  { label: 'Alert', value: 'alert' },
  { label: 'User', value: 'user' },
  { label: 'Settings', value: 'settings' },
  { label: 'Check', value: 'check' },
  { label: 'Search', value: 'search' },
  { label: 'Arrow Right', value: 'arrowRight' },
  { label: 'Download', value: 'download' },
  { label: 'Send', value: 'send' },
  { label: 'Eye', value: 'eye' },
  { label: 'Eye Off', value: 'eyeOff' },
  { label: 'Mic', value: 'mic' },
  { label: 'Calendar', value: 'calendar' },
  { label: 'Phone', value: 'phone' },
  { label: 'Credit Card', value: 'creditCard' },
  { label: 'Chevron Down', value: 'chevronDown' },
  { label: 'Chevron Up', value: 'chevronUp' },
  { label: 'Plus', value: 'plus' },
  { label: 'Minus', value: 'minus' },
  { label: 'X', value: 'x' },
  { label: 'Copy', value: 'copy' },
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

const labelVariantOptions = [
  { label: 'Default', value: 'default' },
  { label: 'Overlapping', value: 'overlapping' },
  { label: 'Inset', value: 'inset' },
]

const labelAlignOptions = [
  { label: 'Left', value: 'left' },
  { label: 'Right', value: 'right' },
]

const textAlignOptions = [
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Right', value: 'right' },
]

const labelWidthUnitOptions = [
  { label: 'Col', value: 'col' },
  { label: 'Px', value: 'px' },
  { label: '%', value: '%' },
]

const spacingHeightOptions = [
  { label: 'Auto', value: 'auto' },
  { label: 'Fixed', value: 'fixed' },
]

const spacingMarginOptions = [
  { label: 'Normal', value: 'normal' },
  { label: 'None', value: 'none' },
]

const spacingPaddingOptions = [
  { label: 'Normal', value: 'normal' },
  { label: 'None', value: 'none' },
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

const inputTypeOptions = [
  { label: 'Text', value: 'text' },
  { label: 'Email', value: 'email' },
  { label: 'Password', value: 'password' },
  { label: 'Number', value: 'number' },
  { label: 'Search', value: 'search' },
  { label: 'URL', value: 'url' },
  { label: 'Tel', value: 'tel' },
  { label: 'File', value: 'file' },
]

const datetimeModeOptions = [
  { label: 'Date', value: 'date' },
  { label: 'Date & time', value: 'datetime' },
  { label: 'Time', value: 'time' },
  { label: 'Day', value: 'day' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
  { label: 'Date range', value: 'range' },
  { label: 'Calendar', value: 'calendar' },
]

const dateDisplayModeOptions = [
  { label: 'Input', value: 'input' },
  { label: 'Popover', value: 'popover' },
  { label: 'Inline calendar', value: 'inline' },
]

const calendarCaptionLayoutOptions = [
  { label: 'Label', value: 'label' },
  { label: 'Dropdown (month + year)', value: 'dropdown' },
  { label: 'Dropdown (month)', value: 'dropdown-months' },
  { label: 'Dropdown (year)', value: 'dropdown-years' },
]

const numberFormatOptions = [
  { label: 'Standart', value: 'decimal' },
  { label: 'Percent', value: 'percent' },
  { label: 'Currency', value: 'currency' },
]

const sliderThumbVariantOptions = [
  { label: 'Circle', value: 'circle' },
  { label: 'Bar', value: 'bar' },
]

const sliderTrackSizeOptions = [
  { label: 'Small', value: 'sm' },
  { label: 'Medium', value: 'md' },
  { label: 'Large', value: 'lg' },
  { label: 'Extra large', value: 'xl' },
]

const sliderTooltipFormatOptions = [
  { label: 'Number', value: 'number' },
  { label: 'Percent', value: 'percent' },
  { label: 'dB', value: 'db' },
  { label: 'Hz', value: 'hz' },
]

const ratingSizeOptions = [
  { label: 'Default', value: 'default' },
  { label: 'Small', value: 'small' },
]

const ratingIconOptions = [
  { label: 'Star', value: 'star' },
  { label: 'Heart', value: 'heart' },
  { label: 'Smile', value: 'smile' },
]

const phoneCountryOptions = [
  { label: 'Auto', value: 'auto' },
  ...getCountries().map((country) => ({
    label: `${country} (+${getCountryCallingCode(country)})`,
    value: country,
  })),
]

const addonTypeOptions = [
  { label: 'None', value: 'none' },
  { label: 'Text', value: 'text' },
  { label: 'Select', value: 'select' },
  { label: 'Button', value: 'button' },
]

const actionTypeOptions = [
  { label: 'None', value: 'none' },
  { label: 'Icon', value: 'icon' },
  { label: 'Text', value: 'text' },
]

const characterCountPositionOptions = [
  { label: 'Inline', value: 'inline' },
  { label: 'Below', value: 'below' },
]

const autoFillOptions = [
  { label: 'Off', value: 'off' },
  { label: 'Additional name', value: 'additional-name' },
  { label: 'Address line 1', value: 'address-line1' },
  { label: 'Address line 2', value: 'address-line2' },
  { label: 'Birthdate day', value: 'birthdate-day' },
  { label: 'Birthdate full', value: 'birthdate-full' },
  { label: 'Birthdate month', value: 'birthdate-month' },
  { label: 'Birthdate year', value: 'birthdate-year' },
  { label: 'CC security code', value: 'cc-csc' },
  { label: 'CC expiration', value: 'cc-exp' },
  { label: 'CC expiration day', value: 'cc-exp-day' },
  { label: 'CC expiration month', value: 'cc-exp-month' },
  { label: 'CC expiration year', value: 'cc-exp-year' },
  { label: 'CC number', value: 'cc-number' },
  { label: 'Country', value: 'country' },
  { label: 'Current password', value: 'current-password' },
  { label: 'Email', value: 'email' },
  { label: 'Family name', value: 'family-name' },
  { label: 'Gender', value: 'gender' },
  { label: 'Given name', value: 'given-name' },
  { label: 'Honorific prefix', value: 'honorific-prefix' },
  { label: 'Honorific suffix', value: 'honorific-suffix' },
  { label: 'Name', value: 'name' },
  { label: 'New password', value: 'new-password' },
  { label: 'One-time code', value: 'one-time-code' },
  { label: 'Postal code', value: 'postal-code' },
  { label: 'Street address', value: 'street-address' },
  { label: 'Telephone', value: 'tel' },
  { label: 'Username', value: 'username' },
]

const createSortedFieldRegistry = (entries: Array<[string, WidgetField]>) =>
  new Map<string, WidgetField>(
    [...entries].sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
  )

const fieldRegistry = createSortedFieldRegistry([
  [
    'accentColor',
    {
      key: 'accentColor',
      label: 'Accent',
      type: 'color',
      section: 'Styles',
      valueType: ['string'],
      description: 'Accent color for the input.',
    },
  ],

  [
    'accept',
    {
      key: 'accept',
      label: 'Accept',
      type: 'text',
      section: 'Content',
      placeholder: '.png,.jpg',
      valueType: ['string', 'void'],
      description: 'Accepted file types.',
    },
  ],

  [
    'actionIcon',
    {
      key: 'actionIcon',
      label: 'Action icon',
      type: 'select',
      options: iconOptions,
      section: 'Add-ons',
      dependsOn: { key: 'actionType', value: 'icon' },
      valueType: ['string'],
      description: 'Icon for the inline action.',
    },
  ],

  [
    'actionLabel',
    {
      key: 'actionLabel',
      label: 'Action label',
      type: 'text',
      placeholder: 'Send',
      section: 'Add-ons',
      dependsOn: { key: 'actionType', value: 'text' },
      supportsFx: true,
      valueType: ['string', 'void'],
      description: 'Label for the inline action.',
    },
  ],

  [
    'actionTooltip',
    {
      key: 'actionTooltip',
      label: 'Action tooltip',
      type: 'text',
      placeholder: 'Action',
      section: 'Add-ons',
      dependsOn: { key: 'actionType', value: 'icon' },
      supportsFx: true,
      valueType: ['string', 'void'],
      description: 'Tooltip for the inline action.',
    },
  ],

  [
    'actionType',
    {
      key: 'actionType',
      label: 'Inline action',
      type: 'select',
      options: actionTypeOptions,
      section: 'Add-ons',
      valueType: ['string'],
      description: 'Inline action inside the input.',
    },
  ],

  [
    'activeBackground',
    {
      key: 'activeBackground',
      label: 'Active background',
      type: 'color',
      section: 'Styles',
      valueType: ['string', 'void'],
      description: 'Background for active item.',
    },
  ],

  [
    'activeIconColor',
    {
      key: 'activeIconColor',
      label: 'Active icon',
      type: 'color',
      section: 'Styles',
      valueType: ['string', 'void'],
      description: 'Icon color for active item.',
    },
  ],

  [
    'activeIndex',
    {
      key: 'activeIndex',
      label: 'Active index',
      type: 'number',
      section: 'Content',
      min: -1,
      step: 1,
      valueType: ['number'],
      description: 'Active item index.',
    },
  ],

  [
    'activeTextColor',
    {
      key: 'activeTextColor',
      label: 'Active text',
      type: 'color',
      section: 'Styles',
      valueType: ['string', 'void'],
      description: 'Text color for active item.',
    },
  ],

  [
    'addonAfterButtonLabel',
    {
      key: 'addonAfterButtonLabel',
      label: 'End add-on button',
      type: 'text',
      placeholder: 'Send',
      section: 'Add-ons',
      dependsOn: { key: 'addonAfterType', value: 'button' },
      supportsFx: true,
      valueType: ['string', 'void'],
      description: 'Label for the end add-on button.',
    },
  ],

  [
    'addonAfterOptions',
    {
      key: 'addonAfterOptions',
      label: 'End add-on options',
      type: 'json',
      placeholder: '[{\"label\":\".com\",\"value\":\".com\"}]',
      section: 'Add-ons',
      dependsOn: { key: 'addonAfterType', value: 'select' },
      supportsFx: true,
      valueType: ['array', 'void'],
      description: 'Options for the end select add-on.',
    },
  ],

  [
    'addonAfterText',
    {
      key: 'addonAfterText',
      label: 'End add-on text',
      type: 'text',
      placeholder: '.com',
      section: 'Add-ons',
      dependsOn: { key: 'addonAfterType', value: 'text' },
      supportsFx: true,
      valueType: ['string', 'void'],
      description: 'Text for the end add-on.',
    },
  ],

  [
    'addonAfterType',
    {
      key: 'addonAfterType',
      label: 'End add-on',
      type: 'select',
      options: addonTypeOptions,
      section: 'Add-ons',
      valueType: ['string'],
      description: 'Add an attached element after the input.',
    },
  ],

  [
    'addonAfterValue',
    {
      key: 'addonAfterValue',
      label: 'End add-on value',
      type: 'text',
      placeholder: '.com',
      section: 'Add-ons',
      dependsOn: { key: 'addonAfterType', value: 'select' },
      supportsFx: true,
      valueType: ['string', 'void'],
      description: 'Selected value for the end select add-on.',
    },
  ],

  [
    'addonBeforeButtonLabel',
    {
      key: 'addonBeforeButtonLabel',
      label: 'Start add-on button',
      type: 'text',
      placeholder: 'Go',
      section: 'Add-ons',
      dependsOn: { key: 'addonBeforeType', value: 'button' },
      supportsFx: true,
      valueType: ['string', 'void'],
      description: 'Label for the start add-on button.',
    },
  ],

  [
    'addonBeforeOptions',
    {
      key: 'addonBeforeOptions',
      label: 'Start add-on options',
      type: 'json',
      placeholder: '[{\"label\":\"https://\",\"value\":\"https://\"}]',
      section: 'Add-ons',
      dependsOn: { key: 'addonBeforeType', value: 'select' },
      supportsFx: true,
      valueType: ['array', 'void'],
      description: 'Options for the start select add-on.',
    },
  ],

  [
    'addonBeforeText',
    {
      key: 'addonBeforeText',
      label: 'Start add-on text',
      type: 'text',
      placeholder: 'https://',
      section: 'Add-ons',
      dependsOn: { key: 'addonBeforeType', value: 'text' },
      supportsFx: true,
      valueType: ['string', 'void'],
      description: 'Text for the start add-on.',
    },
  ],

  [
    'addonBeforeType',
    {
      key: 'addonBeforeType',
      label: 'Start add-on',
      type: 'select',
      options: addonTypeOptions,
      section: 'Add-ons',
      valueType: ['string'],
      description: 'Add an attached element before the input.',
    },
  ],

  [
    'addonBeforeValue',
    {
      key: 'addonBeforeValue',
      label: 'Start add-on value',
      type: 'text',
      placeholder: 'https://',
      section: 'Add-ons',
      dependsOn: { key: 'addonBeforeType', value: 'select' },
      supportsFx: true,
      valueType: ['string', 'void'],
      description: 'Selected value for the start select add-on.',
    },
  ],

  [
    'align',
    {
      key: 'align',
      label: 'Align',
      type: 'select',
      section: 'Appearance',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' },
      ],
      valueType: ['string'],
      description: 'Text alignment.',
    },
  ],

  [
    'allowHalf',
    {
      key: 'allowHalf',
      label: 'Allow half',
      type: 'boolean',
      section: 'Content',
      valueType: ['boolean'],
      description: 'Allow half-step values.',
    },
  ],

  [
    'allowNull',
    {
      key: 'allowNull',
      label: 'Allow null',
      type: 'boolean',
      section: 'Content',
      valueType: ['boolean'],
      description: 'Allow empty (null) values.',
    },
  ],

  [
    'allowWrap',
    {
      key: 'allowWrap',
      label: 'Allow wrap',
      type: 'boolean',
      section: 'Appearance',
      valueType: ['boolean'],
      description: 'Allow wrapping to multiple lines.',
    },
  ],

  [
    'alt',
    {
      key: 'alt',
      label: 'Alt text',
      type: 'text',
      section: 'Content',
      placeholder: 'Image description',
      valueType: ['string', 'void'],
      description: 'Alternative text for accessibility.',
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
      valueType: ['boolean'],
      description: 'Show the component in the editor even when it is hidden.',
    },
  ],

  [
    'aspectRatio',
    {
      key: 'aspectRatio',
      label: 'Aspect ratio',
      type: 'number',
      section: 'Appearance',
      min: 0.2,
      max: 4,
      step: 0.1,
      valueType: ['number'],
      description: 'Aspect ratio of media.',
    },
  ],

  [
    'authType',
    {
      key: 'authType',
      label: 'Auth type',
      type: 'text',
      section: 'Content',
      placeholder: 'password',
      valueType: ['string', 'void'],
      description: 'Auth type label.',
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
      valueType: ['string'],
      description: 'Sets the autocapitalize attribute for virtual keyboards.',
    },
  ],

  [
    'autoFill',
    {
      key: 'autoFill',
      label: 'Autofill',
      type: 'select',
      options: autoFillOptions,
      section: 'Interaction',
      valueType: ['string'],
      dependsOn: { key: 'enableBrowserAutofill', value: true },
      description:
        'The data type of the input field for browsers to autofill when autocomplete is enabled.',
    },
  ],

  [
    'autoplay',
    {
      key: 'autoplay',
      label: 'Autoplay',
      type: 'boolean',
      section: 'Content',
      valueType: ['boolean'],
      description: 'Start playback automatically.',
    },
  ],

  [
    'autoResize',
    {
      key: 'autoResize',
      label: 'Auto resize',
      type: 'boolean',
      section: 'Appearance',
      valueType: ['boolean'],
      description: 'Automatically resize the text area to fit its content.',
    },
  ],

  [
    'background',
    {
      key: 'background',
      label: 'Background',
      type: 'select',
      section: 'Appearance',
      options: [
        { label: 'Surface', value: 'surface' },
        { label: 'Muted', value: 'muted' },
        { label: 'Transparent', value: 'transparent' },
      ],
      valueType: ['string'],
      description: 'Container background style.',
    },
  ],

  [
    'baseTextColor',
    {
      key: 'baseTextColor',
      label: 'Base text',
      type: 'color',
      section: 'Styles',
      valueType: ['string'],
      description: 'Base text color.',
    },
  ],

  [
    'body',
    {
      key: 'body',
      label: 'Body',
      type: 'textarea',
      section: 'Content',
      placeholder: 'Content',
      valueType: ['string', 'void'],
      description: 'Body content.',
    },
  ],

  [
    'bordered',
    {
      key: 'bordered',
      label: 'Border',
      type: 'boolean',
      section: 'Appearance',
      valueType: ['boolean'],
      description: 'Show border around the container.',
    },
  ],

  [
    'boxes',
    {
      key: 'boxes',
      label: 'Boxes (JSON)',
      type: 'json',
      section: 'Content',
      placeholder: '[{"x":0,"y":0,"width":100,"height":100}]',
      valueType: ['array', 'object'],
      description: 'Bounding box list.',
    },
  ],

  [
    'calendarCaptionLayout',
    {
      key: 'calendarCaptionLayout',
      label: 'Caption layout',
      type: 'select',
      options: calendarCaptionLayoutOptions,
      section: 'Appearance',
      valueType: ['string'],
      description: 'How month/year controls are displayed in calendar header.',
    },
  ],

  [
    'caption',
    {
      key: 'caption',
      label: 'Caption',
      type: 'text',
      section: 'Content',
      placeholder: 'Caption',
      valueType: ['string', 'void'],
      description: 'Caption text.',
    },
  ],

  [
    'captionByIndex',
    {
      key: 'captionByIndex',
      label: 'Caption',
      type: 'text',
      section: 'Content',
      placeholder: '{{ item.caption }}',
      dependsOn: { key: 'itemMode', value: 'dynamic' },
      supportsFx: true,
      valueType: ['string', 'void'],
      description: 'Optional caption text for items.',
    },
  ],

  [
    'characterCountPosition',
    {
      key: 'characterCountPosition',
      label: 'Character count position',
      type: 'select',
      options: characterCountPositionOptions,
      section: 'Interaction',
      advanced: true,
      dependsOn: { key: 'showCharacterCount', value: true },
      valueType: ['string'],
      description: 'Where to show the character count.',
    },
  ],

  [
    'checked',
    {
      key: 'checked',
      label: 'Checked',
      type: 'boolean',
      section: 'Content',
      valueType: ['boolean'],
      description: 'Checked state.',
    },
  ],

  [
    'checkStrictly',
    {
      key: 'checkStrictly',
      label: 'Check strictly',
      type: 'boolean',
      section: 'Content',
      valueType: ['boolean'],
      description:
        'If enabled, each node is selected independently. If disabled, parent selection controls leaf descendants.',
    },
  ],

  [
    'closeOnOutsideClick',
    {
      key: 'closeOnOutsideClick',
      label: 'Close on outside click',
      type: 'boolean',
      section: 'Interaction',
      valueType: ['boolean'],
      description: 'Close when clicking outside.',
    },
  ],

  [
    'closeOnSelect',
    {
      key: 'closeOnSelect',
      label: 'Close on select',
      type: 'boolean',
      section: 'Interaction',
      supportsFx: true,
      valueType: ['boolean', 'void'],
      description: 'Close popover after choosing value.',
    },
  ],

  [
    'collapsible',
    {
      key: 'collapsible',
      label: 'Collapsible',
      type: 'boolean',
      section: 'Interaction',
      valueType: ['boolean'],
      description: 'Allow collapsing and expanding the panel.',
    },
  ],

  [
    'color',
    {
      key: 'color',
      label: 'Color',
      type: 'color',
      section: 'Styles',
      valueType: ['string', 'void'],
      description: 'Icon or text color.',
    },
  ],

  [
    'columns',
    {
      key: 'columns',
      label: 'Columns',
      type: 'json',
      section: 'Content',
      placeholder:
        '[{"id":"column1","source":"name","label":"Name","format":"String","value":"","headerTooltip":"","cellTooltip":"","caption":"","statusIndicator":""}]',
      supportsFx: true,
      valueType: ['array', 'object', 'string', 'undefined'],
      description: 'Column[] config for table rendering.',
    },
  ],

  [
    'columnsMode',
    {
      key: 'columnsMode',
      label: 'Columns mode',
      type: 'radioGroup',
      section: 'Content',
      options: [
        { label: 'Manual', value: 'manual' },
        { label: 'Mapped', value: 'mapped' },
      ],
      valueType: ['string'],
      description: 'Use manual columns or infer columns from incoming data keys.',
    },
  ],

  [
    'comments',
    {
      key: 'comments',
      label: 'Comments (JSON)',
      type: 'json',
      section: 'Content',
      placeholder: '[{"text":"Hello"}]',
      valueType: ['array', 'object'],
      description: 'Comment list.',
    },
  ],

  [
    'countryCallingCodeEditable',
    {
      key: 'countryCallingCodeEditable',
      label: 'Editable country code',
      type: 'boolean',
      section: 'Interaction',
      advanced: true,
      supportsFx: true,
      valueType: ['boolean', 'void'],
      description: 'Allow editing the country calling code part of the number.',
    },
  ],

  [
    'css',
    {
      key: 'css',
      label: 'CSS',
      type: 'textarea',
      section: 'Content',
      placeholder: '.myClass { color: red; }',
      valueType: ['string'],
      description: 'CSS styles for the HTML.',
    },
  ],

  [
    'currency',
    {
      key: 'currency',
      label: 'Currency',
      type: 'text',
      placeholder: 'USD',
      section: 'Content',
      dependsOn: { key: 'format', value: 'currency' },
      valueType: ['string', 'void'],
      description: 'Currency code for formatted values.',
    },
  ],

  [
    'currentStep',
    {
      key: 'currentStep',
      label: 'Current step',
      type: 'text',
      section: 'Content',
      placeholder: 'Step 1',
      valueType: ['string', 'void'],
      description: 'Currently active step.',
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
      valueType: ['string', 'void'],
      description: 'Custom validation rule.',
    },
  ],

  [
    'customValidation',
    {
      key: 'customValidation',
      label: 'Custom validation',
      type: 'text',
      placeholder: '{{ value }}',
      section: 'Validation rules',
      supportsFx: true,
      valueType: ['string', 'void'],
      description: 'Custom validation expression.',
    },
  ],

  [
    'data',
    {
      key: 'data',
      label: 'Data source',
      type: 'json',
      section: 'Content',
      placeholder: '[{"id":"page1","title":"Home"}]',
      dependsOn: { key: 'itemMode', value: 'dynamic' },
      supportsFx: true,
      valueType: ['array', 'object'],
      description: 'Data array used to generate menu items.',
    },
  ],

  [
    'decimalPlaces',
    {
      key: 'decimalPlaces',
      label: 'Decimal places',
      type: 'number',
      min: 0,
      max: 12,
      step: 1,
      section: 'Content',
      valueType: ['number', 'void'],
      description: 'Number of decimal places to display.',
    },
  ],

  [
    'defaultCountry',
    {
      key: 'defaultCountry',
      label: 'Default country',
      type: 'select',
      section: 'Content',
      options: phoneCountryOptions,
      supportsFx: true,
      valueType: ['string', 'void'],
      description:
        'Two-letter country code (ISO 3166-1 alpha-2) used as the initial selected country.',
    },
  ],

  [
    'defaultTab',
    {
      key: 'defaultTab',
      label: 'Default tab',
      type: 'text',
      section: 'Content',
      placeholder: 'Tab 1',
      valueType: ['string', 'void'],
      description: 'Initial active tab label.',
    },
  ],

  [
    'description',
    {
      key: 'description',
      label: 'Description',
      type: 'textarea',
      section: 'Content',
      placeholder: 'Description',
      valueType: ['string', 'void'],
      description: 'Descriptive text.',
    },
  ],

  [
    'descriptionKey',
    {
      key: 'descriptionKey',
      label: 'Description key',
      type: 'text',
      section: 'Content',
      placeholder: 'description',
      valueType: ['string', 'void'],
      description: 'Key for item description.',
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
      valueType: ['boolean', 'void'],
      description: 'Prevent interaction with the input.',
    },
  ],

  [
    'disabledByIndex',
    {
      key: 'disabledByIndex',
      label: 'Disabled',
      type: 'text',
      section: 'Content',
      placeholder: '{{ item.disabled }}',
      supportsFx: true,
      valueType: ['boolean', 'string', 'void'],
      description: 'Expression to disable items.',
    },
  ],

  [
    'disabledDates',
    {
      key: 'disabledDates',
      label: 'Disabled dates (JSON)',
      type: 'json',
      section: 'Interaction',
      placeholder:
        '["2026-01-01", {"weekdays":[0,6]}, {"before":"2025-01-01"}, {"after":"2027-12-31"}]',
      valueType: ['array', 'object', 'void'],
      description: 'Dates/rules that cannot be selected.',
    },
  ],

  [
    'displayMode',
    {
      key: 'displayMode',
      label: 'Display mode',
      type: 'select',
      options: dateDisplayModeOptions,
      section: 'Appearance',
      valueType: ['string'],
      description: 'How the picker is rendered.',
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
      supportsFx: true,
      valueType: ['string', 'void'],
      description:
        'Icon that appears on the right in non-edit mode to signal that the text is editable.',
    },
  ],

  [
    'elapsedMs',
    {
      key: 'elapsedMs',
      label: 'Elapsed (ms)',
      type: 'number',
      section: 'Content',
      min: 0,
      step: 100,
      valueType: ['number'],
      description: 'Elapsed time in milliseconds.',
    },
  ],

  [
    'embedUrl',
    {
      key: 'embedUrl',
      label: 'Embed URL',
      type: 'text',
      section: 'Content',
      placeholder: 'https://...',
      valueType: ['string'],
      description: 'External embed URL.',
    },
  ],

  [
    'emptyDescription',
    {
      key: 'emptyDescription',
      label: 'Empty description',
      type: 'text',
      section: 'Content',
      placeholder: 'Post your first comment',
      valueType: ['string', 'void'],
      description: 'Empty state description.',
    },
  ],

  [
    'emptyMessage',
    {
      key: 'emptyMessage',
      label: 'Empty message',
      type: 'text',
      section: 'Content',
      placeholder: 'Sign here',
      valueType: ['string', 'void'],
      description: 'Placeholder message when empty.',
    },
  ],

  [
    'emptyTitle',
    {
      key: 'emptyTitle',
      label: 'Empty title',
      type: 'text',
      section: 'Content',
      placeholder: 'No comments here yet',
      valueType: ['string', 'void'],
      description: 'Empty state title.',
    },
  ],

  [
    'enableBrowserAutofill',
    {
      key: 'enableBrowserAutofill',
      label: 'Autocomplete',
      type: 'boolean',
      section: 'Interaction',
      valueType: ['boolean'],
      description: 'Whether the browser can perform autocomplete on the input field.',
    },
  ],

  [
    'enableCountryChange',
    {
      key: 'enableCountryChange',
      label: 'Enable country select',
      type: 'boolean',
      section: 'Interaction',
      supportsFx: true,
      valueType: ['boolean', 'void'],
      description: 'Allow changing the selected country.',
    },
  ],

  [
    'end',
    {
      key: 'end',
      label: 'End',
      type: 'number',
      section: 'Content',
      min: -100000,
      max: 100000,
      step: 1,
      valueType: ['number'],
      description: 'End value.',
    },
  ],

  [
    'endDate',
    {
      key: 'endDate',
      label: 'End date',
      type: 'text',
      section: 'Content',
      placeholder: 'YYYY-MM-DD',
      valueType: ['string', 'void'],
      description: 'End date.',
    },
  ],

  [
    'enforceMaxLength',
    {
      key: 'enforceMaxLength',
      label: 'Enforce max length',
      type: 'boolean',
      section: 'Interaction',
      advanced: true,
      valueType: ['boolean'],
      description: 'Whether to enforce the maximum length in the input element.',
    },
  ],

  [
    'events',
    {
      key: 'events',
      label: 'Event handlers',
      type: 'custom',
      section: 'Interaction',
      valueType: ['array', 'object'],
      description: 'Event handlers for the component.',
    },
  ],

  [
    'events',
    {
      key: 'events',
      label: 'Events (JSON)',
      type: 'json',
      section: 'Interaction',
      placeholder: '[{"event":"rowClick","type":"query","queryName":"onRow"}]',
      valueType: ['array', 'object'],
      description: 'Event handler definitions.',
    },
  ],

  [
    'expandToFit',
    {
      key: 'expandToFit',
      label: 'Expand to fit',
      type: 'boolean',
      section: 'Appearance',
      valueType: ['boolean'],
      description: 'Expand content to fit.',
    },
  ],

  [
    'fallbacks',
    {
      key: 'fallbacks',
      label: 'Fallbacks (JSON)',
      type: 'json',
      section: 'Content',
      placeholder: '["Hanson Deck","Sue Shei"]',
      valueType: ['array', 'object'],
      description: 'Fallback labels for avatars.',
    },
  ],

  [
    'fields',
    {
      key: 'fields',
      label: 'Fields (JSON)',
      type: 'json',
      section: 'Content',
      placeholder: '[{"label":"Name","type":"text"}]',
      valueType: ['array', 'object'],
      description: 'Form fields.',
    },
  ],

  [
    'filterStack',
    {
      key: 'filterStack',
      label: 'Filter stack (JSON)',
      type: 'json',
      section: 'Content',
      placeholder:
        '{"operator":"and","filters":[{"columnId":"status","operator":"is","value":"Active"}]}',
      valueType: ['array', 'object'],
      description: 'Structured filter payload applied to table rows.',
    },
  ],

  [
    'firstPaneSize',
    {
      key: 'firstPaneSize',
      label: 'First pane size (%)',
      type: 'number',
      section: 'Appearance',
      min: 5,
      max: 95,
      step: 1,
      valueType: ['number'],
      description: 'Default size for the first pane in percent.',
    },
  ],

  [
    'fit',
    {
      key: 'fit',
      label: 'Object fit',
      type: 'select',
      section: 'Appearance',
      options: [
        { label: 'Cover', value: 'cover' },
        { label: 'Contain', value: 'contain' },
      ],
      valueType: ['string'],
      description: 'How media should fit its container.',
    },
  ],

  [
    'focusInputOnCountrySelection',
    {
      key: 'focusInputOnCountrySelection',
      label: 'Focus on country change',
      type: 'boolean',
      section: 'Interaction',
      advanced: true,
      supportsFx: true,
      valueType: ['boolean', 'void'],
      description: 'Focus the input when the country is changed.',
    },
  ],

  [
    'fontFamily',
    {
      key: 'fontFamily',
      label: 'Type style',
      type: 'select',
      control: 'typography',
      options: fontOptions,
      section: 'Styles',
      valueType: ['string'],
      description: 'Typography style for the input.',
    },
  ],

  [
    'footerPadding',
    {
      key: 'footerPadding',
      label: 'Footer padding',
      type: 'select',
      section: 'Appearance',
      options: [
        { label: 'Small', value: 'sm' },
        { label: 'Medium', value: 'md' },
        { label: 'Large', value: 'lg' },
      ],
      valueType: ['string'],
      description: 'Inner padding for sidebar footer only.',
    },
  ],

  [
    'format',
    {
      key: 'format',
      label: 'Format',
      type: 'select',
      options: numberFormatOptions,
      section: 'Content',
      valueType: ['string'],
      description: 'Format the number value.',
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
      valueType: ['string', 'void'],
      description: 'Key for the wrapping form data. Empty or duplicate keys are omitted.',
    },
  ],

  [
    'fromYear',
    {
      key: 'fromYear',
      label: 'From year',
      type: 'number',
      min: 1900,
      max: 2200,
      step: 1,
      section: 'Appearance',
      valueType: ['number', 'void'],
      description: 'Lower year bound for calendar navigation.',
    },
  ],

  [
    'gap',
    {
      key: 'gap',
      label: 'Gap',
      type: 'number',
      section: 'Appearance',
      min: 0,
      max: 64,
      step: 1,
      valueType: ['number'],
      description: 'Spacing between items.',
    },
  ],

  [
    'groupLayout',
    {
      key: 'groupLayout',
      label: 'Layout',
      type: 'select',
      section: 'Appearance',
      options: [
        { label: 'Vertical', value: 'vertical' },
        { label: 'Horizontal', value: 'horizontal' },
      ],
      valueType: ['string'],
      description: 'Choose vertical or horizontal checkbox layout.',
    },
  ],

  [
    'groupSize',
    {
      key: 'groupSize',
      label: 'Group size',
      type: 'number',
      min: 0,
      section: 'Content',
      valueType: ['number', 'void'],
      description: 'Insert a separator every N slots (0 disables).',
    },
  ],

  [
    'headerPadding',
    {
      key: 'headerPadding',
      label: 'Header padding',
      type: 'select',
      section: 'Appearance',
      options: [
        { label: 'Small', value: 'sm' },
        { label: 'Medium', value: 'md' },
        { label: 'Large', value: 'lg' },
      ],
      valueType: ['string'],
      description: 'Inner padding for sidebar header only.',
    },
  ],

  [
    'height',
    {
      key: 'height',
      label: 'Height',
      type: 'radioGroup',
      options: spacingHeightOptions,
      section: 'Spacing',
      valueType: ['string'],
      description: 'Height behavior for the widget.',
      source: 'spacing',
      segmentedFx: {
        modeKey: 'heightMode',
        fxEnabledKey: 'heightFxEnabled',
        fxKey: 'heightFx',
        defaultMode: 'auto',
        fxPlaceholder: "{{ condition ? 'auto' : 'fixed' }}",
      },
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
      valueType: ['string', 'void'],
      description: 'Show helper text below the input on focus.',
    },
  ],

  [
    'hiddenByIndex',
    {
      key: 'hiddenByIndex',
      label: 'Hidden',
      type: 'text',
      section: 'Content',
      placeholder: '{{ item.hidden }}',
      supportsFx: true,
      valueType: ['boolean', 'string', 'void'],
      description: 'Expression to hide items.',
    },
  ],

  [
    'hideSubmit',
    {
      key: 'hideSubmit',
      label: 'Hide submit',
      type: 'boolean',
      section: 'Interaction',
      valueType: ['boolean'],
      description: 'Hide the submit action.',
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
      valueType: ['boolean', 'void'],
      description: 'Hide the inline error message when invalid.',
    },
  ],

  [
    'highlightByIndex',
    {
      key: 'highlightByIndex',
      label: 'Highlight',
      type: 'text',
      section: 'Content',
      placeholder: '{{ retoolContext.currentPage === item.id }}',
      supportsFx: true,
      valueType: ['boolean', 'string', 'void'],
      description: 'Expression to highlight items.',
    },
  ],

  [
    'horizontalAlignment',
    {
      key: 'horizontalAlignment',
      label: 'Horizontal alignment',
      type: 'radioGroup',
      section: 'Appearance',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' },
      ],
      dependsOn: { key: 'orientation', value: 'horizontal' },
      valueType: ['string'],
      description: 'Alignment for horizontal navigation.',
    },
  ],

  [
    'hour12',
    {
      key: 'hour12',
      label: '12-hour clock',
      type: 'boolean',
      section: 'Appearance',
      supportsFx: true,
      valueType: ['boolean', 'void'],
      description: 'Use AM/PM format hints.',
    },
  ],

  [
    'hoverBackground',
    {
      key: 'hoverBackground',
      label: 'Hover background',
      type: 'color',
      section: 'Styles',
      valueType: ['string'],
      description: 'Background color on hover.',
    },
  ],

  [
    'hoverBackground',
    {
      key: 'hoverBackground',
      label: 'Hover background',
      type: 'color',
      section: 'Styles',
      valueType: ['string', 'void'],
      description: 'Background on hover.',
    },
  ],

  [
    'href',
    {
      key: 'href',
      label: 'URL',
      type: 'text',
      section: 'Content',
      placeholder: 'https://...',
      valueType: ['string', 'void'],
      description: 'Link URL.',
    },
  ],

  [
    'html',
    {
      key: 'html',
      label: 'HTML',
      type: 'textarea',
      section: 'Content',
      placeholder: '<div>Hello</div>',
      valueType: ['string'],
      description: 'HTML markup to render.',
    },
  ],

  [
    'icon',
    {
      key: 'icon',
      label: 'Icon',
      type: 'select',
      section: 'Content',
      options: [
        { label: 'Star', value: 'star' },
        { label: 'Alert', value: 'alert' },
        { label: 'User', value: 'user' },
        { label: 'Settings', value: 'settings' },
        { label: 'Check', value: 'check' },
      ],
      valueType: ['string'],
      description: 'Icon to display.',
    },
  ],

  [
    'iconAfter',
    {
      key: 'iconAfter',
      label: 'Icon after',
      type: 'select',
      options: iconOptions,
      section: 'Add-ons',
      supportsFx: true,
      valueType: ['string', 'void'],
      description: 'Icon shown after the value.',
    },
  ],

  [
    'iconBefore',
    {
      key: 'iconBefore',
      label: 'Icon before',
      type: 'select',
      options: iconOptions,
      section: 'Add-ons',
      supportsFx: true,
      valueType: ['string', 'void'],
      description: 'Icon shown before the value.',
    },
  ],

  [
    'iconByIndex',
    {
      key: 'iconByIndex',
      label: 'Icon',
      type: 'json',
      section: 'Content',
      placeholder:
        '["bold/interface-home-3","bold/interface-user-multiple"]',
      dependsOn: { key: 'itemMode', value: 'dynamic' },
      valueType: ['array', 'object'],
      description: 'Icon list or mapping for items.',
    },
  ],

  [
    'iconColor',
    {
      key: 'iconColor',
      label: 'Icon color',
      type: 'color',
      section: 'Styles',
      valueType: ['string', 'void'],
      description: 'Default icon color.',
    },
  ],

  [
    'iconSize',
    {
      key: 'iconSize',
      label: 'Icon size',
      type: 'number',
      section: 'Appearance',
      min: 12,
      max: 48,
      step: 1,
      valueType: ['number', 'void'],
      description: 'Size of the rating icon in pixels.',
    },
  ],

  [
    'images',
    {
      key: 'images',
      label: 'Images (JSON)',
      type: 'json',
      section: 'Content',
      placeholder: '[{\"src\":\"https://...\",\"caption\":\"\"}]',
      valueType: ['array', 'object'],
      description: 'Image list for galleries.',
    },
  ],

  [
    'imageUrl',
    {
      key: 'imageUrl',
      label: 'Image URL',
      type: 'text',
      section: 'Content',
      placeholder: 'https://...',
      valueType: ['string', 'void'],
      description: 'Image source URL.',
    },
  ],

  [
    'inputBackground',
    {
      key: 'inputBackground',
      label: 'Input background',
      type: 'color',
      section: 'Styles',
      valueType: ['string'],
      description: 'Background color for the input.',
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
      valueType: ['string', 'void'],
      description: 'Border radius for the input.',
    },
  ],

  [
    'inputPlaceholderColor',
    {
      key: 'inputPlaceholderColor',
      label: 'Input placeholder',
      type: 'color',
      section: 'Styles',
      valueType: ['string'],
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
      valueType: ['string'],
      description: 'Input text color.',
    },
  ],

  [
    'international',
    {
      key: 'international',
      label: 'International format',
      type: 'boolean',
      section: 'Content',
      supportsFx: true,
      valueType: ['boolean', 'void'],
      description: 'Format and interpret numbers in international format.',
    },
  ],

  [
    'interval',
    {
      key: 'interval',
      label: 'Tick interval (ms)',
      type: 'number',
      section: 'Content',
      min: 100,
      step: 100,
      valueType: ['number'],
      description: 'Tick interval in ms.',
    },
  ],

  [
    'isRunning',
    {
      key: 'isRunning',
      label: 'Running',
      type: 'boolean',
      section: 'Content',
      valueType: ['boolean'],
      description: 'Run state.',
    },
  ],

  [
    'itemBorderRadius',
    {
      key: 'itemBorderRadius',
      label: 'Item radius',
      type: 'text',
      section: 'Styles',
      placeholder: '8px',
      valueType: ['string', 'void'],
      description: 'Border radius for items.',
    },
  ],

  [
    'itemMode',
    {
      key: 'itemMode',
      label: 'Mode',
      type: 'radioGroup',
      section: 'Content',
      options: [
        { label: 'Manual', value: 'static' },
        { label: 'Mapped', value: 'dynamic' },
      ],
      valueType: ['string'],
      description: 'Choose between manual items and mapped data.',
    },
  ],

  [
    'items',
    {
      key: 'items',
      label: 'Items (JSON)',
      type: 'json',
      section: 'Content',
      placeholder: '["Item 1","Item 2"]',
      valueType: ['array', 'object'],
      description: 'List of items.',
    },
  ],

  [
    'keyTitle',
    {
      key: 'keyTitle',
      label: 'Key title',
      type: 'text',
      section: 'Content',
      placeholder: 'Key',
      valueType: ['string', 'void'],
      description: 'Title for key column.',
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
      valueType: ['string', 'void'],
      description: 'Show a label for the input.',
    },
  ],

  [
    'labelAlign',
    {
      key: 'labelAlign',
      label: 'Alignment',
      type: 'radioGroup',
      options: labelAlignOptions,
      section: 'Label',
      valueType: ['string'],
      description: 'Align the label text.',
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
      valueType: ['string', 'void'],
      description: 'Caption text shown under the label.',
    },
  ],

  [
    'labelCaptionColor',
    {
      key: 'labelCaptionColor',
      label: 'Caption color',
      type: 'color',
      section: 'Label',
      valueType: ['string'],
      description: 'Override the caption color.',
    },
  ],

  [
    'labelFont',
    {
      key: 'labelFont',
      label: 'Font',
      type: 'select',
      control: 'typography',
      options: fontOptions,
      section: 'Label',
      valueType: ['string'],
      description: 'Typography for the label.',
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
      valueType: ['boolean', 'void'],
      description: 'Visually hide the label while keeping it for screen readers.',
    },
  ],

  [
    'labelOff',
    {
      key: 'labelOff',
      label: 'Label (off)',
      type: 'text',
      section: 'Content',
      placeholder: 'Off',
      valueType: ['string', 'void'],
      description: 'Label when disabled.',
    },
  ],

  [
    'labelOn',
    {
      key: 'labelOn',
      label: 'Label (on)',
      type: 'text',
      section: 'Content',
      placeholder: 'On',
      valueType: ['string', 'void'],
      description: 'Label when enabled.',
    },
  ],

  [
    'labelPosition',
    {
      key: 'labelPosition',
      label: 'Position',
      type: 'radioGroup',
      options: labelPositionOptions,
      section: 'Label',
      valueType: ['string'],
      description: 'Position the label relative to the input.',
    },
  ],

  [
    'labelRequiredIndicatorColor',
    {
      key: 'labelRequiredIndicatorColor',
      label: 'Required indicator',
      type: 'color',
      section: 'Label',
      valueType: ['string'],
      description: 'Override the required indicator color.',
    },
  ],

  [
    'labels',
    {
      key: 'labels',
      label: 'Label',
      type: 'text',
      section: 'Content',
      placeholder: '{{ item.title || item.id }}',
      dependsOn: { key: 'itemMode', value: 'dynamic' },
      supportsFx: true,
      valueType: ['string', 'void'],
      description: 'Template for label text.',
    },
  ],

  [
    'labels',
    {
      key: 'labels',
      label: 'Labels (JSON)',
      type: 'json',
      section: 'Content',
      placeholder: '["label1","label2"]',
      valueType: ['array', 'object'],
      description: 'Label list.',
    },
  ],

  [
    'labelTextColor',
    {
      key: 'labelTextColor',
      label: 'Label color',
      type: 'color',
      section: 'Label',
      valueType: ['string'],
      description: 'Override the label color.',
    },
  ],

  [
    'labelVariant',
    {
      key: 'labelVariant',
      label: 'Label style',
      type: 'select',
      options: labelVariantOptions,
      section: 'Content',
      valueType: ['string'],
      description: 'How the label is rendered around the control.',
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
      valueType: ['string'],
      description: 'Units for the label width.',
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
      inlineWith: 'labelWidthUnit',
      supportsFx: true,
      dependsOn: { key: 'labelPosition', value: 'left' },
      valueType: ['string', 'void'],
      description: 'Set label width when position is left.',
    },
  ],

  [
    'labelWrap',
    {
      key: 'labelWrap',
      label: 'Allow wrapping',
      type: 'boolean',
      section: 'Label',
      supportsFx: false,
      valueType: ['boolean'],
      description: 'Allow the label to wrap to multiple lines.',
    },
  ],

  [
    'latitude',
    {
      key: 'latitude',
      label: 'Latitude',
      type: 'text',
      section: 'Content',
      placeholder: '37.7577',
      valueType: ['string', 'number'],
      description: 'Latitude coordinate.',
    },
  ],

  [
    'length',
    {
      key: 'length',
      label: 'Length',
      type: 'number',
      min: 1,
      section: 'Content',
      valueType: ['number', 'void'],
      description: 'Number of OTP slots.',
    },
  ],

  [
    'limitMaxLength',
    {
      key: 'limitMaxLength',
      label: 'Limit max length',
      type: 'boolean',
      section: 'Interaction',
      advanced: true,
      supportsFx: true,
      valueType: ['boolean', 'void'],
      description: 'Limit the maximum length of the input value.',
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
      valueType: ['boolean', 'void'],
      description: 'Show a loading indicator for the input.',
    },
  ],

  [
    'logo',
    {
      key: 'logo',
      label: 'Logo',
      type: 'text',
      section: 'Add-ons',
      placeholder: 'data:image/svg+xml,...',
      supportsFx: true,
      valueType: ['string', 'void'],
      description: 'Logo image URL or data URI.',
    },
  ],

  [
    'longitude',
    {
      key: 'longitude',
      label: 'Longitude',
      type: 'text',
      section: 'Content',
      placeholder: '-122.4376',
      valueType: ['string', 'number'],
      description: 'Longitude coordinate.',
    },
  ],

  [
    'loop',
    {
      key: 'loop',
      label: 'Loop',
      type: 'boolean',
      section: 'Content',
      valueType: ['boolean'],
      description: 'Loop the media.',
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
      valueType: ['boolean', 'void'],
      description: 'Visually hide the component without affecting layout.',
    },
  ],

  [
    'margin',
    {
      key: 'margin',
      label: 'Margin',
      type: 'radioGroup',
      options: spacingMarginOptions,
      section: 'Spacing',
      valueType: ['string', 'void'],
      description: 'Margin around the widget.',
      source: 'spacing',
      segmentedFx: {
        modeKey: 'marginMode',
        fxEnabledKey: 'marginFxEnabled',
        fxKey: 'marginFx',
        defaultMode: 'normal',
        defaultFxValue: '4px 8px',
        fxPlaceholder: '4px 8px',
      },
    },
  ],

  [
    'max',
    {
      key: 'max',
      label: 'Max',
      type: 'number',
      section: 'Content',
      min: -100000,
      max: 100000,
      step: 1,
      valueType: ['number'],
      description: 'Maximum value.',
    },
  ],

  [
    'maxCount',
    {
      key: 'maxCount',
      label: 'Max count',
      type: 'number',
      section: 'Interaction',
      min: 0,
      max: 500,
      step: 1,
      valueType: ['number', 'void'],
      description: 'Maximum selected options count.',
    },
  ],

  [
    'maxItems',
    {
      key: 'maxItems',
      label: 'Max items',
      type: 'number',
      section: 'Content',
      min: 1,
      max: 50,
      step: 1,
      valueType: ['number'],
      description: 'Maximum number of items to show.',
    },
  ],

  [
    'maxLabel',
    {
      key: 'maxLabel',
      label: 'Max label',
      type: 'text',
      section: 'Add-ons',
      placeholder: 'High',
      supportsFx: true,
      valueType: ['string', 'void'],
      description: 'Optional label shown on the right above the slider.',
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
      valueType: ['number', 'void'],
      description: 'Maximum number of characters.',
    },
  ],

  [
    'maxLines',
    {
      key: 'maxLines',
      label: 'Max lines',
      type: 'number',
      min: 1,
      max: 80,
      step: 1,
      section: 'Content',
      dependsOn: { key: 'autoResize', value: true },
      valueType: ['number', 'void'],
      description: 'Maximum number of visible lines when auto resize is enabled.',
    },
  ],

  [
    'maxPaneSize',
    {
      key: 'maxPaneSize',
      label: 'Max pane size (%)',
      type: 'number',
      section: 'Appearance',
      min: 5,
      max: 95,
      step: 1,
      valueType: ['number'],
      description: 'Maximum pane size in percent.',
    },
  ],

  [
    'maxSelections',
    {
      key: 'maxSelections',
      label: 'Max selections',
      type: 'number',
      section: 'Content',
      min: 1,
      max: 500,
      step: 1,
      valueType: ['number', 'void'],
      description: 'Maximum number of selected options.',
    },
  ],

  [
    'maxVisibleTags',
    {
      key: 'maxVisibleTags',
      label: 'Max visible tags',
      type: 'number',
      section: 'Appearance',
      min: 1,
      max: 20,
      step: 1,
      valueType: ['number', 'void'],
      description: 'How many selected tags to show before overflow counter.',
    },
  ],

  [
    'menuItems',
    {
      key: 'menuItems',
      label: 'Menu items (JSON)',
      type: 'json',
      section: 'Content',
      placeholder: '["Home","Customers","Settings"]',
      dependsOn: { key: 'itemMode', value: 'static' },
      valueType: ['array', 'object'],
      description: 'Manual list of menu items.',
    },
  ],

  [
    'messages',
    {
      key: 'messages',
      label: 'Messages (JSON)',
      type: 'json',
      section: 'Content',
      placeholder: '[{"text":"Hello"}]',
      valueType: ['array', 'object'],
      description: 'Message list.',
    },
  ],

  [
    'min',
    {
      key: 'min',
      label: 'Min',
      type: 'number',
      section: 'Content',
      min: -100000,
      max: 100000,
      step: 1,
      valueType: ['number'],
      description: 'Minimum value.',
    },
  ],

  [
    'minCount',
    {
      key: 'minCount',
      label: 'Min count',
      type: 'number',
      section: 'Interaction',
      min: 0,
      max: 500,
      step: 1,
      valueType: ['number', 'void'],
      description: 'Minimum selected options count.',
    },
  ],

  [
    'minLabel',
    {
      key: 'minLabel',
      label: 'Min label',
      type: 'text',
      section: 'Add-ons',
      placeholder: 'Low',
      supportsFx: true,
      valueType: ['string', 'void'],
      description: 'Optional label shown on the left above the slider.',
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
      valueType: ['number', 'void'],
      description: 'Minimum number of characters.',
    },
  ],

  [
    'minLines',
    {
      key: 'minLines',
      label: 'Min lines',
      type: 'number',
      min: 1,
      max: 40,
      step: 1,
      section: 'Content',
      dependsOn: { key: 'autoResize', value: true },
      valueType: ['number', 'void'],
      description: 'Minimum number of visible lines when auto resize is enabled.',
    },
  ],

  [
    'minPaneSize',
    {
      key: 'minPaneSize',
      label: 'Min pane size (%)',
      type: 'number',
      section: 'Appearance',
      min: 5,
      max: 95,
      step: 1,
      valueType: ['number'],
      description: 'Minimum pane size in percent.',
    },
  ],

  [
    'minuteStep',
    {
      key: 'minuteStep',
      label: 'Minute step',
      type: 'number',
      min: 1,
      max: 60,
      step: 1,
      section: 'Content',
      valueType: ['number', 'void'],
      description: 'Minute increment in time inputs.',
    },
  ],

  [
    'mode',
    {
      key: 'mode',
      label: 'Mode',
      type: 'select',
      options: datetimeModeOptions,
      section: 'Content',
      valueType: ['string'],
      description: 'Date input mode.',
    },
  ],

  [
    'multiple',
    {
      key: 'multiple',
      label: 'Allow multiple',
      type: 'boolean',
      section: 'Content',
      valueType: ['boolean'],
      description: 'Allow selecting multiple files.',
    },
  ],

  [
    'name',
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      section: 'Content',
      placeholder: 'User name',
      valueType: ['string', 'void'],
      description: 'Display name.',
    },
  ],

  [
    'newTab',
    {
      key: 'newTab',
      label: 'Open in new tab',
      type: 'boolean',
      section: 'Interaction',
      valueType: ['boolean'],
      description: 'Open link in a new tab.',
    },
  ],

  [
    'numberOfMonths',
    {
      key: 'numberOfMonths',
      label: 'Months shown',
      type: 'number',
      min: 1,
      max: 12,
      step: 1,
      section: 'Appearance',
      valueType: ['number', 'void'],
      description: 'Number of visible calendar months.',
    },
  ],

  [
    'open',
    {
      key: 'open',
      label: 'Open',
      type: 'boolean',
      section: 'Interaction',
      valueType: ['boolean'],
      description: 'Toggle open state.',
    },
  ],

  [
    'optionChildrenKey',
    {
      key: 'optionChildrenKey',
      label: 'Children key',
      type: 'text',
      section: 'Content',
      placeholder: 'children',
      valueType: ['string', 'void'],
      description: 'Field path for nested options (cascader).',
    },
  ],

  [
    'optionDescriptionKey',
    {
      key: 'optionDescriptionKey',
      label: 'Description key',
      type: 'text',
      section: 'Content',
      placeholder: 'description',
      valueType: ['string', 'void'],
      description: 'Optional field path used for option descriptions.',
    },
  ],

  [
    'optionLabelKey',
    {
      key: 'optionLabelKey',
      label: 'Label key',
      type: 'text',
      section: 'Content',
      placeholder: 'label',
      valueType: ['string', 'void'],
      description: 'Field path used for option labels.',
    },
  ],

  [
    'options',
    {
      key: 'options',
      label: 'Options (JSON)',
      type: 'json',
      section: 'Content',
      placeholder: '[{"label":"Option 1","value":"option_1"}]',
      valueType: ['array', 'object'],
      description: 'Option list.',
    },
  ],

  [
    'optionsData',
    {
      key: 'optionsData',
      label: 'Data source',
      type: 'json',
      section: 'Content',
      placeholder: '{{ query.data }}',
      supportsFx: true,
      valueType: ['array', 'object', 'void'],
      description: 'Dynamic array used to build options.',
    },
  ],

  [
    'optionsMode',
    {
      key: 'optionsMode',
      label: 'Options mode',
      type: 'radioGroup',
      section: 'Content',
      options: [
        { label: 'Static', value: 'static' },
        { label: 'Dynamic', value: 'dynamic' },
      ],
      valueType: ['string'],
      description: 'Choose static options or map options from dynamic data.',
    },
  ],

  [
    'optionValueKey',
    {
      key: 'optionValueKey',
      label: 'Value key',
      type: 'text',
      section: 'Content',
      placeholder: 'value',
      valueType: ['string', 'void'],
      description: 'Field path used for option values.',
    },
  ],

  [
    'orientation',
    {
      key: 'orientation',
      label: 'Orientation',
      type: 'radioGroup',
      section: 'Appearance',
      options: [
        { label: 'Horizontal', value: 'horizontal' },
        { label: 'Vertical', value: 'vertical' },
      ],
      valueType: ['string'],
      description: 'Layout direction.',
    },
  ],

  [
    'overflowMode',
    {
      key: 'overflowMode',
      label: 'Overflow',
      type: 'select',
      section: 'Appearance',
      options: [
        { label: 'Scroll', value: 'scroll' },
        { label: 'Wrap', value: 'wrap' },
      ],
      dependsOn: { key: 'orientation', value: 'horizontal' },
      valueType: ['string'],
      description: 'Overflow behavior for horizontal navigation.',
    },
  ],

  [
    'padDecimal',
    {
      key: 'padDecimal',
      label: 'Pad decimals',
      type: 'boolean',
      section: 'Content',
      valueType: ['boolean'],
      description: 'Pad decimal places with trailing zeros.',
    },
  ],

  [
    'padding',
    {
      key: 'padding',
      label: 'Padding',
      type: 'select',
      section: 'Appearance',
      options: [
        { label: 'Small', value: 'sm' },
        { label: 'Medium', value: 'md' },
        { label: 'Large', value: 'lg' },
      ],
      valueType: ['string'],
      description: 'Inner padding for the container.',
    },
  ],

  [
    'parentKeyByIndex',
    {
      key: 'parentKeyByIndex',
      label: 'Parent label',
      type: 'text',
      section: 'Content',
      placeholder: '{{ item.parent }}',
      dependsOn: { key: 'itemMode', value: 'dynamic' },
      supportsFx: true,
      valueType: ['string', 'void'],
      description: 'Parent label for nested items.',
    },
  ],

  [
    'pathSeparator',
    {
      key: 'pathSeparator',
      label: 'Path separator',
      type: 'text',
      section: 'Appearance',
      placeholder: ' / ',
      valueType: ['string', 'void'],
      description: 'Separator between levels in cascader path.',
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
      valueType: ['string'],
      description: 'Choose a built-in pattern or use Regex for custom rules.',
    },
  ],

  [
    'paused',
    {
      key: 'paused',
      label: 'Paused',
      type: 'boolean',
      section: 'Interaction',
      valueType: ['boolean'],
      description: 'Pause the scanner.',
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
      valueType: ['string', 'void'],
      description: 'Placeholder text shown when the value is empty.',
    },
  ],

  [
    'placeholderColor',
    {
      key: 'placeholderColor',
      label: 'Placeholder',
      type: 'color',
      section: 'Styles',
      valueType: ['string'],
      description: 'Placeholder color for the label.',
    },
  ],

  [
    'points',
    {
      key: 'points',
      label: 'Points (JSON)',
      type: 'json',
      section: 'Content',
      placeholder: '[{"latitude":1,"longitude":2}]',
      valueType: ['array', 'object'],
      description: 'Point list.',
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
      valueType: ['string', 'void'],
      description: 'Add text to the front of the value.',
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
      supportsFx: true,
      valueType: ['string', 'void'],
      description: 'Icon shown before the value.',
    },
  ],

  [
    'preventScroll',
    {
      key: 'preventScroll',
      label: 'Prevent scroll',
      type: 'boolean',
      section: 'Interaction',
      advanced: true,
      valueType: ['boolean'],
      description: 'Prevent mouse wheel from changing the value.',
    },
  ],

  [
    'primaryKey',
    {
      key: 'primaryKey',
      label: 'Primary key',
      type: 'select',
      options: [],
      section: 'Content',
      supportsFx: true,
      valueType: ['string', 'undefined'],
      description: 'Unique row key field (options are inferred from data).',
    },
  ],

  [
    'publishableKey',
    {
      key: 'publishableKey',
      label: 'Publishable key',
      type: 'text',
      section: 'Content',
      placeholder: 'pk_test_...',
      valueType: ['string', 'void'],
      description: 'Stripe publishable key.',
    },
  ],

  [
    'rangePresets',
    {
      key: 'rangePresets',
      label: 'Range presets (JSON)',
      type: 'json',
      section: 'Content',
      placeholder:
        '[{"label":"Last 7 days","days":6},{"label":"This month","startDate":"2026-02-01","endDate":"2026-02-28"}]',
      valueType: ['array', 'void'],
      description: 'Preset list for range picker.',
    },
  ],

  [
    'ratingIcon',
    {
      key: 'ratingIcon',
      label: 'Icon',
      type: 'select',
      options: ratingIconOptions,
      section: 'Appearance',
      valueType: ['string'],
      description: 'Icon shape used for rating items.',
    },
  ],

  [
    'ratingSize',
    {
      key: 'ratingSize',
      label: 'Size',
      type: 'select',
      options: ratingSizeOptions,
      section: 'Appearance',
      valueType: ['string'],
      description: 'Visual size of rating icons.',
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
      valueType: ['boolean', 'void'],
      description:
        'Read only inputs are focusable and selectable but cannot be modified.',
    },
  ],

  [
    'recording',
    {
      key: 'recording',
      label: 'Recording',
      type: 'boolean',
      section: 'Interaction',
      valueType: ['boolean'],
      description: 'Recording state.',
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
      valueType: ['string'],
      description: 'JavaScript regular expression.',
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
      valueType: ['boolean', 'void'],
      description: 'Require a non-empty value.',
    },
  ],

  [
    'resizable',
    {
      key: 'resizable',
      label: 'Resizable',
      type: 'boolean',
      section: 'Interaction',
      valueType: ['boolean'],
      description: 'Allow resizing split panels with drag handle.',
    },
  ],

  [
    'rounded',
    {
      key: 'rounded',
      label: 'Rounded',
      type: 'boolean',
      section: 'Appearance',
      valueType: ['boolean'],
      description: 'Enable rounded corners.',
    },
  ],

  [
    'rowLimit',
    {
      key: 'rowLimit',
      label: 'Row limit',
      type: 'number',
      section: 'Content',
      min: 1,
      max: 1000,
      step: 1,
      valueType: ['number'],
      description: 'Maximum rows to render.',
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
      section: 'Appearance',
      valueType: ['number', 'void'],
      description: 'Number of visible text rows.',
    },
  ],

  [
    'schema',
    {
      key: 'schema',
      label: 'Schema',
      type: 'textarea',
      section: 'Content',
      placeholder: '{"type":"object"}',
      valueType: ['string'],
      description: 'JSON schema definition.',
    },
  ],

  [
    'searchable',
    {
      key: 'searchable',
      label: 'Searchable',
      type: 'boolean',
      section: 'Content',
      valueType: ['boolean'],
      description: 'Enable search in the options.',
    },
  ],

  [
    'searchPlaceholder',
    {
      key: 'searchPlaceholder',
      label: 'Search placeholder',
      type: 'text',
      section: 'Content',
      placeholder: 'Search options...',
      valueType: ['string', 'void'],
      description: 'Placeholder text for the search input.',
    },
  ],

  [
    'selectedIndex',
    {
      key: 'selectedIndex',
      label: 'Selected index',
      type: 'number',
      section: 'Content',
      min: -1,
      max: 999,
      step: 1,
      valueType: ['number'],
      description: 'Selected item index.',
    },
  ],

  [
    'showCalendarIcon',
    {
      key: 'showCalendarIcon',
      label: 'Show calendar icon',
      type: 'boolean',
      section: 'Appearance',
      supportsFx: true,
      valueType: ['boolean', 'void'],
      description: 'Show a trigger icon near input.',
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
      valueType: ['boolean'],
      description: 'Show the current character count.',
    },
  ],

  [
    'showClear',
    {
      key: 'showClear',
      label: 'Show clear button',
      type: 'boolean',
      section: 'Content',
      supportsFx: true,
      valueType: ['boolean', 'void'],
      description: 'Show the clear action.',
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
      valueType: ['boolean', 'void'],
      description: 'Show a clear button inside the input.',
    },
  ],

  [
    'showControls',
    {
      key: 'showControls',
      label: 'Show controls',
      type: 'boolean',
      section: 'Content',
      valueType: ['boolean'],
      description: 'Display playback controls.',
    },
  ],

  [
    'showDetails',
    {
      key: 'showDetails',
      label: 'Show details',
      type: 'boolean',
      section: 'Content',
      valueType: ['boolean'],
      description: 'Show additional details.',
    },
  ],

  [
    'showDividers',
    {
      key: 'showDividers',
      label: 'Dividers',
      type: 'boolean',
      section: 'Appearance',
      valueType: ['boolean'],
      description: 'Show dividers between items.',
    },
  ],

  [
    'showFooter',
    {
      key: 'showFooter',
      label: 'Show footer',
      type: 'boolean',
      section: 'Appearance',
      valueType: ['boolean'],
      description: 'Toggle footer visibility.',
    },
  ],

  [
    'showHandle',
    {
      key: 'showHandle',
      label: 'Show handle',
      type: 'boolean',
      section: 'Appearance',
      valueType: ['boolean'],
      description: 'Show visual drag handle for split resize.',
    },
  ],

  [
    'showHeader',
    {
      key: 'showHeader',
      label: 'Show header',
      type: 'boolean',
      section: 'Content',
      valueType: ['boolean'],
      description: 'Toggle the header row visibility.',
    },
  ],

  [
    'showInlineInput',
    {
      key: 'showInlineInput',
      label: 'Show inline input',
      type: 'boolean',
      section: 'Appearance',
      supportsFx: true,
      valueType: ['boolean', 'void'],
      description: 'Show input field together with inline calendar.',
    },
  ],

  [
    'showLabel',
    {
      key: 'showLabel',
      label: 'Show label',
      type: 'boolean',
      section: 'Content',
      valueType: ['boolean'],
      description: 'Show the label text.',
    },
  ],

  [
    'showNumbers',
    {
      key: 'showNumbers',
      label: 'Show numbers',
      type: 'boolean',
      section: 'Content',
      valueType: ['boolean'],
      description: 'Display step numbers.',
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
      valueType: ['boolean'],
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
      valueType: ['boolean'],
      description: 'Show on mobile screens.',
    },
  ],

  [
    'showOutsideDays',
    {
      key: 'showOutsideDays',
      label: 'Show outside days',
      type: 'boolean',
      section: 'Appearance',
      supportsFx: true,
      valueType: ['boolean', 'void'],
      description: 'Show days from adjacent months.',
    },
  ],

  [
    'showOverlay',
    {
      key: 'showOverlay',
      label: 'Show overlay',
      type: 'boolean',
      section: 'Appearance',
      valueType: ['boolean'],
      description: 'Toggle overlay visibility.',
    },
  ],

  [
    'showPasswordToggle',
    {
      key: 'showPasswordToggle',
      label: 'Show password toggle',
      type: 'boolean',
      section: 'Appearance',
      advanced: true,
      dependsOn: { key: 'type', value: 'password' },
      supportsFx: true,
      valueType: ['boolean', 'void'],
      description: 'Show a button to toggle password visibility.',
    },
  ],

  [
    'showPath',
    {
      key: 'showPath',
      label: 'Show full path',
      type: 'boolean',
      section: 'Appearance',
      valueType: ['boolean'],
      description: 'Show full hierarchical path in the selected value.',
    },
  ],

  [
    'showRangePresets',
    {
      key: 'showRangePresets',
      label: 'Show range presets',
      type: 'boolean',
      section: 'Appearance',
      supportsFx: true,
      valueType: ['boolean', 'void'],
      description: 'Display quick range preset buttons.',
    },
  ],

  [
    'showSelectAll',
    {
      key: 'showSelectAll',
      label: 'Show select all',
      type: 'boolean',
      section: 'Content',
      valueType: ['boolean'],
      description: 'Show a quick action to select all options.',
    },
  ],

  [
    'showSeparator',
    {
      key: 'showSeparator',
      label: 'Show separator',
      type: 'boolean',
      section: 'Appearance',
      valueType: ['boolean'],
      description: 'Toggle section separator.',
    },
  ],

  [
    'showSeparators',
    {
      key: 'showSeparators',
      label: 'Show separators',
      type: 'boolean',
      section: 'Content',
      supportsFx: true,
      valueType: ['boolean', 'void'],
      description: 'Show thousand separators.',
    },
  ],

  [
    'showStepper',
    {
      key: 'showStepper',
      label: 'Show stepper',
      type: 'boolean',
      section: 'Appearance',
      supportsFx: true,
      valueType: ['boolean', 'void'],
      description: 'Show increment/decrement controls.',
    },
  ],

  [
    'showTicks',
    {
      key: 'showTicks',
      label: 'Show ticks',
      type: 'boolean',
      section: 'Appearance',
      valueType: ['boolean'],
      description: 'Show tick marks under the slider.',
    },
  ],

  [
    'showTimeSlots',
    {
      key: 'showTimeSlots',
      label: 'Show time slots',
      type: 'boolean',
      section: 'Appearance',
      supportsFx: true,
      valueType: ['boolean', 'void'],
      description: 'Display selectable quick time slots in datetime mode.',
    },
  ],

  [
    'showTimestamp',
    {
      key: 'showTimestamp',
      label: 'Show timestamp',
      type: 'boolean',
      section: 'Content',
      valueType: ['boolean'],
      description: 'Display timestamps.',
    },
  ],

  [
    'showToolbar',
    {
      key: 'showToolbar',
      label: 'Show toolbar',
      type: 'boolean',
      section: 'Content',
      valueType: ['boolean'],
      description: 'Display the document toolbar.',
    },
  ],

  [
    'showTooltip',
    {
      key: 'showTooltip',
      label: 'Show tooltip',
      type: 'boolean',
      section: 'Appearance',
      valueType: ['boolean'],
      description: 'Show a tooltip with the current value while dragging the thumb.',
    },
  ],

  [
    'showValue',
    {
      key: 'showValue',
      label: 'Show value',
      type: 'boolean',
      section: 'Content',
      valueType: ['boolean'],
      description: 'Display the current value.',
    },
  ],

  [
    'showWeekNumber',
    {
      key: 'showWeekNumber',
      label: 'Show week numbers',
      type: 'boolean',
      section: 'Appearance',
      supportsFx: true,
      valueType: ['boolean', 'void'],
      description: 'Display week numbers in calendar.',
    },
  ],

  [
    'side',
    {
      key: 'side',
      label: 'Side',
      type: 'select',
      section: 'Appearance',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' },
        { label: 'Top', value: 'top' },
        { label: 'Bottom', value: 'bottom' },
      ],
      valueType: ['string'],
      description: 'Panel placement side.',
    },
  ],

  [
    'singleScan',
    {
      key: 'singleScan',
      label: 'Single scan',
      type: 'boolean',
      section: 'Interaction',
      valueType: ['boolean'],
      description: 'Scan once per session.',
    },
  ],

  [
    'size',
    {
      key: 'size',
      label: 'Size',
      type: 'number',
      section: 'Content',
      min: 0,
      max: 1024,
      step: 4,
      valueType: ['number'],
      description: 'Size value for the component.',
    },
  ],

  [
    'spacingFooterPadding',
    {
      key: 'spacingFooterPadding',
      label: 'Footer padding',
      type: 'radioGroup',
      options: spacingPaddingOptions,
      section: 'Spacing',
      valueType: ['string', 'void'],
      description: 'Inner padding for sidebar footer.',
      source: 'spacing',
      segmentedFx: {
        modeKey: 'footerPaddingMode',
        fxEnabledKey: 'footerPaddingFxEnabled',
        fxKey: 'footerPaddingFx',
        defaultMode: 'normal',
        defaultFxValue: '8px 12px',
        fxPlaceholder: '8px 12px',
      },
    },
  ],

  [
    'spacingHeaderPadding',
    {
      key: 'spacingHeaderPadding',
      label: 'Header padding',
      type: 'radioGroup',
      options: spacingPaddingOptions,
      section: 'Spacing',
      valueType: ['string', 'void'],
      description: 'Inner padding for sidebar header.',
      source: 'spacing',
      segmentedFx: {
        modeKey: 'headerPaddingMode',
        fxEnabledKey: 'headerPaddingFxEnabled',
        fxKey: 'headerPaddingFx',
        defaultMode: 'normal',
        defaultFxValue: '8px 12px',
        fxPlaceholder: '8px 12px',
      },
    },
  ],

  [
    'spacingPadding',
    {
      key: 'spacingPadding',
      label: 'Padding',
      type: 'radioGroup',
      options: spacingPaddingOptions,
      section: 'Spacing',
      valueType: ['string', 'void'],
      description: 'Inner padding for widget content.',
      source: 'spacing',
      segmentedFx: {
        modeKey: 'paddingMode',
        fxEnabledKey: 'paddingFxEnabled',
        fxKey: 'paddingFx',
        defaultMode: 'normal',
        defaultFxValue: '8px 12px',
        fxPlaceholder: '8px 12px',
      },
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
      valueType: ['boolean'],
      description: 'Whether the input should be checked for spelling errors.',
    },
  ],

  [
    'src',
    {
      key: 'src',
      label: 'Source URL',
      type: 'text',
      section: 'Content',
      placeholder: 'https://...',
      valueType: ['string'],
      description: 'Source URL for embedded content.',
    },
  ],

  [
    'start',
    {
      key: 'start',
      label: 'Start',
      type: 'number',
      section: 'Content',
      min: -100000,
      max: 100000,
      step: 1,
      valueType: ['number'],
      description: 'Start value.',
    },
  ],

  [
    'startDate',
    {
      key: 'startDate',
      label: 'Start date',
      type: 'text',
      section: 'Content',
      placeholder: 'YYYY-MM-DD',
      valueType: ['string', 'void'],
      description: 'Start date.',
    },
  ],

  [
    'status',
    {
      key: 'status',
      label: 'Status',
      type: 'text',
      section: 'Content',
      placeholder: 'idle',
      valueType: ['string', 'void'],
      description: 'Status label.',
    },
  ],

  [
    'step',
    {
      key: 'step',
      label: 'Step',
      type: 'number',
      section: 'Content',
      min: 1,
      max: 1000,
      step: 1,
      valueType: ['number'],
      description: 'Step increment.',
    },
  ],

  [
    'steps',
    {
      key: 'steps',
      label: 'Steps (JSON)',
      type: 'json',
      section: 'Content',
      placeholder: '["Step 1","Step 2"]',
      valueType: ['array', 'object'],
      description: 'Step labels.',
    },
  ],

  [
    'stopLabel',
    {
      key: 'stopLabel',
      label: 'Stop label',
      type: 'text',
      section: 'Content',
      placeholder: 'Stop',
      valueType: ['string', 'void'],
      description: 'Label for stop state.',
    },
  ],

  [
    'striped',
    {
      key: 'striped',
      label: 'Striped rows',
      type: 'boolean',
      section: 'Content',
      valueType: ['boolean'],
      description: 'Alternate row background colors.',
    },
  ],

  [
    'strokeWidth',
    {
      key: 'strokeWidth',
      label: 'Stroke width',
      type: 'number',
      section: 'Appearance',
      min: 1,
      max: 24,
      step: 1,
      valueType: ['number'],
      description: 'Line thickness.',
    },
  ],

  [
    'styleAccent',
    {
      key: 'styleAccent',
      label: 'Accent',
      type: 'color',
      section: 'Styles',
      valueType: ['string', 'void'],
      description: 'Widget-level override for --accent.',
    },
  ],

  [
    'styleAccentForeground',
    {
      key: 'styleAccentForeground',
      label: 'Accent foreground',
      type: 'color',
      section: 'Styles',
      valueType: ['string', 'void'],
      description: 'Widget-level override for --accent-foreground.',
    },
  ],

  [
    'styleBackground',
    {
      key: 'styleBackground',
      label: 'Background',
      type: 'color',
      section: 'Styles',
      valueType: ['string', 'void'],
      description: 'Widget-level override for --background.',
    },
  ],

  [
    'styleBorder',
    {
      key: 'styleBorder',
      label: 'Border',
      type: 'color',
      section: 'Styles',
      valueType: ['string', 'void'],
      description: 'Widget-level override for --border.',
    },
  ],

  [
    'styleCard',
    {
      key: 'styleCard',
      label: 'Card',
      type: 'color',
      section: 'Styles',
      valueType: ['string', 'void'],
      description: 'Widget-level override for --card.',
    },
  ],

  [
    'styleCardForeground',
    {
      key: 'styleCardForeground',
      label: 'Card foreground',
      type: 'color',
      section: 'Styles',
      valueType: ['string', 'void'],
      description: 'Widget-level override for --card-foreground.',
    },
  ],

  [
    'styleDestructive',
    {
      key: 'styleDestructive',
      label: 'Destructive',
      type: 'color',
      section: 'Styles',
      valueType: ['string', 'void'],
      description: 'Widget-level override for --destructive.',
    },
  ],

  [
    'styleDestructiveForeground',
    {
      key: 'styleDestructiveForeground',
      label: 'Destructive foreground',
      type: 'color',
      section: 'Styles',
      valueType: ['string', 'void'],
      description: 'Widget-level override for --destructive-foreground.',
    },
  ],

  [
    'styleFontMono',
    {
      key: 'styleFontMono',
      label: 'Font mono',
      type: 'text',
      section: 'Styles',
      placeholder: 'Source Code Pro, monospace',
      valueType: ['string', 'void'],
      description: 'Widget-level override for --font-mono.',
    },
  ],

  [
    'styleFontSans',
    {
      key: 'styleFontSans',
      label: 'Font sans',
      type: 'text',
      section: 'Styles',
      placeholder: 'Inter, system-ui, sans-serif',
      valueType: ['string', 'void'],
      description: 'Widget-level override for --font-sans.',
    },
  ],

  [
    'styleForeground',
    {
      key: 'styleForeground',
      label: 'Foreground',
      type: 'color',
      section: 'Styles',
      valueType: ['string', 'void'],
      description: 'Widget-level override for --foreground.',
    },
  ],

  [
    'styleInput',
    {
      key: 'styleInput',
      label: 'Input',
      type: 'color',
      section: 'Styles',
      valueType: ['string', 'void'],
      description: 'Widget-level override for --input.',
    },
  ],

  [
    'styleMuted',
    {
      key: 'styleMuted',
      label: 'Muted',
      type: 'color',
      section: 'Styles',
      valueType: ['string', 'void'],
      description: 'Widget-level override for --muted.',
    },
  ],

  [
    'styleMutedForeground',
    {
      key: 'styleMutedForeground',
      label: 'Muted foreground',
      type: 'color',
      section: 'Styles',
      valueType: ['string', 'void'],
      description: 'Widget-level override for --muted-foreground.',
    },
  ],

  [
    'stylePopover',
    {
      key: 'stylePopover',
      label: 'Popover',
      type: 'color',
      section: 'Styles',
      valueType: ['string', 'void'],
      description: 'Widget-level override for --popover.',
    },
  ],

  [
    'stylePopoverForeground',
    {
      key: 'stylePopoverForeground',
      label: 'Popover foreground',
      type: 'color',
      section: 'Styles',
      valueType: ['string', 'void'],
      description: 'Widget-level override for --popover-foreground.',
    },
  ],

  [
    'stylePrimary',
    {
      key: 'stylePrimary',
      label: 'Primary',
      type: 'color',
      section: 'Styles',
      valueType: ['string', 'void'],
      description: 'Widget-level override for --primary.',
    },
  ],

  [
    'stylePrimaryForeground',
    {
      key: 'stylePrimaryForeground',
      label: 'Primary foreground',
      type: 'color',
      section: 'Styles',
      valueType: ['string', 'void'],
      description: 'Widget-level override for --primary-foreground.',
    },
  ],

  [
    'styleRadius',
    {
      key: 'styleRadius',
      label: 'Radius',
      type: 'text',
      section: 'Styles',
      placeholder: '0.5rem',
      valueType: ['string', 'void'],
      description: 'Widget-level override for --radius.',
    },
  ],

  [
    'styleRing',
    {
      key: 'styleRing',
      label: 'Ring',
      type: 'color',
      section: 'Styles',
      valueType: ['string', 'void'],
      description: 'Widget-level override for --ring.',
    },
  ],

  [
    'styleSecondary',
    {
      key: 'styleSecondary',
      label: 'Secondary',
      type: 'color',
      section: 'Styles',
      valueType: ['string', 'void'],
      description: 'Widget-level override for --secondary.',
    },
  ],

  [
    'styleSecondaryForeground',
    {
      key: 'styleSecondaryForeground',
      label: 'Secondary foreground',
      type: 'color',
      section: 'Styles',
      valueType: ['string', 'void'],
      description: 'Widget-level override for --secondary-foreground.',
    },
  ],

  [
    'submitLabel',
    {
      key: 'submitLabel',
      label: 'Submit label',
      type: 'text',
      section: 'Content',
      placeholder: 'Submit',
      valueType: ['string', 'void'],
      description: 'Submit button label.',
    },
  ],

  [
    'submitText',
    {
      key: 'submitText',
      label: 'Submit text',
      type: 'text',
      section: 'Content',
      placeholder: 'Submit',
      valueType: ['string', 'void'],
      description: 'Submit button label.',
    },
  ],

  [
    'subtitle',
    {
      key: 'subtitle',
      label: 'Subtitle',
      type: 'text',
      section: 'Content',
      placeholder: 'Subtitle',
      valueType: ['string', 'void'],
      description: 'Secondary title text.',
    },
  ],

  [
    'subtitle',
    {
      key: 'subtitle',
      label: 'Subtitle',
      type: 'text',
      section: 'Content',
      placeholder: 'Email or title',
      valueType: ['string', 'void'],
      description: 'Secondary text.',
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
      valueType: ['string', 'void'],
      description: 'Add text to the back of the value.',
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
      supportsFx: true,
      valueType: ['string', 'void'],
      description: 'Icon shown after the value.',
    },
  ],

  [
    'tabs',
    {
      key: 'tabs',
      label: 'Tabs (JSON)',
      type: 'json',
      section: 'Content',
      placeholder: '[{"label":"Tab 1","content":"Tab 1 content"}]',
      valueType: ['array', 'object'],
      description: 'Tab labels and content.',
    },
  ],

  [
    'text',
    {
      key: 'text',
      label: 'Text',
      type: 'text',
      section: 'Content',
      placeholder: 'Enter text',
      valueType: ['string', 'void'],
      description: 'Text content.',
    },
  ],

  [
    'textAfter',
    {
      key: 'textAfter',
      label: 'Text after',
      type: 'text',
      placeholder: 'Suffix',
      section: 'Add-ons',
      supportsFx: true,
      valueType: ['string', 'void'],
      description: 'Text shown after the value.',
    },
  ],

  [
    'textAlign',
    {
      key: 'textAlign',
      label: 'Text align',
      type: 'radioGroup',
      options: textAlignOptions,
      section: 'Appearance',
      valueType: ['string'],
      description: 'Align the input text.',
    },
  ],

  [
    'textBefore',
    {
      key: 'textBefore',
      label: 'Text before',
      type: 'text',
      placeholder: 'Prefix',
      section: 'Add-ons',
      supportsFx: true,
      valueType: ['string', 'void'],
      description: 'Text shown before the value.',
    },
  ],

  [
    'textColor',
    {
      key: 'textColor',
      label: 'Text color',
      type: 'color',
      section: 'Styles',
      valueType: ['string', 'void'],
      description: 'Default text color.',
    },
  ],

  [
    'thumbVariant',
    {
      key: 'thumbVariant',
      label: 'Thumb style',
      type: 'select',
      section: 'Appearance',
      options: sliderThumbVariantOptions,
      valueType: ['string'],
      description: 'Thumb visual style.',
    },
  ],

  [
    'tickCount',
    {
      key: 'tickCount',
      label: 'Tick count',
      type: 'number',
      section: 'Appearance',
      min: 0,
      max: 200,
      step: 1,
      dependsOn: { key: 'showTicks', value: true },
      valueType: ['number', 'void'],
      description: 'How many ticks to render (including ends). Leave empty to auto-calculate.',
    },
  ],

  [
    'tickLabelEvery',
    {
      key: 'tickLabelEvery',
      label: 'Label every',
      type: 'number',
      section: 'Appearance',
      min: 1,
      max: 50,
      step: 1,
      dependsOn: { key: 'showTicks', value: true },
      valueType: ['number', 'void'],
      description: 'Show a tick label every N ticks (e.g. 2 shows 0,2,4,...).',
    },
  ],

  [
    'timeBetweenScans',
    {
      key: 'timeBetweenScans',
      label: 'Time between scans (ms)',
      type: 'number',
      section: 'Interaction',
      min: 100,
      step: 100,
      valueType: ['number'],
      description: 'Delay between scans.',
    },
  ],

  [
    'timeSlots',
    {
      key: 'timeSlots',
      label: 'Time slots (JSON)',
      type: 'json',
      section: 'Content',
      placeholder: '["09:00","12:00","15:00"]',
      valueType: ['array', 'void'],
      description: 'List of time options in HH:mm.',
    },
  ],

  [
    'title',
    {
      key: 'title',
      label: 'Title',
      type: 'text',
      section: 'Content',
      placeholder: 'Title',
      valueType: ['string', 'void'],
      description: 'Primary title text.',
    },
  ],

  [
    'titleKey',
    {
      key: 'titleKey',
      label: 'Title key',
      type: 'text',
      section: 'Content',
      placeholder: 'title',
      valueType: ['string', 'void'],
      description: 'Key for item title.',
    },
  ],

  [
    'tone',
    {
      key: 'tone',
      label: 'Tone',
      type: 'select',
      section: 'Appearance',
      options: [
        { label: 'Default', value: 'default' },
        { label: 'Muted', value: 'muted' },
      ],
      valueType: ['string'],
      description: 'Text color tone.',
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
      valueType: ['string', 'void'],
      description: 'Show a tooltip on the component or its label on hover.',
    },
  ],

  [
    'tooltipByIndex',
    {
      key: 'tooltipByIndex',
      label: 'Tooltip',
      type: 'text',
      section: 'Content',
      placeholder: '{{ item.tooltip }}',
      dependsOn: { key: 'itemMode', value: 'dynamic' },
      supportsFx: true,
      valueType: ['string', 'void'],
      description: 'Optional tooltip for items.',
    },
  ],

  [
    'tooltipDecimals',
    {
      key: 'tooltipDecimals',
      label: 'Tooltip decimals',
      type: 'number',
      section: 'Appearance',
      min: 0,
      max: 6,
      step: 1,
      valueType: ['number', 'void'],
      dependsOn: { key: 'showTooltip', value: true },
      description: 'How many decimal digits to show in tooltip values.',
    },
  ],

  [
    'tooltipFormat',
    {
      key: 'tooltipFormat',
      label: 'Tooltip format',
      type: 'select',
      section: 'Appearance',
      options: sliderTooltipFormatOptions,
      valueType: ['string'],
      dependsOn: { key: 'showTooltip', value: true },
      description: 'Value format displayed in the slider tooltip.',
    },
  ],

  [
    'tooltipText',
    {
      key: 'tooltipText',
      label: 'Tooltip',
      type: 'text',
      placeholder: 'Tooltip',
      section: 'Add-ons',
      supportsFx: true,
      valueType: ['string', 'void'],
      description: 'Show a tooltip on the component or its label on hover.',
    },
  ],

  [
    'toYear',
    {
      key: 'toYear',
      label: 'To year',
      type: 'number',
      min: 1900,
      max: 2200,
      step: 1,
      section: 'Appearance',
      valueType: ['number', 'void'],
      description: 'Upper year bound for calendar navigation.',
    },
  ],

  [
    'trackSize',
    {
      key: 'trackSize',
      label: 'Track size',
      type: 'select',
      section: 'Appearance',
      options: sliderTrackSizeOptions,
      valueType: ['string'],
      description: 'Track thickness.',
    },
  ],

  [
    'type',
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: inputTypeOptions,
      section: 'Content',
      valueType: ['string'],
      description: 'Input type.',
    },
  ],

  [
    'uiSchema',
    {
      key: 'uiSchema',
      label: 'UI schema',
      type: 'textarea',
      section: 'Content',
      placeholder: '{}',
      valueType: ['string'],
      description: 'UI schema overrides.',
    },
  ],

  [
    'underline',
    {
      key: 'underline',
      label: 'Underline',
      type: 'boolean',
      section: 'Appearance',
      valueType: ['boolean'],
      description: 'Underline the text.',
    },
  ],

  [
    'validationMessage',
    {
      key: 'validationMessage',
      label: 'Validation message',
      type: 'text',
      placeholder: 'Invalid value',
      section: 'Validation rules',
      supportsFx: true,
      valueType: ['string', 'void'],
      description: 'Message shown when validation fails.',
    },
  ],

  [
    'value',
    {
      key: 'value',
      label: 'Default value',
      type: 'text',
      placeholder: 'Default value',
      section: 'Content',
      supportsFx: true,
      valueType: ['string', 'void'],
      description:
        'Sets the value on initial render. If the default value is dynamic ({{ ... }}), the component will update when the value changes.',
    },
  ],

  [
    'values',
    {
      key: 'values',
      label: 'Values (JSON)',
      type: 'json',
      section: 'Content',
      placeholder: '["Tag 1","Tag 2"]',
      valueType: ['array', 'object'],
      description: 'Values list.',
    },
  ],

  [
    'valueTitle',
    {
      key: 'valueTitle',
      label: 'Value title',
      type: 'text',
      section: 'Content',
      placeholder: 'Value',
      valueType: ['string', 'void'],
      description: 'Title for value column.',
    },
  ],

  [
    'variant',
    {
      key: 'variant',
      label: 'Variant',
      type: 'select',
      section: 'Appearance',
      options: [
        { label: 'Primary', value: 'primary' },
        { label: 'Default', value: 'default' },
        { label: 'Secondary', value: 'secondary' },
        { label: 'Outline', value: 'outline' },
      ],
      valueType: ['string'],
      description: 'Visual variant.',
    },
  ],

  [
    'weekStartsOn',
    {
      key: 'weekStartsOn',
      label: 'Week starts on',
      type: 'number',
      min: 0,
      max: 6,
      step: 1,
      section: 'Appearance',
      valueType: ['number', 'void'],
      description: 'First day of week (0 = Sunday, 1 = Monday).',
    },
  ],

  [
    'width',
    {
      key: 'width',
      label: 'Width',
      type: 'number',
      section: 'Content',
      min: 0,
      max: 2000,
      step: 10,
      valueType: ['number'],
      description: 'Width of the component.',
    },
  ],

  [
    'withIcon',
    {
      key: 'withIcon',
      label: 'Show icon',
      type: 'boolean',
      section: 'Appearance',
      valueType: ['boolean'],
      description: 'Toggle the icon visibility.',
    },
  ],

  [
    'zoom',
    {
      key: 'zoom',
      label: 'Zoom',
      type: 'text',
      section: 'Content',
      placeholder: '8',
      valueType: ['string', 'number'],
      description: 'Map zoom level.',
    },
  ]
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
