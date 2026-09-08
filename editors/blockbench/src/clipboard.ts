import { current, persist, refresh } from './host.ts'
import { copyBundle, pasteBundle, type ClipboardBundle } from './clipboard-model.ts'
import { editableRoots } from './selection.ts'
import { removeLayers } from './layer-operations.ts'

let clipboard: ClipboardBundle | undefined
let pasted = 0
export function clipboardStatus() { return { available: !!clipboard, count: clipboard?.roots.length ?? 0,
  kinds: clipboard?.roots.map(node => node.kind) ?? [], scope: 'Butter session; shared across open projects' } }
export function clipboardCall(args: Record<string, unknown>) {
  const action = args.action ?? 'status', store = current(), doc = store.snapshot()
  if (action === 'status') return clipboardStatus()
  store.assertIdle()
  const revision = args.expected_revision
  if (revision !== undefined && !(typeof revision === 'number' && Number.isInteger(revision) && revision >= 0)) throw new Error('Invalid revision')
  store.checkRevision(revision as number | undefined)
  const ids = args.ids === undefined ? [...store.selection] : args.ids
  if (!Array.isArray(ids) || !ids.every(id => typeof id === 'string')) throw new Error('Expected component ids')
  if (action === 'copy' || action === 'cut') {
    if (action === 'cut') editableRoots(doc, ids)
    const bundle = copyBundle(doc, ids)
    if (action === 'cut') { removeLayers(doc, ids); store.commit(doc, undefined, [], 'Cut'); persist() }
    clipboard = bundle; pasted = 0; refresh()
    return { ...clipboardStatus(), ...store.inspect() }
  }
  if (action === 'paste' || action === 'paste_in_place') {
    if (!clipboard) throw new Error('The Butter clipboard is empty')
    if (args.parent_id !== undefined && typeof args.parent_id !== 'string') throw new Error('Expected parent id')
    const offset = action === 'paste_in_place' ? 0 : 8 * (pasted + 1)
    const selection = pasteBundle(doc, clipboard, args.parent_id as string ?? doc.root.id, offset, offset)
    store.commit(doc, undefined, selection, 'Paste'); pasted++; persist()
    return { ...clipboardStatus(), ...store.inspect() }
  }
  throw new Error('Unknown clipboard action')
}
