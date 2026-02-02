
type NodeSettingsValidationProps = {
  errors: string[]
}

const NodeSettingsValidation = ({ errors }: NodeSettingsValidationProps) => {
  if (errors.length === 0) return null

  return (
    <div className="rounded border border-warning-400 bg-warning-50 p-2 text-xs text-warning-800">
      <p className="font-medium">Validation</p>
      <ul className="list-disc pl-4">
        {errors.map((entry) => (
          <li key={entry}>{entry}</li>
        ))}
      </ul>
    </div>
  )
}

export default NodeSettingsValidation
