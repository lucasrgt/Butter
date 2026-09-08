import { describe, test, expect } from 'bun:test'
import { crusher, chest } from '../../gui-builder/src/model/presets.ts'
import { findById } from '../../gui-builder/src/model/tree.ts'
import { emitButter } from '../../gui-builder/src/model/butter.ts'
import { EditorStore } from './store.ts'
import { readDocument, layoutWarnings, visibleBoxes } from './document.ts'
import { add, move, duplicate, remove } from './operations.ts'

const document = () => ({ version: 1, root: crusher(), hidden: [] })

describe('Butter authoring document', () => {
  test('round-trips native JSON without changing .butter source', () => {
    const doc = readDocument(document())
    expect(readDocument(JSON.parse(JSON.stringify(doc)))).toEqual(doc)
    expect(emitButter(doc.root)).toContain('public component Crusher()')
  })
  test('fails closed on unknown versions, kinds and unsupported fields', () => {
    expect(() => readDocument({ ...document(), version: 2 })).toThrow('version')
    const doc = document()
    ;(doc.root.children[0] as unknown as { kind: string }).kind = 'html'
    expect(() => readDocument(doc)).toThrow('supported')
    expect(() => readDocument({ ...document(), root: { ...crusher(), action: 'java' } })).toThrow('field')
  })
  test('rejects duplicate semantic names and node ids', () => {
    const doc = document()
    doc.root.children[1].name = doc.root.children[0].name
    expect(() => readDocument(doc)).toThrow('Duplicate semantic')
    doc.root.children[1].name = 'unique'
    doc.root.children[1].id = doc.root.children[0].id
    expect(() => readDocument(doc)).toThrow('Duplicate widget')
  })
  test('rejects invisible nested inventories and reserved player slot names', () => {
    const doc = document()
    doc.root.children[0].children.push(doc.root.children.pop()!)
    expect(() => readDocument(doc)).toThrow('direct screen child')
    const reserved = document()
    reserved.root.children[0].children[0].name = 'player.0'
    expect(() => readDocument(reserved)).toThrow('reserved')
  })
  test('rejects control characters, leaf children and invalid visibility ids', () => {
    const doc = document()
    doc.root.name = 'bad\nname'
    expect(() => readDocument(doc)).toThrow('printable')
    const leaf = document()
    leaf.root.children[1].children = [leaf.root.children[0]]
    expect(() => readDocument(leaf)).toThrow('Leaf')
    expect(() => readDocument({ ...document(), hidden: ['missing'] })).toThrow('existing')
  })
  test('hiding a group hides all descendants only in the authoring preview', () => {
    const doc = readDocument(document())
    const source = emitButter(doc.root)
    doc.hidden.push(doc.root.children[0].id)
    expect(visibleBoxes(doc).map(box => box.kind)).toEqual(['energy', 'player'])
    expect(emitButter(doc.root)).toBe(source)
  })
  test('reports overflows without silently clipping document contents', () => {
    const doc = readDocument({ version: 1, root: chest(), hidden: [] })
    for (let i = 0; i < 14; i++) add(doc, 'slot', doc.root.children[0].children[0].id)
    expect(layoutWarnings(doc).length).toBeGreaterThan(0)
  })
})

describe('transactions and history', () => {
  test('failed edits and stale revisions leave state and history unchanged', () => {
    const store = new EditorStore(document())
    const before = store.inspect()
    const invalid = store.snapshot()
    invalid.root.name = ''
    expect(() => store.commit(invalid)).toThrow()
    expect(() => store.commit(store.snapshot(), 1)).toThrow('Revision conflict')
    expect(store.inspect()).toEqual(before)
  })
  test('undo, redo, branch invalidation and selection recovery', () => {
    const store = new EditorStore(document())
    const doc = store.snapshot()
    const id = add(doc, 'slot', doc.root.id)
    store.commit(doc)
    store.select(id)
    store.history('undo')
    expect(store.selected).toBe(doc.root.id)
    expect(findById(store.snapshot().root, id)).toBeNull()
    store.history('redo')
    expect(findById(store.snapshot().root, id)).not.toBeNull()
    store.history('undo')
    const branch = store.snapshot(); branch.root.name = 'branch'; store.commit(branch)
    expect(() => store.history('redo')).toThrow('Nothing')
  })
  test('history and snapshots are isolated between projects', () => {
    const first = new EditorStore(document())
    const second = new EditorStore(document())
    const doc = first.snapshot()
    doc.root.name = 'changed'
    expect(first.snapshot().root.name).toBe('crusher')
    first.commit(doc)
    doc.root.name = 'external mutation'
    expect(first.snapshot().root.name).toBe('changed')
    expect(second.snapshot().root.name).toBe('crusher')
    expect(second.inspect().canUndo).toBeFalse()
  })
})

describe('layer operations', () => {
  test('reorders within a parent using the post-removal index', () => {
    const doc = readDocument(document())
    const row = doc.root.children[0]
    const id = row.children[0].id
    move(doc, id, row.id, 2)
    expect(findById(doc.root, row.id)!.children.map(node => node.name)).toEqual(['craft', 'output', 'input'])
    readDocument(doc)
  })
  test('rejects cycles, root deletion, invalid parents and inventory duplication', () => {
    const doc = readDocument(document())
    const row = doc.root.children[0]
    expect(() => move(doc, row.id, row.children[0].id)).toThrow('descendants')
    expect(() => remove(doc, doc.root.id)).toThrow('root')
    expect(() => add(doc, 'slot', row.children[0].id)).toThrow('parent')
    expect(() => duplicate(doc, doc.root.children[2].id)).toThrow('PlayerInventory')
  })
  test('duplicates a full subtree with fresh names and ids', () => {
    const doc = readDocument(document())
    const id = duplicate(doc, doc.root.children[0].id)
    const clone = findById(doc.root, id)!
    expect(clone.name).toBe('process.1')
    expect(clone.children[0].name).toBe('input.1')
    expect(clone.children).toHaveLength(3)
    readDocument(doc)
  })
  test('deletion cleans visibility references for the whole subtree', () => {
    const doc = readDocument(document())
    doc.hidden.push(doc.root.children[0].children[0].id)
    remove(doc, doc.root.children[0].id)
    expect(doc.hidden).toEqual([])
    readDocument(doc)
  })
  test('allocates unique ids after importing arbitrary existing ids', () => {
    const doc = readDocument(document())
    const oldId = doc.root.children[0].id
    doc.root.children[0].id = 'b1'
    doc.semantics!.b1 = doc.semantics![oldId]; delete doc.semantics![oldId]
    const id = add(doc, 'tank', doc.root.id)
    expect(id).toBe('b2')
    readDocument(doc)
  })
})
