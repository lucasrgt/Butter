import { propertiesCall } from './properties-api.ts'
import { libraryCall, customComponentCall } from './library/api.ts'
import { PRESETS } from '../../gui-builder/src/model/presets.ts'
import { PALETTE, type Kind } from '../../gui-builder/src/model/types.ts'
import { exportPixels } from './export-pixels.ts'
import { semanticSpec, semanticTree } from './semantics-export.ts'
import { semanticsCall } from './semantics-api.ts'
import { showSemanticTree } from './semantics-dialog.ts'
import { positionedBoxes, freezePositions } from './position.ts'
import { extraCall, extraCommands } from './ui-api.ts'
import { current, persist, refresh } from './host.ts'
import { layoutWarnings, readDocument } from './document.ts'
import { add, requireNode } from './operations.ts'
import { previewPng, referencePng } from './preview.ts'
import { assetStatus } from './minecraft/assets.ts'
import { componentCategories, componentPage, allComponents } from './component-catalog.ts'
import { exportWarnings } from './library/bundle.ts'
import { prepareImages } from './library/images.ts'
import { showLibrary } from './library/manager.ts'
import { viewState } from './view-state.ts'
import { editorCall, editorCommands } from './editor-api.ts'
import { requestedIds } from './editor-args.ts'
import { translate, positionSelection } from './transforms.ts'
import { reparent } from './layer-operations.ts'
import { machineCall } from './machine-bridge.ts'
import { machineDescription } from './machine-description.ts'
import { inheritedFlag } from './selection.ts'

type Args = Record<string, unknown>
function string(args: Args, key: string, fallback?: string): string {
  const value = args[key] ?? fallback
  if (typeof value !== 'string') throw new Error(`Expected ${key} to be a string`)
  return value
}
function integer(args: Args, key: string): number | undefined {
  const value = args[key]
  if (value === undefined) return undefined
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) throw new Error(`Invalid ${key}`)
  return value
}

