import { useRef } from 'react'

interface JsonInputProps {
  value: string
  onChange: (value: string) => void
  onApply: (value?: string) => void
  onLoadExample: () => void
  error: string | null
  warning: string | null
}

export function JsonInput({ value, onChange, onApply, onLoadExample, error, warning }: JsonInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    const text = await file.text()
    onChange(text)
    onApply(text)
  }

  return (
    <section className="panel-section json-section" aria-labelledby="json-input-heading">
      <div className="section-heading-row">
        <h2 id="json-input-heading">Bounding box JSON</h2>
        <div className="heading-actions">
          <input
            ref={inputRef}
            className="visually-hidden"
            type="file"
            accept=".json,application/json"
            aria-label="Upload bounding box JSON"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void handleFile(file)
              event.currentTarget.value = ''
            }}
          />
          <button className="mini-button" type="button" onClick={() => inputRef.current?.click()}>Upload</button>
          <button className="mini-button" type="button" onClick={onLoadExample}>Example</button>
        </div>
      </div>
      <textarea
        className="json-editor"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        placeholder={'{\n  "count": 1,\n  "objects": [...]\n}'}
        aria-label="Bounding box JSON"
        aria-invalid={Boolean(error)}
      />
      {error && <p className="inline-message error-message" role="alert">{error}</p>}
      {warning && <p className="inline-message warning-message" role="status">{warning}</p>}
      <button className="primary-button" type="button" onClick={() => onApply()} disabled={!value.trim()}>
        Apply JSON
      </button>
    </section>
  )
}

