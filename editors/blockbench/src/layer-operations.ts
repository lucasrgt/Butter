import { parentOf, findById, removeById } from '../../gui-builder/src/model/tree.ts'
import { GROUP_KINDS } from '../../gui-builder/src/model/types.ts'
import type { ButterDocument } from './document.ts'
import { add, insert, remove, requireNode } from './operations.ts'
import { freezePositions } from './position.ts'
import { editableRoots, selectionRoots, walk, inheritedFlag } from './selection.ts'

export function reparent(doc: ButterDocument, ids: string[], parentId: string, index?: number) {
  const roots = editableRoots(doc, ids), parent = requireNode(doc, parentId)
  if (!GROUP_KINDS.has(parent.kind)) throw new Error('Target must be a group')
  if (inheritedFlag(doc, parentId, 'locked')) throw new Error('Unlock the target group first')
  const nodes = roots.map(id => requireNode(doc, id))
  if (nodes.some(node => findById(node, parentId))) throw new Error('Cannot move a group inside itself')
  if (nodes.some(node => node.kind === 'player') && parent !== doc.root) throw new Error('Inventory belongs directly to the screen')
  let at = index ?? parent.children.length
  if (!Number.isInteger(at) || at < 0 || at > parent.children.length) throw new Error('Invalid layer index')
  at -= parent.children.slice(0, at).filter(node => roots.includes(node.id)).length
  freezePositions(doc)
  for (const node of nodes) doc.root = removeById(doc.root, node.id)
  nodes.forEach((node, offset) => insert(doc, parentId, node, at + offset))
  return roots
}
export function groupLayers(doc: ButterDocument, ids: string[], kind: 'row' | 'column' = 'row', name?: string) {
  if (!['row', 'column'].includes(kind)) throw new Error('Groups must be rows or columns')
  const roots = editableRoots(doc, ids)
  if (roots.some(id => requireNode(doc, id).kind === 'player')) throw new Error('Inventory must remain outside groups')
  let parent = parentOf(doc.root, roots[0])!
  while (!roots.every(id => !!findById(parent, id))) parent = parentOf(doc.root, parent.id)!
  const first = parent.children.findIndex(node => roots.some(id => !!findById(node, id)))
  freezePositions(doc)
  const id = add(doc, kind, parent.id, name)
  reparent(doc, roots, id)
  const group = requireNode(doc, id)
  parent = requireNode(doc, parent.id)
  parent.children.splice(parent.children.indexOf(group), 1); parent.children.splice(first, 0, group)
  return [id]
}
export function ungroupLayers(doc: ButterDocument, ids: string[]) {
  const roots = editableRoots(doc, ids)
  if (roots.some(id => !GROUP_KINDS.has(requireNode(doc, id).kind))) throw new Error('Select groups to ungroup')
  freezePositions(doc)
  const selected: string[] = []
  for (const id of roots) {
    const node = requireNode(doc, id), parent = parentOf(doc.root, id)!, index = parent.children.indexOf(node)
    parent.children.splice(index, 1, ...node.children); selected.push(...node.children.map(child => child.id))
    if (doc.hidden.includes(id)) doc.hidden.push(...node.children.map(child => child.id))
    doc.hidden = doc.hidden.filter(value => value !== id)
    doc.locked = doc.locked?.filter(value => value !== id)
    if (doc.semantics) delete doc.semantics[id]
  }
  return selected
}
export function removeLayers(doc: ButterDocument, ids: string[]) {
  const roots = editableRoots(doc, ids); freezePositions(doc); roots.forEach(id => remove(doc, id)); return []
}
export function orderLayers(doc: ButterDocument, ids: string[], action: string) {
  const roots = editableRoots(doc, ids), chosen = new Set(roots); freezePositions(doc)
  const parents = new Set(roots.map(id => parentOf(doc.root, id)!))
  for (const parent of parents) {
    const items = parent.children
    if (action === 'bring_front') parent.children = [...items.filter(n => !chosen.has(n.id)), ...items.filter(n => chosen.has(n.id))]
    else if (action === 'send_back') parent.children = [...items.filter(n => chosen.has(n.id)), ...items.filter(n => !chosen.has(n.id))]
    else if (action === 'bring_forward') {
      for (let i = items.length - 2; i >= 0; i--) if (chosen.has(items[i].id) && !chosen.has(items[i + 1].id)) [items[i], items[i + 1]] = [items[i + 1], items[i]]
    } else if (action === 'send_backward') {
      for (let i = 1; i < items.length; i++) if (chosen.has(items[i].id) && !chosen.has(items[i - 1].id)) [items[i], items[i - 1]] = [items[i - 1], items[i]]
    } else throw new Error('Unknown stacking action')
  }
  return roots
}
export function flagLayers(doc: ButterDocument, ids: string[], flag: 'hidden' | 'locked', value: boolean) {
  const roots = selectionRoots(doc, ids), flags = new Set(doc[flag] ?? [])
  for (const id of roots) { if (value) flags.add(id); else flags.delete(id) }
  doc[flag] = [...flags]; return roots
}
export function resetLayout(doc: ButterDocument, ids: string[]) {
  const roots = editableRoots(doc, ids), leaves = new Set(roots.flatMap(id => walk(requireNode(doc, id))).map(n => n.id))
  for (const id of Object.keys(doc.positions ?? {})) if (leaves.has(id)) delete doc.positions![id]
  return roots
}
