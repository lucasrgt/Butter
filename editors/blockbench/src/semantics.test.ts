import { test, expect } from 'bun:test'
import { crusher } from '../../gui-builder/src/model/presets.ts'
import { readDocument } from './document.ts'
import { semanticTree, semanticSpec } from './semantics-export.ts'
import { exportPixels } from './export-pixels.ts'
import { duplicate, move, remove, add } from './operations.ts'
import { EditorStore } from './store.ts'

const fixture = () => readDocument({ version: 1, root: crusher(), hidden: [] })
test('legacy migration freezes IDs and slots across rename, reorder and round-trip', () => {
  const doc = fixture(), group = doc.root.children[0], input = group.children[0]
  const config = structuredClone(doc.semantics![input.id])
  input.name = 'renamed visual layer'; move(doc, input.id, group.id, 2)
  const roundtrip = readDocument(JSON.parse(JSON.stringify(doc)))
  expect(roundtrip.semantics![input.id]).toEqual(config)
  expect(semanticSpec(roundtrip).nodes.find(node => node.name === config.id)?.index).toBe(config.slot)
})
test('semantic overrides propagate to source and declared tree without invented runtime observations', () => {
  const doc = fixture(), group = doc.root.children[0], input = group.children[0]
  Object.assign(doc.semantics![doc.root.id], { id: 'crusher.control', label: 'Crusher control' })
  Object.assign(doc.semantics![group.id], { id: 'processing', region: true, role: 'region' })
  Object.assign(doc.semantics![input.id], { id: 'ore.input', label: 'Ore input', description: 'Primary input', slot: 99,
    bindings: { item: 'machine.item', count: 'machine.count', enabled: 'ready' }, action: 'activate' })
  const tree = semanticTree(readDocument(doc)), node = tree.nodes.find(node => node.id === 'ore.input')!
  expect(tree.screen).toBe('crusher.control'); expect(node.parent_id).toBe('processing'); expect(node.index).toBe(99)
  expect(node.attributes).toEqual({ id: 'ore.input', label: 'Ore input', description: 'Primary input' })
  expect(tree.runtimeObserved).toBe(false); expect(node.attributes.enabled).toBeUndefined()
  expect(exportPixels(doc)).toContain('container_index: 99'); expect(exportPixels(doc)).toContain('item: machine.item')
  expect(exportPixels(doc)).toContain('action: activate')
})
test('duplication allocates distinct IDs and container indices and preserves metadata', () => {
  const doc = fixture(), source = doc.root.children[0].children[0]
  Object.assign(doc.semantics![source.id], { label: 'Input', bindings: { enabled: 'ready' } })
  const id = duplicate(doc, source.id), normalized = readDocument(doc)
  expect(normalized.semantics![id].id).not.toBe(normalized.semantics![source.id].id)
  expect(normalized.semantics![id].slot).not.toBe(normalized.semantics![source.id].slot)
  expect(normalized.semantics![id].bindings).toEqual({ enabled: 'ready' })
  remove(normalized, id); expect(readDocument(normalized).semantics![id]).toBeUndefined()
})
test('invalid semantic contracts cannot commit or consume undo history', () => {
  const store = new EditorStore(fixture()), before = store.inspect()
  for (const override of [{ id: 'player.0' }, { role: 'button' }, { bindings: { value: 'a' } }, { slot: 2 }, { action: 'evil()' }]) {
    const doc = store.snapshot(), id = doc.root.children[0].children[0].id
    Object.assign(doc.semantics![id], override)
    expect(() => store.commit(doc)).toThrow()
    expect(store.inspect()).toEqual(before)
  }
})
test('search tab order is unique and changes participate in undo and redo', () => {
  const store = new EditorStore(fixture()), doc = store.snapshot(), a = add(doc, 'search', doc.root.id), b = add(doc, 'search', doc.root.id)
  store.commit(doc); const edit = store.snapshot()
  Object.assign(edit.semantics![a], { id: 'query', tab_index: 2, bindings: { value: 'query', readOnly: 'locked' } })
  Object.assign(edit.semantics![b], { tab_index: 1 }); store.commit(edit)
  expect(exportPixels(store.snapshot())).toContain('tabIndex: 2')
  store.history('undo'); expect(store.snapshot().semantics![a].tab_index).toBeUndefined()
  store.history('redo'); expect(store.snapshot().semantics![a].id).toBe('query')
  const invalid = store.snapshot(); invalid.semantics![b].tab_index = 2
  expect(() => store.commit(invalid)).toThrow('Duplicate tab')
})
