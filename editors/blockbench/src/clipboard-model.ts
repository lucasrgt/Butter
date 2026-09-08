import type { Widget } from '../../gui-builder/src/model/types.ts'
import { hasKind, parentOf } from '../../gui-builder/src/model/tree.ts'
import type { ButterDocument } from './document.ts'
import { freezePositions, positionedBoxes } from './position.ts'
import { insert, requireNode } from './operations.ts'
import { inheritedFlag, selectionRoots, walk } from './selection.ts'
import type { SemanticConfig } from './semantics-catalog.ts'
import { freshSemanticId } from './semantics-slots.ts'
import { pinPack } from './library/document.ts'
import type { LibraryDocument } from './library/types.ts'

export interface ClipboardBundle extends LibraryDocument {
  roots: Widget[]
  parents: string[]
  positions: Record<string, { x: number; y: number }>
  hidden: string[]
  locked: string[]
  components?: ButterDocument['components']
  preview?: ButterDocument['preview']
  semantics?: Record<string, SemanticConfig>
}
export function copyBundle(doc: ButterDocument, ids: string[]): ClipboardBundle {
  const roots = selectionRoots(doc, ids)
  if (!roots.length || roots.includes(doc.root.id)) throw new Error('Select components or groups to copy')
  const included = new Set(roots.flatMap(id => walk(requireNode(doc, id))).map(node => node.id))
  const flags = (flag: 'hidden' | 'locked') => [...new Set([
    ...(doc[flag] ?? []).filter(id => included.has(id)), ...roots.filter(id => inheritedFlag(doc, id, flag)),
  ])]
  return { roots: structuredClone(roots.map(id => requireNode(doc, id))), parents: roots.map(id => parentOf(doc.root, id)!.id),
    positions: Object.fromEntries(positionedBoxes(doc).filter(b => included.has(b.id)).map(b => [b.id, { x: b.x, y: b.y }])),
    components: Object.fromEntries(Object.entries(doc.components ?? {}).filter(([id]) => included.has(id)).map(([id, v]) => [id, structuredClone(v)])),
    preview: Object.fromEntries(Object.entries(doc.preview ?? {}).filter(([id]) => included.has(id)).map(([id, v]) => [id, structuredClone(v)])),
    hidden: flags('hidden'), locked: flags('locked'),
    component_refs: Object.fromEntries(Object.entries(doc.component_refs??{}).filter(([id])=>included.has(id)).map(([id,v])=>[id,structuredClone(v)])),
    library: Object.fromEntries([...new Set(Object.entries(doc.component_refs??{}).filter(([id])=>included.has(id)).map(([,v])=>v.pack))].map(key=>[key,structuredClone(doc.library![key])])),
    semantics: Object.fromEntries(Object.entries(doc.semantics ?? {}).filter(([id]) => included.has(id)).map(([id, value]) => [id, structuredClone(value)])) }
}
export function pasteBundle(doc: ButterDocument, bundle: ClipboardBundle, parentId: string,
  dx = 8, dy = 8, originalParents = false) {
  if (![dx, dy].every(n => Number.isInteger(n) && Math.abs(n) <= 32768)) throw new Error('Paste offsets must be integer pixels')
  const hasPlayer = bundle.roots.some(root => hasKind(root, 'player'))
  if (hasPlayer && hasKind(doc.root, 'player')) throw new Error('Only one PlayerInventory is supported')
  if (hasPlayer && parentId !== doc.root.id && !originalParents) throw new Error('Paste inventory directly into the screen')
  freezePositions(doc)
  for(const pack of Object.values(bundle.library??{}))pinPack(doc,pack)
  const ids = new Set(walk(doc.root).map(n => n.id)), names = new Set(walk(doc.root).map(n => n.name))
  const hidden = new Set(bundle.hidden), locked = new Set(bundle.locked)
  const semanticIds = new Set(Object.values(doc.semantics ?? {}).map(value => value.id))
  let counter = 1
  function clone(node: Widget): Widget {
    while (ids.has(`b${counter}`)) counter++
    const id = `b${counter++}`; ids.add(id)
    let name = node.name, suffix = 1
    if (node.kind !== 'player') {
      while (names.has(name) || (hasKind(doc.root, 'player') && /^player\.\d+$/.test(name))) {
        const end = `.${suffix++}`; name = node.name.slice(0, 100 - end.length) + end
      }
    }
    if (names.has(name)) throw new Error(`Semantic name is already used: ${name}`)
    names.add(name)
    const point = bundle.positions[node.id]
    if(bundle.component_refs?.[node.id]) {doc.component_refs??={};doc.component_refs[id]=structuredClone(bundle.component_refs[node.id])}
    if (point) doc.positions![id] = { x: point.x + dx, y: point.y + dy }
    for (const section of ['components', 'preview'] as const) if (bundle[section]?.[node.id]) { doc[section] ??= {}; doc[section]![id] = structuredClone(bundle[section]![node.id]) as never }
    if (bundle.semantics?.[node.id]) {
      const semantic = structuredClone(bundle.semantics[node.id]); semantic.id = freshSemanticId(semantic.id, semanticIds)
      delete semantic.slot; delete semantic.tab_index; doc.semantics ??= {}; doc.semantics[id] = semantic
    }
    if (hidden.has(node.id)) doc.hidden.push(id)
    if (locked.has(node.id)) { doc.locked ??= []; doc.locked.push(id) }
    return { ...node, id, name, children: node.children.map(clone) }
  }
  return bundle.roots.map((node, i) => {
    const parent = originalParents ? bundle.parents[i] : parentId
    if (inheritedFlag(doc, parent, 'locked')) throw new Error('Unlock the target group first')
    const copied = clone(node); insert(doc, parent, copied); return copied.id
  })
}
