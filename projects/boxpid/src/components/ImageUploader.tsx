import { useRef, useState } from 'react'
import type { DragEvent } from 'react'
import type { ImageAsset } from '../types/detection'

interface ImageUploaderProps {
  image: ImageAsset | null
  onFile: (file: File) => void
  error: string | null
}

const IMAGE_ACCEPT = '.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp'

export function ImageUploader({ image, onFile, error }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <section className="panel-section" aria-labelledby="image-input-heading">
      <div className="section-heading-row">
        <h2 id="image-input-heading">Image</h2>
        {image && <span className="status-dot">Ready</span>}
      </div>
      <div
        className={`drop-zone ${isDragging ? 'is-dragging' : ''}`}
        onDragEnter={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) setIsDragging(false)
        }}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          className="visually-hidden"
          type="file"
          accept={IMAGE_ACCEPT}
          aria-label="Choose a P&ID or PFD image"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onFile(file)
            event.currentTarget.value = ''
          }}
        />
        <span className="upload-glyph" aria-hidden="true">↥</span>
        <p>{image ? 'Replace drawing' : 'Drop drawing here'}</p>
        <button className="text-button" type="button" onClick={() => inputRef.current?.click()}>
          Choose image
        </button>
        <small>PNG, JPG or WEBP</small>
      </div>
      {image && (
        <div className="file-meta" aria-label="Loaded image details">
          <span title={image.fileName}>{image.fileName}</span>
          <strong>{image.width.toLocaleString()} × {image.height.toLocaleString()}</strong>
        </div>
      )}
      {error && <p className="inline-message error-message" role="alert">{error}</p>}
    </section>
  )
}

