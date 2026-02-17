/**
 * Конфиг секций inspector: связывает секции с полями, правилами видимости и порядком рендера.
 */
export const COLLAPSIBLE_SECTIONS = new Set([
  'Content',
  'Interaction',
  'Appearance',
  'Spacing',
])

export type ListSectionConfig = {
  parent: string
  storageKey: string
  buttonPosition?: 'left' | 'right'
}

const LIST_SECTION_CONFIG: Record<string, ListSectionConfig> = {
  'Add-ons': { parent: 'Content', storageKey: 'addons' },
  'Validation rules': { parent: 'Interaction', storageKey: 'validationRules' },
  Styles: { parent: 'Appearance', storageKey: 'styles' },
}

const LIST_SECTION_WIDGETS = new Set([
  'EditableText',
  'EditableTextArea',
  'EditableNumber',
  'Navigation',
  'TextArea',
  'TextInput',
  'NumberInput',
  'Currency',
  'Percent',
  'PhoneNumberInput',
  'Email',
  'Url',
  'PasswordInput',
])

export const resolveListSectionConfig = (
  section: string | undefined,
  widgetType: string
) => {
  if (!section) {
    return null
  }
  if (section === 'Styles') {
    return LIST_SECTION_CONFIG[section] ?? null
  }
  if (!LIST_SECTION_WIDGETS.has(widgetType)) {
    return null
  }
  return LIST_SECTION_CONFIG[section] ?? null
}
