import { current, persist, refresh } from './host.ts'
import { viewState, setView } from './view-state.ts'
import { requestedIds, expectedRevision } from './editor-args.ts'
import { selectionRoots, editableRoots, selectable, walk, inheritedFlag } from './selection.ts'
import { align, distribute, type AlignMode, type AlignTarget } from './transforms.ts'
import { groupLayers, ungroupLayers, removeLayers, orderLayers, flagLayers, resetLayout } from './layer-operations.ts'
import { copyBundle, pasteBundle } from './clipboard-model.ts'
import { clipboardCall } from './clipboard.ts'
import { GROUP_KINDS } from '../../gui-builder/src/model/types.ts'
import { parentOf, findById } from '../../gui-builder/src/model/tree.ts'
import { frameSelection } from './frame-selection.ts'
import { capabilities, showHelp } from './capabilities.ts'

export const editorCommands = ['select', 'edit', 'align', 'distribute', 'clipboard', 'tree', 'frame', 'help', 'capabilities']
const LABELS: Record<string, string> = { delete: 'Delete', duplicate: 'Duplicate', group: 'Group', ungroup: 'Ungroup',
  bring_front: 'Bring to front', send_back: 'Send to back', bring_forward: 'Bring forward', send_backward: 'Send backward',
  hide: 'Hide', show: 'Show', lock: 'Lock', unlock: 'Unlock', show_all: 'Show all', unlock_all: 'Unlock all', reset_layout: 'Reset layout' }
export function editorCall(command: string, args: Record<string, unknown>) {
  if (command === 'help' || (command === 'capabilities' && args.show_help === true)) return showHelp()
  if (command === 'capabilities') return capabilities()
  const store = current(), doc = store.snapshot()
  if (command === 'frame') {
    if (args.target !== undefined && args.target !== 'all' && args.target !== 'selection') throw new Error('Invalid frame target')
    return frameSelection(args.target as 'all' | 'selection' | undefined)
  }
  if (command === 'clipboard') return clipboardCall(args)
  if (command === 'select') {
    const mode = String(args.mode ?? 'replace'), ids = requestedIds(args)
    if (mode === 'none') store.selectMany([])
    else if (mode === 'all' || mode === 'invert') {
      const candidates = selectable(doc, viewState().selection_mode)
      store.selectMany(mode === 'all' ? candidates : candidates.filter(id => !store.selection.includes(id)))
    } else if (mode === 'parent') store.selectMany([...new Set(ids.map(id => parentOf(doc.root, id)?.id).filter(id => !!id))] as string[])
    else store.selectMany(ids, mode as 'replace')
    refresh(); return store.inspect()
  }
  if (command === 'tree') {
    const groups = walk(doc.root).filter(node => GROUP_KINDS.has(node.kind)).map(node => node.id)
    const action = String(args.action ?? 'inspect'), collapsed = new Set(viewState().collapsed_ids)
    if (action !== 'inspect') {
      if (!['collapse', 'expand', 'toggle', 'collapse_all', 'expand_all'].includes(action)) throw new Error('Unknown tree action')
      const ids = action.endsWith('_all') ? groups : requestedIds(args)
      ids.forEach(id => { if (!groups.includes(id)) throw new Error('Only groups can be folded') })
      ids.forEach(id => { if (action.startsWith('expand') || (action === 'toggle' && collapsed.has(id))) collapsed.delete(id); else collapsed.add(id) })
      setView({ collapsed_ids: [...collapsed] })
    }
    return { collapsed_ids: [...collapsed], layers: walk(doc.root).map(node => ({ id: node.id, name: node.name, kind: node.kind,
      parent_id: parentOf(doc.root, node.id)?.id ?? null, expanded: groups.includes(node.id) ? !collapsed.has(node.id) : null,
      selected: store.selection.includes(node.id), hidden: inheritedFlag(doc, node.id, 'hidden'), locked: inheritedFlag(doc, node.id, 'locked') })) }
  }
  store.assertIdle(); store.checkRevision(expectedRevision(args))
  const ids = requestedIds(args)
  let selection = [...store.selection], label = command
  if (command === 'align') { align(doc, ids, args.mode as AlignMode, (args.relative_to ?? viewState().align_target) as AlignTarget); label = 'Align' }
  else if (command === 'distribute') { distribute(doc, ids, args.axis as 'horizontal' | 'vertical'); label = 'Distribute' }
  else if (command === 'edit') {
    const action = String(args.action); label = LABELS[action]
    if (!label) throw new Error('Unknown edit action')
    if (action === 'delete') selection = removeLayers(doc, ids)
    else if (action === 'duplicate') {
      editableRoots(doc, ids)
      selection = pasteBundle(doc, copyBundle(doc, ids), doc.root.id, 8, 8, true)
    } else if (action === 'group') selection = groupLayers(doc, ids, (args.kind ?? 'row') as 'row' | 'column', args.name as string | undefined)
    else if (action === 'ungroup') selection = ungroupLayers(doc, ids)
    else if (action.startsWith('bring_') || action.startsWith('send_')) selection = orderLayers(doc, ids, action)
    else if (['hide', 'show', 'lock', 'unlock'].includes(action)) {
      selection = flagLayers(doc, ids, ['hide', 'show'].includes(action) ? 'hidden' : 'locked', action === 'hide' || action === 'lock')
    } else if (action === 'show_all') doc.hidden = []
    else if (action === 'unlock_all') doc.locked = []
    else if (action === 'reset_layout') selection = resetLayout(doc, ids)
  }
  store.commit(doc, undefined, selection, label); persist(); return store.inspect()
}
