import type { ButterDocument } from './document.ts'
import { selectedBounds } from './position.ts'
import { selectable, inheritedFlag } from './selection.ts'
import { findById } from '../../gui-builder/src/model/tree.ts'
import { GROUP_KINDS } from '../../gui-builder/src/model/types.ts'

export type Rectangle = { x: number; y: number; w: number; h: number }
export const contains = (b: Rectangle, x: number, y: number) => x >= b.x && y >= b.y && x <= b.x + b.w && y <= b.y + b.h
export function canvasHit(doc: ButterDocument, selection: string[], x: number, y: number, mode: 'group' | 'component', direct: boolean) {
  if (!direct) {
    const group = [...selection].reverse().find(id => id !== doc.root.id && GROUP_KINDS.has(findById(doc.root, id)!.kind) &&
      !inheritedFlag(doc, id, 'locked') && !inheritedFlag(doc, id, 'hidden') && !!selectedBounds(doc, id) && contains(selectedBounds(doc, id)!, x, y))
    if (group) return group
  }
  return selectable(doc, direct ? 'component' : mode).reverse().find(id => contains(selectedBounds(doc, id)!, x, y))
}
export function marqueeHits(doc: ButterDocument, box: Rectangle, mode: 'group' | 'component') {
  return selectable(doc, mode).filter(id => {
    const b = selectedBounds(doc, id)!
    return b.x <= box.x + box.w && b.x + b.w >= box.x && b.y <= box.y + box.h && b.y + b.h >= box.y
  })
}
