import { componentSize } from './component-properties.ts'
import { definition } from './library/document.ts'
import { pack } from '../../gui-builder/src/model/pack.ts'
import { findById } from '../../gui-builder/src/model/tree.ts'
import type { Box } from '../../gui-builder/src/model/types.ts'
import type { ButterDocument } from './document.ts'

export function positionedBoxes(doc: ButterDocument): Box[] {
  const order: string[] = []
  const visit = (node: typeof doc.root) => { order.push(node.id); node.children.forEach(visit) }
  visit(doc.root)
  const sizes = Object.fromEntries([...order].map(id => [id, componentSize(findById(doc.root, id)!.kind, doc.components?.[id],definition(doc,id))]).filter(([, size]) => size))
  return pack(doc.root, sizes).map(box => ({ ...box, ...doc.positions?.[box.id] }))
    .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
}

export function freezePositions(doc: ButterDocument) {
  doc.positions = Object.fromEntries(positionedBoxes(doc).map(b => [b.id, { x: b.x, y: b.y }]))
}

export function selectedBounds(doc: ButterDocument, id: string) {
  const node = findById(doc.root, id)
  if (!node) throw new Error(`Unknown widget: ${id}`)
  const boxes = positionedBoxes(doc).filter(box => findById(node, box.id))
  if (!boxes.length) return null
  const x = Math.min(...boxes.map(box => box.x))
  const y = Math.min(...boxes.map(box => box.y))
  return { x, y, w: Math.max(...boxes.map(box => box.x + box.w)) - x,
    h: Math.max(...boxes.map(box => box.y + box.h)) - y }
}

export function nudge(doc: ButterDocument, id: string, dx: number, dy: number) {
  if (id === doc.root.id) throw new Error('Select a component or group to move')
  if (![dx, dy].every(value => Number.isInteger(value) && Math.abs(value) <= 32768)) throw new Error('Pixel movement must use integers')
  const node = findById(doc.root, id)
  if (!node) throw new Error(`Unknown widget: ${id}`)
  const boxes = positionedBoxes(doc).filter(box => findById(node, box.id))
  if (!boxes.length) throw new Error('This group has no visible components to move')
  doc.positions ??= {}
  boxes.forEach(box => { doc.positions![box.id] = { x: box.x + dx, y: box.y + dy } })
}

export function setPosition(doc: ButterDocument, id: string, x: number, y: number) {
  const box = selectedBounds(doc, id)
  if (!box) throw new Error('This component has no bounds')
  nudge(doc, id, x - box.x, y - box.y)
}
