import type { RenderEditCellProps } from 'react-data-grid'

function autoFocusAndSelect(input: HTMLInputElement | null) {
  ;(input as any)?.focus?.()
  ;(input as any)?.select?.()
}

export function NumberEditor<TRow, TSummaryRow = unknown>({
  row,
  column,
  onRowChange,
  onClose,
}: RenderEditCellProps<TRow, TSummaryRow>) {
  const value = row[column.key as keyof TRow] as unknown as string

  function onChange(event: any) {
    const _value = (event?.target as any)?.value
    if (_value === '') onRowChange({ ...row, [column.key]: null })
    else onRowChange({ ...row, [column.key]: _value })
  }

  function onBlur() {
    onClose(true)
  }

  return (
    <input
      className="sb-grid-number-editor"
      ref={autoFocusAndSelect}
      value={value ?? ''}
      onChange={onChange}
      onBlur={onBlur}
      type="number"
    />
  )
}
