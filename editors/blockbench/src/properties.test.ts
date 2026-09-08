import { expect, test } from 'bun:test'
import { readDocument } from './document.ts'
import { componentVariants, componentFields, previewFields, values } from './component-properties.ts'
import { PALETTE, GROUP_KINDS } from '../../gui-builder/src/model/types.ts'
import { EditorStore } from './store.ts'
import { exportPixels } from './export-pixels.ts'
import { positionedBoxes, freezePositions } from './position.ts'
import { copyBundle, pasteBundle } from './clipboard-model.ts'
import { duplicate, remove } from './operations.ts'

function fixture() {
  return readDocument({ version: 1, hidden: [], root: { id: 'screen', name: 'test', kind: 'screen', children: [
    { id: 'row', name: 'row', kind: 'row', children: ['a', 'b'].map(id => ({ id, name: id, kind: 'tank', children: [] })) },
  ] } })
}
test('variant dimensions participate in row packing and frozen positioning', () => {
  const doc = fixture(); doc.components = { a: { variant: 'small' }, b: { variant: 'wide' } }
  const [a, b] = positionedBoxes(doc)
  expect([a.w, a.h, b.w, b.h, b.x - a.x]).toEqual([18, 18, 36, 54, 18])
  freezePositions(doc); doc.components.a.variant = 'big'
  const resized = positionedBoxes(doc)
  expect(resized.map(v => [v.x, v.y])).toEqual([a, b].map(v => [v.x, v.y]))
  expect(resized[0].h).toBe(54)
})
test('visual test state is isolated by instance and excluded from every runtime source prop', () => {
  const doc = fixture(), original = exportPixels(doc)
  doc.preview = { a: { level: 100, substance: 'lava', color: '#ff00ff' }, b: { level: 25, substance: 'water' } }
  expect(exportPixels(readDocument(doc))).toBe(original)
  expect(readDocument(doc).preview!.a.level).toBe(100)
  expect(readDocument(doc).preview!.b.level).toBe(25)
})
test('invalid variants, properties, unknown references and nonfinite values fail atomically', () => {
  const store = new EditorStore(fixture()), original = store.inspect()
  for (const patch of [
    { components: { a: { variant: 'missing' } } }, { components: { a: { props: { max: -1 } } } },
    { preview: { missing: { level: 20 } } }, { preview: { a: { level: Infinity } } },
    { preview: { a: { level: 101 } } }, { preview: { a: { level: .5 } } },
    { preview: { a: { checked: true } } }, { preview: { a: { substance: 'steam' } } },
    { preview: { a: { color: '#oops' } } }, { components: { a: { fake: true } } },
  ]) { expect(() => store.commit({ ...store.snapshot(), ...patch })).toThrow(); expect(store.inspect()).toEqual(original) }
})
test('preview gestures collapse to one undo and cancel restores prior test values', () => {
  const store = new EditorStore(fixture()); store.select('a'); store.beginGesture('Adjust preview')
  for (const level of [1, 20, 40, 50]) { const doc = store.snapshot(); doc.preview = { a: { level } }; store.updateGesture(doc) }
  store.commitGesture(); expect(store.revision).toBe(1); expect(store.snapshot().preview!.a.level).toBe(50)
  store.history('undo'); expect(store.snapshot().preview).toEqual({}); store.history('redo')
  store.beginGesture('Adjust preview'); const doc = store.snapshot(); doc.preview!.a.level = 100; store.updateGesture(doc); store.cancelGesture()
  expect(store.snapshot().preview!.a.level).toBe(50)
})
test('duplicate, cross-project paste, deletion and document roundtrip retain independent configs', () => {
  const doc = fixture(); doc.components = { a: { variant: 'small', props: { max: 8000 } } }; doc.preview = { a: { level: 25, substance: 'oil' } }
  const id = duplicate(doc, 'a'); doc.preview![id].level = 90
  expect(doc.preview.a.level).toBe(25); expect(doc.components[id]).toEqual(doc.components.a)
  const target = fixture(), pasted = pasteBundle(target, copyBundle(doc, ['a']), 'screen')[0]
  expect(readDocument(target).components![pasted]).toEqual(doc.components.a)
  expect(readDocument(target).preview![pasted]).toEqual(doc.preview.a)
  remove(doc, 'a'); expect(doc.preview.a).toBeUndefined(); expect(doc.components.a).toBeUndefined()
  expect(readDocument(JSON.parse(JSON.stringify(doc)))).toEqual(readDocument(doc))
})
test('static component props export while backing bindings take precedence', () => {
  const doc = fixture(); doc.components = { a: { variant: 'small', props: { max: 8000 } } }
  expect(exportPixels(doc)).toContain('max: 8000'); expect(exportPixels(doc)).toContain('w-18 h-18')
  doc.semantics!.a.bindings = { max: 'capacity' }
  expect(exportPixels(doc)).toContain('max: capacity'); expect(exportPixels(doc)).not.toContain('max: 8000')
})
test('all leaf kinds have a valid catalog, preview schema, geometry and exported runtime type', () => {
  for (const kind of PALETTE.filter(kind => !GROUP_KINDS.has(kind) && kind !== 'player')) {
    const doc = fixture(); doc.root.children = [{ id: 'item', name: 'item', kind, children: [] }]; doc.semantics = {}
    for (const variant of componentVariants(kind)) {
      doc.components = { item: { variant: variant.id, props: values(componentFields(kind)) } }
      doc.preview = { item: values(previewFields(kind)) }
      const valid = readDocument(doc), box = positionedBoxes(valid)[0]
      expect([box.w, box.h]).toEqual([variant.w, variant.h]); expect(exportPixels(valid)).not.toContain('undefined')
    }
  }
})

test('plugin session recovery preserves GUI revision, selection and undo/redo frames', () => {
  const store = new EditorStore(fixture()); store.select('a'); const doc = store.snapshot(); doc.preview = { a: { level: 75 } }; store.commit(doc)
  const reopened = new EditorStore(store.snapshot()); reopened.restoreSession(store.session())
  expect(reopened.inspect()).toEqual(store.inspect()); reopened.history('undo'); expect(reopened.snapshot().preview).toEqual({})
  reopened.history('redo'); expect(reopened.snapshot().preview!.a.level).toBe(75)
})
