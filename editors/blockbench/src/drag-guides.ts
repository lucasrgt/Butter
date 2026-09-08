import type { ButterDocument } from './document.ts'
import { visibleBoxes } from './document.ts'
import { selectionBounds, selectionRoots, walk } from './selection.ts'
import { findById } from '../../gui-builder/src/model/tree.ts'
import type { ViewState } from './view-state.ts'

export interface Guide { axis: 'x' | 'y'; value: number }
export function dragDelta(doc: ButterDocument, ids: string[], dx: number, dy: number, view: ViewState, scale: number, shift: boolean) {
  const box = selectionBounds(doc, ids)
  if (!box) throw new Error('Selection has no bounds')
  const lockY = shift && Math.abs(dx) >= Math.abs(dy), lockX = shift && !lockY
  if (lockX) dx = 0
  if (lockY) dy = 0
  if (view.snap) {
    if (!lockX) dx = Math.round((box.x + dx) / view.grid_size) * view.grid_size - box.x
    if (!lockY) dy = Math.round((box.y + dy) / view.grid_size) * view.grid_size - box.y
  }
  const guides: Guide[] = []
  if (view.smart_guides) {
    const excluded = new Set(selectionRoots(doc, ids).flatMap(id => walk(findById(doc.root, id)!)).map(n => n.id))
    const others = visibleBoxes(doc).filter(b => !excluded.has(b.id))
    for (const axis of ['x', 'y'] as const) {
      const size = axis === 'x' ? 'w' : 'h', length = axis === 'x' ? 176 : 166
      const edges = [box[axis], box[axis] + box[size] / 2, box[axis] + box[size]]
      const targets = [0, length / 2, length, ...others.flatMap(b => [b[axis], b[axis] + b[size] / 2, b[axis] + b[size]])]
      const delta = axis === 'x' ? dx : dy
      const nearest = edges.flatMap(edge => targets.map(target => ({ target, distance: target - edge - delta })))
        .sort((a, b) => Math.abs(a.distance) - Math.abs(b.distance))[0]
      if (!nearest) continue
      const allowed = !view.snap && !(axis === 'x' ? lockX : lockY)
      if (allowed && Math.abs(nearest.distance) <= Math.max(1, 4 / scale)) {
        if (axis === 'x') dx += Math.round(nearest.distance); else dy += Math.round(nearest.distance)
      }
      const result = axis === 'x' ? dx : dy
      if (edges.some(edge => Math.abs(edge + result - nearest.target) <= .5)) guides.push({ axis, value: nearest.target })
    }
  }
  return { dx, dy, guides }
}
