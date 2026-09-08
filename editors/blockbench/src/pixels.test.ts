import { test, expect } from 'bun:test'
import { crusher } from '../../gui-builder/src/model/presets.ts'
import { readDocument } from './document.ts'
import { nudge, selectedBounds, setPosition, positionedBoxes } from './position.ts'
import { duplicate, remove } from './operations.ts'
import { exportPixels } from './export-pixels.ts'
import { requireVersion } from './versions.ts'
import { glyphWidths } from './minecraft/font.ts'
import { EditorStore } from './store.ts'

const doc = () => readDocument({ version: 1, root: crusher(), hidden: [] })
test('group nudges preserve spacing and survive duplicate, history and JSON', () => {
  const value = doc(), group = value.root.children[0], before = selectedBounds(value, group.id)!
  nudge(value, group.id, 1, -10)
  expect(selectedBounds(value, group.id)).toEqual({ ...before, x: before.x + 1, y: before.y - 10 })
  const copy = duplicate(value, group.id)
  expect(selectedBounds(value, copy)).toEqual(selectedBounds(value, group.id))
  const store = new EditorStore(value), next = store.snapshot()
  setPosition(next, group.id, 23, 41); store.commit(next)
  expect(selectedBounds(store.snapshot(), group.id)?.x).toBe(23)
  store.history('undo'); expect(store.snapshot()).toEqual(readDocument(value))
  expect(readDocument(JSON.parse(JSON.stringify(value)))).toEqual(readDocument(value))
  remove(value, copy); expect(Object.keys(value.positions!)).toHaveLength(group.children.length)
})
test('export uses editor positions and keeps the adapter outside shared source', () => {
  const value = doc(), box = positionedBoxes(value).find(b => b.kind === 'slot')!
  setPosition(value, box.id, 41, 29)
  const source = exportPixels(value)
  expect(source.split('\n').find(line => line.includes(`Slot(0, id: "${box.name}"`))).toContain('x: 41, y: 29')
  expect(source).not.toContain('b1.7.3')
  expect(source).not.toContain('target:')
  expect(exportPixels({ ...value, target: undefined })).toBe(source)
  expect(source.match(/Slot\(/g)).toHaveLength(38)
  expect(() => requireVersion('1.12.2')).toThrow('not available')
})
test('invalid movements are rejected without committing a partial change', () => {
  const store = new EditorStore(doc()), before = store.inspect(), value = store.snapshot()
  expect(() => nudge(value, value.root.id, 1, 0)).toThrow('Select')
  expect(() => nudge(value, value.root.children[0].id, .5, 0)).toThrow('integers')
  expect(store.inspect()).toEqual(before)
})
test('bitmap widths scan blue ink and retain vanilla space and empty glyph advances', () => {
  const pixels = new Uint8ClampedArray(128 * 128 * 4)
  pixels[(3 * 128 + 5) * 4 + 2] = 255
  pixels[(3 * 128 + 7) * 4] = 255
  const widths = glyphWidths(pixels)
  expect(widths[0]).toBe(7); expect(widths[32]).toBe(4); expect(widths[1]).toBe(1)
})
