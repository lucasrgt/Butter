import { describe, expect, test } from 'bun:test'
import { crusher } from '../../gui-builder/src/model/presets.ts'
import { findById } from '../../gui-builder/src/model/tree.ts'
import { readDocument } from './document.ts'
import { groupLayers, ungroupLayers, reparent, removeLayers, orderLayers } from './layer-operations.ts'
import { positionedBoxes, selectedBounds } from './position.ts'
import { translate, align, distribute } from './transforms.ts'
import { copyBundle, pasteBundle } from './clipboard-model.ts'
const doc = () => readDocument({ version: 1, root: crusher(), hidden: [] })
const positions = (d: ReturnType<typeof doc>) => Object.fromEntries(positionedBoxes(d).map(b => [b.id, [b.x, b.y]]))

describe('batch geometry and hierarchy', () => {
  test('group and ungroup retain every leaf coordinate', () => {
    const d = doc(), row = d.root.children[0], ids = row.children.slice(0, 2).map(n => n.id), before = positions(d)
    const [group] = groupLayers(d, ids, 'column', 'new_group'); readDocument(d)
    expect(positions(d)).toEqual(before); expect(findById(d.root, group)!.children.map(n => n.id)).toEqual(ids)
    d.hidden.push(group); expect(ungroupLayers(d, [group])).toEqual(ids); readDocument(d)
    expect(positions(d)).toEqual(before); expect(d.hidden).toEqual(ids)
  })
  test('reparent across groups preserves positions and pre-removal index semantics', () => {
    const d = doc(), row = d.root.children[0], ids = row.children.map(n => n.id), before = positions(d)
    reparent(d, [ids[0]], row.id, 3)
    expect(findById(d.root, row.id)!.children.map(n => n.id)).toEqual([ids[1], ids[2], ids[0]])
    reparent(d, [ids[1]], d.root.id, 1); readDocument(d); expect(positions(d)).toEqual(before)
  })
  test('cycles, locked parents and nested inventory are rejected before edits', () => {
    const d = doc(), row = d.root.children[0], before = structuredClone(d)
    expect(() => reparent(d, [row.id], row.id)).toThrow('itself'); expect(d).toEqual(before)
    expect(() => reparent(d, [d.root.children[2].id], row.id)).toThrow('Inventory'); expect(d).toEqual(before)
    d.locked = [row.id]; expect(() => reparent(d, [d.root.children[1].id], row.id)).toThrow('Unlock')
  })
  test('delete and stacking order do not shift unrelated leaves', () => {
    const d = doc(), row = d.root.children[0], before = positions(d), id = row.children[1].id
    orderLayers(d, [row.children[0].id], 'bring_front'); expect(positions(d)).toEqual(before)
    removeLayers(d, [id]); delete before[id]; expect(positions(d)).toEqual(before); readDocument(d)
  })
  test('group translation applies once to children and keeps outside leaves still', () => {
    const d = doc(), row = d.root.children[0], before = positions(d)
    translate(d, [row.id, row.children[0].id], 5, -3)
    for (const box of positionedBoxes(d)) expect([box.x, box.y]).toEqual(row.children.some(n => n.id === box.id)
      ? [before[box.id][0] + 5, before[box.id][1] - 3] : before[box.id])
  })
  test('center on canvas and align to selection use integer geometry', () => {
    const d = doc(), row = d.root.children[0], id = row.children[0].id
    align(d, [id], 'center_x', 'canvas'); align(d, [id], 'center_y', 'canvas')
    expect(selectedBounds(d, id)).toEqual({ x: 79, y: 74, w: 18, h: 18 })
    const ids = row.children.map(n => n.id); align(d, ids, 'left', 'selection')
    expect(new Set(ids.map(i => selectedBounds(d, i)!.x)).size).toBe(1)
  })
  test('distribute keeps endpoints fixed with rounded equal gaps', () => {
    const d = doc(), ids = d.root.children[0].children.map(n => n.id)
    d.positions = { [ids[0]]: { x: 10, y: 20 }, [ids[1]]: { x: 40, y: 24 }, [ids[2]]: { x: 130, y: 28 } }
    distribute(d, ids, 'horizontal'); const b = ids.map(id => selectedBounds(d, id)!)
    expect(b[0].x).toBe(10); expect(b[2].x).toBe(130)
    expect(Math.abs((b[1].x-b[0].x-b[0].w)-(b[2].x-b[1].x-b[1].w))).toBeLessThanOrEqual(1)
    expect(() => distribute(d, ids.slice(0, 2), 'vertical')).toThrow('three')
  })
})
describe('clipboard geometry and flags', () => {
  test('duplicates preserve child offsets with fresh semantic names', () => {
    const d = doc(), row = d.root.children[0], bundle = copyBundle(d, [row.id]), before = selectedBounds(d, row.id)!
    const [clone] = pasteBundle(d, bundle, d.root.id, 8, 8); readDocument(d)
    expect(selectedBounds(d, clone)).toEqual({ ...before, x: before.x+8, y: before.y+8 })
    expect(findById(d.root, clone)!.children[0].name).toBe('input.1')
  })
  test('cross-project paste preserves inherited hidden and locked states', () => {
    const source = doc(), row = source.root.children[0]; source.hidden = [row.id]; source.locked = [row.id]
    const bundle = copyBundle(source, [row.children[0].id]), target = doc()
    const [id] = pasteBundle(target, bundle, target.root.id, 0, 0); readDocument(target)
    expect(target.hidden).toContain(id); expect(target.locked).toContain(id)
    expect(selectedBounds(target, id)).toEqual(selectedBounds(source, row.children[0].id))
  })
  test('inventory duplication fails before changing the document', () => {
    const d = doc(), before = structuredClone(d), bundle = copyBundle(d, [d.root.children[2].id])
    expect(() => pasteBundle(d, bundle, d.root.id)).toThrow('one PlayerInventory'); expect(d).toEqual(before)
  })
})
