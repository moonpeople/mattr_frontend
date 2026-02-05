import { Checkbox_Shadcn_ } from 'ui'

import type { WidgetDefinition } from '../types'
import { normalizeArray, parseMaybeJson } from '../helpers'

type TreeOption = {
  id?: string
  label: string
  value?: string
  parent?: string
  children?: TreeOption[]
}

type CheckboxTreeProps = {
  label: string
  value: string
  options: string
  helperText: string
  disabled: boolean
  events: string
}

const normalizeValues = (value: unknown): string[] => {
  const parsed = parseMaybeJson(value)
  const normalized = normalizeArray<string>(parsed, [])
  if (normalized.length > 0) {
    return normalized.map((item) => String(item))
  }
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

const normalizeOptions = (raw: unknown): TreeOption[] => {
  const parsed = normalizeArray<TreeOption | string>(parseMaybeJson(raw), [])
  if (parsed.length === 0) {
    return []
  }
  if (typeof parsed[0] === 'string') {
    return (parsed as string[]).map((item) => ({ label: item, value: item }))
  }
  return parsed as TreeOption[]
}

const buildTree = (options: TreeOption[]) => {
  const nodes = new Map<string, TreeOption>()
  const roots: TreeOption[] = []

  options.forEach((option, index) => {
    const id = option.id || option.value || option.label || `node_${index}`
    const node = { ...option, id, value: option.value ?? id, children: option.children ?? [] }
    nodes.set(id, node)
  })

  nodes.forEach((node) => {
    if (node.parent) {
      const parent = nodes.get(node.parent)
      if (parent) {
        parent.children = parent.children ?? []
        parent.children.push(node)
        return
      }
    }
    roots.push(node)
  })

  return roots
}

const renderNodes = (
  nodes: TreeOption[],
  selected: string[],
  disabled: boolean,
  onToggle: (value: string, checked: boolean) => void,
  level = 0
) => {
  return (
    <div className={`space-y-2 ${level ? 'pl-4' : ''}`}>
      {nodes.map((node) => {
        const value = node.value ?? node.label
        const checked = selected.includes(value)
        return (
          <div key={node.id ?? value} className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox_Shadcn_
                checked={checked}
                disabled={disabled}
                onCheckedChange={(next) => onToggle(value, next === true)}
              />
              <span>{node.label}</span>
            </label>
            {node.children && node.children.length > 0
              ? renderNodes(node.children, selected, disabled, onToggle, level + 1)
              : null}
          </div>
        )
      })}
    </div>
  )
}

export const CheckboxTreeWidget: WidgetDefinition<CheckboxTreeProps> = {
  type: 'CheckboxTree',
  label: 'Checkbox Tree',
  category: 'inputs',
  description: 'Hierarchical checkbox selection',
  defaultProps: {
    label: 'Label',
    value: '[]',
    options: JSON.stringify(
      [
        {
          label: 'Shoes',
          value: 'shoes',
          children: [
            { label: 'Athletic', value: 'athletic' },
            { label: 'Dress', value: 'dress' },
          ],
        },
        {
          label: 'Accessories',
          value: 'accessories',
          children: [{ label: 'Bags', value: 'bags' }],
        },
      ],
      null,
      2
    ),
    helperText: '',
    disabled: false,
    events: '[]',
  },
  fields: [
    { key: 'label', label: 'Label', type: 'text', placeholder: 'Label' },
    {
      key: 'value',
      label: 'Value (JSON)',
      type: 'json',
      placeholder: '[\"athletic\",\"bags\"]',
    },
    {
      key: 'options',
      label: 'Options (JSON)',
      type: 'json',
      placeholder: '[{\"label\":\"Shoes\",\"children\":[{\"label\":\"Athletic\",\"value\":\"athletic\"}]}]',
    },
    { key: 'helperText', label: 'Helper text', type: 'text', placeholder: 'Help text' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
    {
      key: 'events',
      label: 'Events (JSON)',
      type: 'json',
      placeholder: '[{\"event\":\"change\",\"type\":\"query\",\"queryName\":\"onChange\"}]',
    },
  ],
  render: (props, context) => {
    const options = normalizeOptions(props.options)
    const tree =
      options.length > 0
        ? options.some((option) => option.parent)
          ? buildTree(options)
          : options
        : [
            {
              label: 'Shoes',
              value: 'shoes',
              children: [{ label: 'Athletic', value: 'athletic' }],
            },
          ]
    const selected = normalizeValues(context?.state?.value ?? props.value)

    const toggleValue = (value: string, checked: boolean) => {
      const next = checked ? Array.from(new Set([...selected, value])) : selected.filter((item) => item !== value)
      context?.setState?.({ value: next })
      context?.runActions?.('change', { value: next })
    }

    return (
      <div className="space-y-2">
        {props.label && (
          <label className="text-xs font-medium text-foreground">{props.label}</label>
        )}
        {renderNodes(tree, selected, props.disabled, toggleValue)}
        {props.helperText && <div className="text-xs text-foreground-muted">{props.helperText}</div>}
      </div>
    )
  },
}
