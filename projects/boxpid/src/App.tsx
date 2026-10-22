import { useEffect, useMemo, useRef, useState } from 'react'
import { Filters } from './components/Filters'
import { ImageUploader } from './components/ImageUploader'
import { ImageViewer } from './components/ImageViewer'
import { JsonInput } from './components/JsonInput'
import { ObjectList } from './components/ObjectList'
import type { DetectionResult, IdentifiedDetectionObject, ImageAsset } from './types/detection'
import { filterObjects } from './utils/filters'
import { parseDetectionJson } from './utils/json'

const EXAMPLE_JSON = `{
  "mode": "Level 2",
  "count": 3,
  "objects": [
    {
      "equipment_type": "Pump",
      "tag": "P-101A",
      "bbox": [110, 340, 170, 410],
      "confidence": 0.97
    },
    {
      "equipment_type": "Pump",
      "tag": "P-101B",
      "bbox": [190, 340, 250, 410],
      "confidence": 0.95
    },
    {
      "equipment_type": "Heat Exchanger",
      "tag": "E-101",
      "bbox": [380, 280, 470, 390],
      "confidence": 0.92
    }
  ]
}`

interface ActiveDetection extends Omit<DetectionResult, 'objects'> {
  objects: IdentifiedDetectionObject[]
}

function withObjectIds(result: DetectionResult): ActiveDetection {
  return {
    ...result,
    objects: result.objects.map((object, index) => ({ ...object, id: `object-${index}` })),
  }
}

function App() {
  const imageUrlRef = useRef<string | null>(null)
  const [image, setImage] = useState<ImageAsset | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [jsonText, setJsonText] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [jsonWarning, setJsonWarning] = useState<string | null>(null)
  const [detection, setDetection] = useState<ActiveDetection | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [enabledTypes, setEnabledTypes] = useState<Set<string>>(new Set())
  const [minConfidence, setMinConfidence] = useState(0)
  const [showBoxes, setShowBoxes] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const [showConfidence, setShowConfidence] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [focusRequestKey, setFocusRequestKey] = useState(0)

  useEffect(() => () => {
    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current)
  }, [])

  const equipmentCounts = useMemo(() => {
    const counts = new Map<string, number>()
    detection?.objects.forEach((object) => counts.set(object.equipment_type, (counts.get(object.equipment_type) ?? 0) + 1))
    return counts
  }, [detection])

  const filteredObjects = useMemo(
    () => filterObjects(detection?.objects ?? [], { enabledEquipmentTypes: enabledTypes, minConfidence }),
    [detection, enabledTypes, minConfidence],
  )

  const hasConfidence = detection?.objects.some((object) => object.confidence !== undefined) ?? false

  function loadImage(file: File) {
    const supportedTypes = new Set(['image/png', 'image/jpeg', 'image/webp'])
    if (!supportedTypes.has(file.type)) {
      setImageError('Choose a PNG, JPG, JPEG or WEBP image.')
      return
    }

    const url = URL.createObjectURL(file)
    const probe = new Image()
    probe.onload = () => {
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current)
      imageUrlRef.current = url
      setImage({ fileName: file.name, url, width: probe.naturalWidth, height: probe.naturalHeight })
      setImageError(null)
      setResetKey((key) => key + 1)
    }
    probe.onerror = () => {
      URL.revokeObjectURL(url)
      setImageError('The selected image could not be decoded.')
    }
    probe.src = url
  }

  function applyJson(override?: string) {
    const source = override ?? jsonText
    try {
      const parsed = parseDetectionJson(source)
      const nextDetection = withObjectIds(parsed.result)
      const types = new Set(nextDetection.objects.map((object) => object.equipment_type))
      setDetection(nextDetection)
      setJsonText(parsed.formatted)
      setJsonError(null)
      setJsonWarning(parsed.warning)
      setEnabledTypes(types)
      setMinConfidence(0)
      setSelectedId(null)
      setHoveredId(null)
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Unable to parse JSON.')
      setJsonWarning(null)
    }
  }

  function loadExample() {
    setJsonText(EXAMPLE_JSON)
    applyJson(EXAMPLE_JSON)
  }

  function selectFromList(id: string) {
    setSelectedId(id)
    setFocusRequestKey((key) => key + 1)
  }

  function reset() {
    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current)
    imageUrlRef.current = null
    setImage(null)
    setImageError(null)
    setJsonText('')
    setJsonError(null)
    setJsonWarning(null)
    setDetection(null)
    setSelectedId(null)
    setHoveredId(null)
    setEnabledTypes(new Set())
    setMinConfidence(0)
    setShowBoxes(true)
    setShowLabels(true)
    setShowConfidence(false)
    setResetKey((key) => key + 1)
  }

  function toggleType(type: string) {
    setEnabledTypes((current) => {
      const next = new Set(current)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-block">
          <span className="brand-mark" aria-hidden="true"><i /><i /></span>
          <div>
            <h1>P&amp;ID Bounding Box Viewer</h1>
            <p>Visual Grounding Inspector</p>
          </div>
        </div>
        <div className="header-actions">
          <span className="privacy-note"><span aria-hidden="true">●</span> Local session · Nothing is uploaded</span>
          <button className="reset-button" type="button" onClick={reset}>Reset</button>
        </div>
      </header>

      <main className="workspace">
        <aside className="input-panel" aria-label="Inputs and filters">
          <div className="panel-title"><span className="eyebrow">Source</span><strong>Input</strong></div>
          <ImageUploader image={image} onFile={loadImage} error={imageError} />
          <JsonInput
            value={jsonText}
            onChange={setJsonText}
            onApply={applyJson}
            onLoadExample={loadExample}
            error={jsonError}
            warning={jsonWarning}
          />
          <Filters
            equipmentCounts={equipmentCounts}
            enabledTypes={enabledTypes}
            onToggleType={toggleType}
            onSelectAll={() => setEnabledTypes(new Set(equipmentCounts.keys()))}
            onClearAll={() => setEnabledTypes(new Set())}
            hasConfidence={hasConfidence}
            minConfidence={minConfidence}
            onMinConfidenceChange={setMinConfidence}
            showBoxes={showBoxes}
            showLabels={showLabels}
            showConfidence={showConfidence}
            onShowBoxesChange={setShowBoxes}
            onShowLabelsChange={setShowLabels}
            onShowConfidenceChange={setShowConfidence}
          />
          <p className="privacy-footer">Images and JSON stay in your browser.<br /><strong>Nothing is uploaded.</strong></p>
        </aside>

        <ImageViewer
          image={image}
          objects={filteredObjects}
          hasDetectionResult={Boolean(detection)}
          selectedId={selectedId}
          hoveredId={hoveredId}
          showBoxes={showBoxes}
          showLabels={showLabels}
          showConfidence={showConfidence}
          resetKey={resetKey}
          focusRequestKey={focusRequestKey}
          onSelect={setSelectedId}
          onHover={setHoveredId}
        />

        <ObjectList
          objects={filteredObjects}
          totalCount={detection?.objects.length ?? 0}
          hasDetectionResult={Boolean(detection)}
          selectedId={selectedId}
          hoveredId={hoveredId}
          onSelect={selectFromList}
          onHover={setHoveredId}
        />
      </main>
    </div>
  )
}

export default App

