import { findById, parentOf } from '../../gui-builder/src/model/tree.ts'
import { GROUP_KINDS, type Widget } from '../../gui-builder/src/model/types.ts'
import type { ButterDocument } from './document.ts'
import { selectedBounds } from './position.ts'

export function walk(root: Widget): Widget[] { return [root, ...root.children.flatMap(walk)] }
export function selectionRoots(doc: ButterDocument, ids: string[]): string[] {
  const chosen = new Set(ids)
  const known = new Set(walk(doc.root).map(node => node.id))
  for (const id of chosen) if (!known.has(id)) throw new Error(`Unknown widget: ${id}`)
  if (chosen.size > 1) chosen.delete(doc.root.id)
  const roots: string[] = []
  function visit(node: Widget, selected: boolean) {
    if (chosen.has(node.id) && !selected) roots.push(node.id)
    node.children.forEach(child => visit(child, selected || chosen.has(node.id)))
  }
  visit(doc.root, false); return roots
}
export function inheritedFlag(doc: ButterDocument, id: string, flag: 'hidden' | 'locked') {
  let node = findById(doc.root, id)
  while (node) {
    if (doc[flag]?.includes(node.id)) return true
    node = parentOf(doc.root, node.id)
  }
  return false
}
export function editableRoots(doc: ButterDocument, ids: string[]) {
  const roots = selectionRoots(doc, ids)
  if (!roots.length) throw new Error('Select at least one component')
  for (const id of roots) {
    if (id === doc.root.id) throw new Error('The screen root is protected')
    if (walk(findById(doc.root, id)!).some(node => inheritedFlag(doc, node.id, 'locked'))) throw new Error('Unlock the selected layers first')
  }
  return roots
}
export function selectionBounds(doc: ButterDocument, ids: string[]) {
  const boxes = selectionRoots(doc, ids).filter(id => id !== doc.root.id).map(id => selectedBounds(doc, id)).filter(b => b !== null)
  if (!boxes.length) return null
  const x = Math.min(...boxes.map(b => b.x)), y = Math.min(...boxes.map(b => b.y))
  return { x, y, w: Math.max(...boxes.map(b => b.x + b.w)) - x, h: Math.max(...boxes.map(b => b.y + b.h)) - y }
}
export function selectable(doc: ButterDocument, mode: 'group' | 'component') {
  const result: string[] = []
  function visit(node: Widget) {
    if (inheritedFlag(doc, node.id, 'hidden') || inheritedFlag(doc, node.id, 'locked')) return
    if (node === doc.root) { node.children.forEach(visit); return }
    if (mode === 'group' || !GROUP_KINDS.has(node.kind)) { if (selectedBounds(doc, node.id)) result.push(node.id) }
    else node.children.forEach(visit)
  }
  visit(doc.root); return result
}