export function call(command: string, args: Args = {}): unknown {
  if(command==='machine')return machineCall(args)
  if(command==='library')return args.action==='show'?showLibrary():libraryCall(args)
  if(command==='component')return customComponentCall(args)
  if (command === 'properties') return propertiesCall(args)
  if (command === 'semantic_tree') return showSemanticTree()
  if (command === 'semantics') return semanticsCall(args)
  if (editorCommands.includes(command)) return editorCall(command, args)
  if (command === 'remove' || command === 'duplicate') return editorCall('edit', { ...args, action: command === 'remove' ? 'delete' : 'duplicate' })
  if (extraCommands.includes(command)) return extraCall(command, args)
  if (command === 'components') {
    const view = viewState(), category = string(args, 'category', view.component_category)
    const CATEGORIES=componentCategories(string(args,'pack',view.component_pack))
    if (category !== 'all' && !CATEGORIES.some(item => item.id === category)) throw new Error('Unknown component category')
    const page = integer(args, 'page') ?? view.component_page
    if (page < 1) throw new Error('Page starts at 1')
    return { components: PALETTE, canvas: { width: 176, height: 166 },
      catalog: componentPage(string(args, 'search', view.component_search), category, page,allComponents(string(args,'pack',view.component_pack))), categories: CATEGORIES,
      preview: 'Original bitmap font and GUI textures when a local Beta 1.7.3 JAR is loaded; custom gauges are authoring representations.' }
  }
  if (command === 'begin') {
    const preset = PRESETS.find(item => item.id === string(args, 'preset', 'empty'))
    if (!preset) throw new Error('Unknown preset')
    const root = preset.build()
    root.name = string(args, 'name', root.name)
    const doc = readDocument({ version: 1, root, hidden: [] })
    if (args.new_project !== undefined && typeof args.new_project !== 'boolean') throw new Error('Expected boolean new_project')
    if (!Project || args.new_project === true) {
      if (!newProject(Formats.free) || !Project) throw new Error('Could not create a Blockbench project')
      Project.name = root.name
    }
    current().commit(doc, undefined, [doc.root.id], 'New GUI')
    persist()
    Modes.options.butter_gui.select()
    return current().inspect()
  }
  const store = current()
  if (command === 'inspect') return { ...store.inspect(), boxes: positionedBoxes(store.snapshot()) }
  if (command === 'preview') {
    const doc=store.snapshot()
    const render=()=>({ png: args.reference === 'furnace' ? referencePng() : previewPng(doc, integer(args, 'scale') ?? 3),
      warnings: layoutWarnings(doc), renderer: assetStatus().loaded ? 'Minecraft bitmap assets; custom gauges are authoring representations' : 'Fallback authoring preview', assets: assetStatus() }
    )
    return Object.keys(doc.component_refs??{}).length?prepareImages(doc).then(render):render()
  }
  if (command === 'validate') {
    const doc = readDocument(store.snapshot())
    return { valid: true, warnings: layoutWarnings(doc), compilerValidated: false,
      note: 'Tree validation only. Compile exports with Butter CLI; verify pixels and input in Minecraft.' }
  }
  if (command === 'export') {
    const doc = store.snapshot()
    const format = string(args, 'format', 'butter')
    if (format === 'butter') return { format, text: exportPixels(doc),warnings:exportWarnings(doc) }
    if (format === 'document') return { format, text: JSON.stringify(doc, null, 2) }
    if (format === 'spec') return { format, text: JSON.stringify(semanticSpec(doc), null, 2) }
    if (format === 'semantics') return { format, text: JSON.stringify(semanticTree(doc), null, 2) }
    if (format === 'machine') return { format, text: JSON.stringify(machineDescription(doc), null, 2) }
    throw new Error('Export format must be butter, document, spec, semantics or machine')
  }
  const revision = integer(args, 'expected_revision')
  store.assertIdle(); store.checkRevision(revision)
  if (command === 'history') {
    const direction = string(args, 'direction')
    if (direction !== 'undo' && direction !== 'redo') throw new Error('Expected undo or redo')
    store.history(direction, revision)
  } else {
    let doc = store.snapshot()
    let selection: string[] | undefined
    if (command === 'import') {
      const text = string(args, 'text')
      if (text.length > 10*1024*1024) throw new Error('Document exceeds 10 MB')
      doc = readDocument(JSON.parse(text))
      selection = [doc.root.id]
    } else if (command === 'nudge' || command === 'position') {
      const x = args[command === 'nudge' ? 'dx' : 'x']
      const y = args[command === 'nudge' ? 'dy' : 'y']
      if (typeof x !== 'number' || typeof y !== 'number') throw new Error('Expected integer coordinates')
      if (command === 'nudge') translate(doc, requestedIds(args), x, y)
      else positionSelection(doc, requestedIds(args), x, y)
    } else if (command === 'add') {
      const kind = string(args, 'kind') as Kind
      if (!PALETTE.includes(kind)) throw new Error('Unsupported component')
      const parent = string(args, 'parent_id', doc.root.id)
      if (inheritedFlag(doc, parent, 'locked')) throw new Error('Unlock the target group first')
      freezePositions(doc)
      selection = [add(doc, kind, parent, args.name === undefined ? undefined : string(args, 'name'))]
      if (args.x !== undefined || args.y !== undefined) {
        if (typeof args.x !== 'number' || typeof args.y !== 'number') throw new Error('Expected both x and y coordinates')
        if (kind !== 'row' && kind !== 'column') positionSelection(doc, selection, args.x, args.y)
      }
    } else if (command === 'update') {
      const id = string(args, 'id')
      const node = requireNode(doc, id)
      if (args.name !== undefined) {
        if (inheritedFlag(doc, id, 'locked')) throw new Error('Unlock this layer first')
        node.name = string(args, 'name')
      }
      if (args.hidden !== undefined) {
        if (typeof args.hidden !== 'boolean') throw new Error('Expected hidden to be a boolean')
        doc.hidden = doc.hidden.filter(item => item !== id)
        if (args.hidden) doc.hidden.push(id)
      }
      if (args.locked !== undefined) {
        if (typeof args.locked !== 'boolean') throw new Error('Expected locked to be a boolean')
        doc.locked = (doc.locked ?? []).filter(item => item !== id)
        if (args.locked) doc.locked.push(id)
      }
    } else if (command === 'move') {
      selection = reparent(doc, requestedIds(args), string(args, 'parent_id'), integer(args, 'index'))
    } else {
      throw new Error(`Unknown Butter command: ${command}`)
    }
    store.commit(doc, revision, selection, command[0].toUpperCase() + command.slice(1))
  }
  persist()
  return store.inspect()
}

export const api = { version: 1, call }
