import { setupEditorMemory, teardownEditorMemory, memory, sessionMemory, saveSessionMemory, restoreEditorCamera } from './editor-memory.ts'
import { EditorStore } from './store.ts'

type ButterProject = ModelProject & { butter_gui?: unknown }
const stores = new WeakMap<ModelProject, EditorStore>()
const listeners = new Set<() => void>()
let property: Property<'object'> | undefined

export function setupProjectState() {
  setupEditorMemory()
  property = new Property(ModelProject, 'object', 'butter_gui', { default: null, exposed: false })
  Blockbench.on('select_mode', refresh)
  Blockbench.on('select_project', refresh)
  Blockbench.on('close_project', refresh)
  Codecs.project.on('parsed', parsed)
}

export function teardownProjectState() {
  Blockbench.removeListener('select_mode', refresh)
  Blockbench.removeListener('select_project', refresh)
  Blockbench.removeListener('close_project', refresh)
  Codecs.project.removeListener('parsed', parsed)
  property?.delete(); teardownEditorMemory()
  listeners.clear()
}

function parsed() {
  // Native codecs create/select the tab before merging its saved Properties.
  if (Project) stores.delete(Project)
  restoreEditorCamera()
  refresh()
}

export function current(): EditorStore {
  if (!Project) throw new Error('Open a project or create a Butter GUI first')
  let store = stores.get(Project)
  if (!store) {
    const value = (Project as ButterProject).butter_gui
    // Blockbench initializes object Properties to {} even when their default is null.
    const empty = value && typeof value === 'object' && Object.keys(value).length === 0
    store = new EditorStore(empty ? undefined : value ?? undefined)
    store.restoreSession(sessionMemory(Project))
    const selected = memory(Project).selection
    if (selected?.length) { try { store.selectMany(selected) } catch {} }
    stores.set(Project, store)
  }
  return store
}

export function persist() {
  if (!Project) return
  ;(Project as ButterProject).butter_gui = current().snapshot()
  Project.saved = false
  refresh()
}

export function refresh() {
  const store = Project && stores.get(Project)
  if (Project && store && !store.gesturing) {
    memory(Project).selection = [...store.selection]
    const saved = sessionMemory(Project) as { revision?: number; selection?: string[] } | undefined
    if (saved?.revision !== store.revision || JSON.stringify(saved.selection) !== JSON.stringify(store.selection)) saveSessionMemory(Project, store.session())
  }
  listeners.forEach(listener => listener())
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
