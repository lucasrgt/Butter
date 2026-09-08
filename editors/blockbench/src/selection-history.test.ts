import { describe, expect, test } from 'bun:test'
import { EditorStore } from './store.ts'
import { crusher } from '../../gui-builder/src/model/presets.ts'
import { selectionRoots, editableRoots } from './selection.ts'
import { translate } from './transforms.ts'
import { copyBundle, pasteBundle } from './clipboard-model.ts'
import { positionedBoxes } from './position.ts'
const store = () => new EditorStore({ version: 1, root: crusher(), hidden: [] })

describe('selection and atomic movement', () => {
  test('normalizes duplicates and ancestor selections in document order', () => {
    const s = store(), d = s.snapshot(), g = d.root.children[0], a = g.children[0]
    expect(selectionRoots(d, [a.id, g.id, a.id])).toEqual([g.id])
    expect(selectionRoots(d, [d.root.id, a.id])).toEqual([a.id])
    s.selectMany([a.id]); s.selectMany([d.root.children[1].id], 'add')
    expect(s.selection).toHaveLength(2)
    s.selectMany([a.id], 'toggle'); expect(s.selection).toEqual([d.root.children[1].id])
    s.selectMany([], 'replace'); expect(s.inspect().selected_ids).toEqual([])
    expect(() => s.selectMany(['unknown'])).toThrow('Unknown')
    expect(s.selection).toEqual([])
  })
  test('no-op commits preserve redo and revision', () => {
    const s = store(), d = s.snapshot(); d.root.name = 'new'; s.commit(d); s.history('undo')
    const revision = s.revision; s.commit(s.snapshot()); expect(s.revision).toBe(revision)
    s.history('redo'); expect(s.snapshot().root.name).toBe('new')
  })
  test('many gesture updates become one undo and restore selection', () => {
    const s = store(), original = s.snapshot(), ids = original.root.children[0].children.slice(0, 2).map(n => n.id)
    s.selectMany(ids); s.beginGesture('Move')
    for (let i = 0; i < 8; i++) { const d = s.snapshot(); translate(d, ids, 1, 0); s.updateGesture(d) }
    expect(s.revision).toBe(0); expect(s.inspect().canUndo).toBeFalse()
    expect(() => s.commit(s.snapshot())).toThrow('active gesture')
    s.commitGesture(); expect(s.revision).toBe(1); expect(s.inspect().undo_label).toBe('Move')
    s.selectMany([]); s.history('undo'); expect(s.snapshot()).toEqual(original); expect(s.selection).toEqual(ids)
    expect(s.inspect().canUndo).toBeFalse(); s.history('redo'); expect(s.selection).toEqual([])
  })
  test('cancelled clone-drag restores document and original selection', () => {
    const s = store(), d = s.snapshot(), id = d.root.children[0].id; s.select(id)
    const original = s.inspect(); s.beginGesture('Duplicate and move')
    const clones = pasteBundle(d, copyBundle(d, [id]), d.root.id, 0, 0, true)
    translate(d, clones, 30, 10); s.updateGesture(d, clones); s.cancelGesture()
    expect(s.inspect()).toEqual(original)
  })
  test('invalid coordinate and stale commit cannot damage live document', () => {
    const s = store(), before = s.inspect(), d = s.snapshot(), id = d.root.children[1].id
    translate(d, [id], 32768, 0); expect(() => s.commit(d)).toThrow()
    expect(s.inspect()).toEqual(before)
    expect(() => s.commit(s.snapshot(), 50)).toThrow('Revision conflict')
    expect(positionedBoxes(s.snapshot())).toEqual(positionedBoxes(before.document))
  })
  test('locked descendants prevent moving or deleting their group', () => {
    const s = store(), d = s.snapshot(), g = d.root.children[0]; d.locked = [g.children[0].id]
    expect(() => editableRoots(d, [g.id])).toThrow('Unlock')
    expect(() => editableRoots(d, [d.root.id])).toThrow('protected')
    expect(() => editableRoots(d, [])).toThrow('Select')
  })
})
