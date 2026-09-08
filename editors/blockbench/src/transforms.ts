import type { ButterDocument } from './document.ts'
import { nudge, selectedBounds } from './position.ts'
import { editableRoots, selectionBounds } from './selection.ts'
import { parentOf } from '../../gui-builder/src/model/tree.ts'

export type AlignMode = 'left' | 'center_x' | 'right' | 'top' | 'center_y' | 'bottom'
export type AlignTarget = 'auto' | 'selection' | 'canvas' | 'parent'
export function translate(doc: ButterDocument, ids: string[], dx: number, dy: number) {
  editableRoots(doc, ids).forEach(id => nudge(doc, id, dx, dy))
}
export function positionSelection(doc: ButterDocument, ids: string[], x: number, y: number) {
  const bounds = selectionBounds(doc, ids)
  if (!bounds) throw new Error('Selection has no bounds')
  translate(doc, ids, x - bounds.x, y - bounds.y)
}
export function align(doc: ButterDocument, ids: string[], mode: AlignMode, relative: AlignTarget = 'auto') {
  const roots = editableRoots(doc, ids), union = selectionBounds(doc, roots)
  if (!['left', 'center_x', 'right', 'top', 'center_y', 'bottom'].includes(mode)) throw new Error('Unknown alignment')
  if (!['auto', 'selection', 'canvas', 'parent'].includes(relative)) throw new Error('Unknown alignment target')
  if (!union) throw new Error('Selection has no bounds')
  const target = relative === 'auto' ? (roots.length === 1 ? 'canvas' : 'selection') : relative
  const original = roots.map(id => ({ id, box: selectedBounds(doc, id)!, parent: parentOf(doc.root, id) }))
  const deltas = original.map(({ id, box, parent }) => {
    if (!box) throw new Error('Empty groups cannot be aligned')
    const area = target === 'selection' ? union : target === 'parent' && parent && parent !== doc.root
      ? selectedBounds(doc, parent.id)! : { x: 0, y: 0, w: 176, h: 166 }
    const x = mode === 'left' ? area.x : mode === 'center_x' ? Math.round(area.x + (area.w - box.w) / 2) : mode === 'right' ? area.x + area.w - box.w : box.x
    const y = mode === 'top' ? area.y : mode === 'center_y' ? Math.round(area.y + (area.h - box.h) / 2) : mode === 'bottom' ? area.y + area.h - box.h : box.y
    return { id, dx: x - box.x, dy: y - box.y }
  })
  deltas.forEach(d => nudge(doc, d.id, d.dx, d.dy))
}
export function distribute(doc: ButterDocument, ids: string[], axis: 'horizontal' | 'vertical') {
  if (!['horizontal', 'vertical'].includes(axis)) throw new Error('Unknown distribution axis')
  const roots = editableRoots(doc, ids), position = axis === 'horizontal' ? 'x' : 'y', size = axis === 'horizontal' ? 'w' : 'h'
  const items = roots.map(id => ({ id, box: selectedBounds(doc, id) }))
  if (items.length < 3 || items.some(item => !item.box)) throw new Error('Select at least three nonempty components or groups')
  const ordered = items.map(item => ({ id: item.id, box: item.box! })).sort((a, b) => a.box[position] - b.box[position])
  const first = ordered[0].box, last = ordered.at(-1)!.box
  const gap = (last[position] + last[size] - first[position] - ordered.reduce((sum, item) => sum + item.box[size], 0)) / (ordered.length - 1)
  let cursor = first[position]
  for (const item of ordered) {
    const delta = Math.round(cursor) - item.box[position]
    nudge(doc, item.id, axis === 'horizontal' ? delta : 0, axis === 'vertical' ? delta : 0)
    cursor += item.box[size] + gap
  }
}
