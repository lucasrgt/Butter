import { emptyScreen } from '../../gui-builder/src/model/presets.ts'
import { findById } from '../../gui-builder/src/model/tree.ts'
import { readDocument, type ButterDocument } from './document.ts'
import { selectionRoots } from './selection.ts'

type Frame = { document: ButterDocument; selection: string[]; label: string }
export class EditorStore {
  private doc: ButterDocument
  private past: Frame[] = []
  private future: Frame[] = []
  private draft?: { value: ButterDocument; selection: string[]; label: string }
  selection: string[]
  revision = 0
  constructor(value: unknown = { version: 1, root: emptyScreen(), hidden: [] }) {
    this.doc = readDocument(value)
    this.selection = [this.doc.root.id]
  }
  restoreSession(value: unknown) {
    const session = value as { document?: unknown; revision?: number; selection?: string[]; past?: Frame[]; future?: Frame[] } | undefined
    if (!session?.document || !Number.isInteger(session.revision) || Number(session.revision) < 0) return
    if (JSON.stringify(readDocument(session.document)) !== JSON.stringify(this.doc)) return
    const frames = (items: Frame[] | undefined) => {
      if (!Array.isArray(items) || items.length > 100) throw new Error('Invalid saved editor history')
      return items.map(frame => { const document = readDocument(frame.document); return { document, selection: selectionRoots(document, frame.selection), label: String(frame.label).slice(0, 100) } })
    }
    this.past = frames(session.past); this.future = frames(session.future); this.revision = session.revision!
    this.selection = selectionRoots(this.doc, session.selection ?? [])
  }
  session() { return structuredClone({ document: this.doc, revision: this.revision, selection: this.selection, past: this.past, future: this.future }) }
  get selected() { return this.selection.at(-1) ?? this.doc.root.id }
  get gesturing() { return !!this.draft }
  snapshot(): ButterDocument { return structuredClone(this.draft?.value ?? this.doc) }
  inspect() {
    return { document: this.snapshot(), selected: this.selected, selected_ids: [...this.selection], revision: this.revision,
      gesture: this.draft?.label ?? null, canUndo: this.past.length > 0, canRedo: this.future.length > 0,
      undo_label: this.past.at(-1)?.label ?? null, redo_label: this.future.at(-1)?.label ?? null }
  }
  checkRevision(expected?: number) {
    if (expected !== undefined && expected !== this.revision) throw new Error('Revision conflict; inspect the document again')
  }
  assertIdle() { if (this.draft) throw new Error('Finish or cancel the active gesture first') }
  private frame(label: string): Frame { return { document: structuredClone(this.doc), selection: [...this.selection], label } }
  commit(value: unknown, expected?: number, selection?: string[], label = 'Edit') {
    this.assertIdle(); this.checkRevision(expected)
    const next = readDocument(value)
    const selected = selection === undefined ? this.selection.filter(id => findById(next.root, id)) : selectionRoots(next, selection)
    if (JSON.stringify(next) === JSON.stringify(this.doc)) { this.selection = selected; return }
    this.past.push(this.frame(label))
    if (this.past.length > 100) this.past.shift()
    this.doc = next; this.selection = selected; this.future = []; this.revision++
  }
  select(id: string) { this.selectMany([id]) }
  selectMany(ids: string[], mode: 'replace' | 'add' | 'toggle' | 'remove' = 'replace') {
    this.assertIdle()
    if (!['replace', 'add', 'toggle', 'remove'].includes(mode)) throw new Error('Unknown selection mode')
    ids.forEach(id => { if (!findById(this.doc.root, id)) throw new Error(`Unknown widget: ${id}`) })
    const next = new Set(mode === 'replace' ? [] : this.selection)
    for (const id of ids) {
      if (mode === 'remove' || (mode === 'toggle' && next.has(id))) next.delete(id)
      else next.add(id)
    }
    this.selection = selectionRoots(this.doc, [...next])
  }
  beginGesture(label = 'Move') {
    this.assertIdle(); this.draft = { value: structuredClone(this.doc), selection: [...this.selection], label }
  }
  updateGesture(value: unknown, selection?: string[]) {
    if (!this.draft) throw new Error('No active gesture')
    this.draft.value = readDocument(value)
    if (selection) this.selection = selectionRoots(this.draft.value, selection)
  }
  cancelGesture() { if (this.draft) this.selection = this.draft.selection; this.draft = undefined }
  commitGesture() {
    const draft = this.draft
    if (!draft) return
    const selection = [...this.selection]
    this.draft = undefined; this.selection = draft.selection
    this.commit(draft.value, undefined, selection, draft.label)
  }
  history(direction: 'undo' | 'redo', expected?: number) {
    this.assertIdle(); this.checkRevision(expected)
    const source = direction === 'undo' ? this.past : this.future, target = direction === 'undo' ? this.future : this.past
    const next = source.pop()
    if (!next) throw new Error(`Nothing to ${direction}`)
    target.push(this.frame(next.label)); this.doc = next.document; this.selection = next.selection; this.revision++
  }
}
