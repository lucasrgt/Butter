import type { ViewState } from './view-state.ts'

interface CameraMemory { position: number[]; target: number[]; projection: 'orthographic' | 'perspective'; zoom: number }
export interface EditorMemory { view?: ViewState; selection?: string[]; camera?: CameraMemory }
type MemoryProject = ModelProject & { butter_editor?: EditorMemory; butter_session?: unknown }
const properties: Array<Property<'object'>> = []
let stopCamera: (() => void) | undefined
export function memory(project: ModelProject): EditorMemory { const p = project as MemoryProject; return p.butter_editor ??= {} }
export function sessionMemory(project: ModelProject) { return (project as MemoryProject).butter_session }
export function saveSessionMemory(project: ModelProject, value: unknown) { (project as MemoryProject).butter_session = value }
function nativePreview() { return typeof Preview === 'undefined' ? undefined : Preview.all.find(p => p.id === 'main') }
export function restoreEditorCamera() {
  if (!Project) return
  const saved = memory(Project).camera, preview = nativePreview()
  if (!saved || !preview || !Array.isArray(saved.position) || saved.position.length !== 3
    || !Array.isArray(saved.target) || saved.target.length !== 3
    || ![...saved.position, ...saved.target, saved.zoom].every(Number.isFinite)
    || saved.zoom <= 0 || !['orthographic', 'perspective'].includes(saved.projection)) return
  preview.loadAnglePreset({ position: saved.position as ArrayVector3, target: saved.target as ArrayVector3, projection: saved.projection, zoom: saved.zoom })
}
export function setupEditorMemory() {
  properties.push(new Property(ModelProject, 'object', 'butter_editor', { default: null, exposed: false }))
  properties.push(new Property(ModelProject, 'object', 'butter_session', { default: null, exposed: false, export: false }))
  const preview = nativePreview()
  if (preview) {
    const remember = () => {
      if (!Project) return
      memory(Project).camera = { position: preview.camera.position.toArray(), target: preview.controls.target.toArray(),
        projection: preview.isOrtho ? 'orthographic' : 'perspective', zoom: preview.camOrtho.zoom }
    }
    preview.controls.addEventListener('change', remember)
    stopCamera = () => preview.controls.removeEventListener('change', remember)
  }
}
export function teardownEditorMemory() { stopCamera?.(); stopCamera = undefined; properties.splice(0).forEach(p => p.delete()) }
