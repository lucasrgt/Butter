import { memory } from './editor-memory.ts'
import { refresh } from './host.ts'
import { componentCategories, componentPage, allComponents } from './component-catalog.ts'
import { library } from './library/registry.ts'

export interface ViewState {
  layout: 'gui' | 'split'
  zoom: number | 'fit'
  source: boolean
  grid: boolean
  grid_size: number
  grid_opacity: number
  snap: boolean
  split_ratio: number
  pan_x: number
  pan_y: number
  component_search: string
  component_category: string
  component_page: number
  component_pack: string
  selection_mode: 'group' | 'component'
  align_target: 'auto' | 'selection' | 'canvas' | 'parent'
  smart_guides: boolean
  collapsed_ids: string[]
  semantics_bindings_open: boolean
  layer_search: string
}
const defaults: ViewState = { layout: 'gui', zoom: 'fit', source: false, grid: false,
  grid_size: 8, grid_opacity: .22, snap: false, split_ratio: 50, pan_x: 0, pan_y: 0,
  component_search: '', component_category: 'all', component_page: 1, component_pack:'all',
  selection_mode: 'group', align_target: 'auto', smart_guides: true, collapsed_ids: [], layer_search: '', semantics_bindings_open: false }

export function viewState(): ViewState {
  if (!Project) return structuredClone(defaults)
  const state = { ...structuredClone(defaults), ...memory(Project).view }
  if(!['all','builtin'].includes(state.component_pack)&&!library().list().some(e=>e.enabled&&`${e.pack.id}@${e.pack.version}`===state.component_pack))state.component_pack='all'
  if(state.component_category!=='all'&&!componentCategories(state.component_pack).some(c=>c.id===state.component_category))state.component_category='all'
  return structuredClone(state)
}

export function rememberBindings(open: boolean) {
  if (!Project) return;
  const next = viewState(); next.semantics_bindings_open = open; memory(Project).view = structuredClone(next)
}

export function setView(args: Record<string, unknown>) {
  if (!Project) throw new Error('Open a project first')
  const next = viewState()
  if (args.component_search !== undefined || args.component_category !== undefined || args.component_pack!==undefined) next.component_page = 1
  if(args.component_pack!==undefined)next.component_category='all'
  for (const [key, value] of Object.entries(args)) {
    if (!(key in defaults)) throw new Error(`Unknown view option: ${key}`)
    if (key === 'layout' && value !== 'gui' && value !== 'split') throw new Error('Expected gui or split')
    if (key === 'zoom' && value !== 'fit' && !(Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 8)) throw new Error('Zoom must be fit or 1–8')
    if (['source', 'grid', 'snap', 'smart_guides', 'semantics_bindings_open'].includes(key) && typeof value !== 'boolean') throw new Error(`Expected boolean ${key}`)
    if (key === 'grid_size' && !(Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 32)) throw new Error('Grid size must be 1–32 px')
    if (key === 'grid_opacity' && !(typeof value === 'number' && value >= 0 && value <= 1)) throw new Error('Grid opacity must be 0–1')
    if (key === 'split_ratio' && !(typeof value === 'number' && value >= 25 && value <= 75)) throw new Error('Split ratio must be 25–75')
    if (['pan_x', 'pan_y'].includes(key) && !(typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 100000)) throw new Error('Pan must be within ±100000 screen pixels')
    if (key === 'component_search' && !(typeof value === 'string' && value.length <= 100)) throw new Error('Component search is limited to 100 characters')
    if (key === 'component_category' && value !== 'all' && !componentCategories(String(args.component_pack??next.component_pack)).some(c => c.id === value)) throw new Error('Unknown component category')
    if(key==='component_pack'&&!['all','builtin'].includes(String(value))&&!library().list().some(e=>e.enabled&&`${e.pack.id}@${e.pack.version}`===value))throw Error('Unknown component pack')
    if (key === 'component_page' && !(Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 100000)) throw new Error('Invalid component page')
    if (key === 'selection_mode' && !['group', 'component'].includes(String(value))) throw new Error('Invalid selection mode')
    if (key === 'align_target' && !['auto', 'selection', 'canvas', 'parent'].includes(String(value))) throw new Error('Invalid alignment target')
    if (key === 'collapsed_ids' && (!Array.isArray(value) || value.length > 512 || !value.every(id => typeof id === 'string'))) throw new Error('Invalid collapsed group ids')
    if (key === 'layer_search' && !(typeof value === 'string' && value.length <= 100)) throw new Error('Layer search is limited to 100 characters')
    Object.assign(next, { [key]: value })
  }
  next.component_page = componentPage(next.component_search, next.component_category, next.component_page,allComponents(next.component_pack)).page
  memory(Project).view = structuredClone(next)
  refresh()
  return next
}
