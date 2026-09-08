import { createLeaf, findById, parentOf, removeById } from '../../gui-builder/src/model/tree.ts'
import { GROUP_KINDS, type Kind, type Widget } from '../../gui-builder/src/model/types.ts'
import type { ButterDocument } from './document.ts'
import { freshSemanticId } from './semantics-slots.ts'

export function requireNode(doc: ButterDocument, id: string): Widget {
  const node = findById(doc.root, id)
  if (!node) throw new Error(`Unknown widget: ${id}`)
  return node
}

export function insert(doc: ButterDocument, parentId: string, child: Widget, index?: number) {
  const parent = requireNode(doc, parentId)
  if (!GROUP_KINDS.has(parent.kind)) throw new Error('Choose a Row, Column or screen parent')
  if (child.kind === 'player' && parent !== doc.root) throw new Error('PlayerInventory belongs directly to the screen')
  const at = index ?? parent.children.length
  if (!Number.isInteger(at) || at < 0 || at > parent.children.length) throw new Error('Invalid layer index')
  parent.children.splice(at, 0, child)
}

export function add(doc: ButterDocument, kind: Kind, parentId: string, name?: string) {
  const node = createLeaf(kind, doc.root)
  node.id = freshId(doc)
  if (name !== undefined) node.name = name
  insert(doc, parentId, node)
  return node.id
}

export function move(doc: ButterDocument, id: string, parentId: string, index?: number) {
  const node = requireNode(doc, id)
  if (node === doc.root) throw new Error('Cannot move the screen root')
  if (findById(node, parentId)) throw new Error('Cannot move a layer into itself or its descendants')
  requireNode(doc, parentId)
  doc.root = removeById(doc.root, id)
  insert(doc, parentId, node, index)
}

export function duplicate(doc: ButterDocument, id: string) {
  const original = requireNode(doc, id)
  const parent = parentOf(doc.root, id)
  if (!parent) throw new Error('Cannot duplicate the screen root')
  const names = new Set<string>()
  const ids = new Set<string>()
  const semanticIds = new Set(Object.values(doc.semantics ?? {}).map(item => item.id))
  function collect(node: Widget) {
    names.add(node.name)
    ids.add(node.id)
    node.children.forEach(collect)
  }
  collect(doc.root)
  function copy(node: Widget): Widget {
    if (node.kind === 'player') throw new Error('Only one PlayerInventory is supported')
    let suffix = 1
    while (names.has(`${node.name}.${suffix}`)) suffix++
    const name = `${node.name}.${suffix}`
    names.add(name)
    let counter = ids.size + 1
    while (ids.has(`b${counter}`)) counter++
    const id = `b${counter}`
    ids.add(id)
    for (const map of [doc.components, doc.preview]) if (map?.[node.id]) map[id] = structuredClone(map[node.id]) as never
    if (doc.positions?.[node.id]) doc.positions[id] = { ...doc.positions[node.id] }
    if (doc.semantics?.[node.id]) {
      const semantic = structuredClone(doc.semantics[node.id]); semantic.id = freshSemanticId(semantic.id, semanticIds)
      delete semantic.slot; delete semantic.tab_index; doc.semantics[id] = semantic
    }
    return { ...node, id, name, children: node.children.map(copy) }
  }
  const clone = copy(original)
  insert(doc, parent.id, clone, parent.children.indexOf(original) + 1)
  return clone.id
}

export function remove(doc: ButterDocument, id: string) {
  if (id === doc.root.id) throw new Error('Cannot remove the screen root')
  requireNode(doc, id)
  doc.root = removeById(doc.root, id)
  doc.hidden = doc.hidden.filter(hidden => findById(doc.root, hidden))
  doc.locked = doc.locked?.filter(locked => findById(doc.root, locked))
  if (doc.positions) {
    for (const key of Object.keys(doc.positions)) if (!findById(doc.root, key)) delete doc.positions[key]
  }
  for (const map of [doc.components, doc.preview]) for (const key of Object.keys(map ?? {})) if (!findById(doc.root, key)) delete map![key]
  for (const key of Object.keys(doc.semantics ?? {})) if (!findById(doc.root, key)) delete doc.semantics![key]
}

function freshId(doc: ButterDocument): string {
  let id = 1
  while (findById(doc.root, `b${id}`)) id++
  return `b${id}`
}
