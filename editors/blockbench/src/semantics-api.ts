import { showSemanticTree } from './semantics-dialog.ts'
import { current, persist } from './host.ts'
import { readDocument } from './document.ts'
import { requireNode } from './operations.ts'
import { inheritedFlag } from './selection.ts'
import { expectedRevision } from './editor-args.ts'
import { semanticCatalog } from './semantics-catalog.ts'
import { semanticTree } from './semantics-export.ts'
import { resolvedSemantics } from './library/document.ts'

export function semanticsCall(args: Record<string, unknown>) {
  const store = current(), doc = store.snapshot(), action = String(args.action ?? 'inspect')
  if (args.show_tree === true) showSemanticTree()
  if (action === 'tree' || action === 'validate') {
    const valid = readDocument(doc)
    return { valid: true, ...semanticTree(valid), note: 'Declared contract. Compile against the Java backing and observe the runtime to verify bindings and behavior.' }
  }
  const id = args.id ?? store.selected
  if (typeof id !== 'string') throw new Error('Expected widget id')
  const node = requireNode(doc, id)
  if (action === 'update' || action === 'reset') {
    store.assertIdle(); store.checkRevision(expectedRevision(args))
    if (inheritedFlag(doc, id, 'locked')) throw new Error('Unlock this layer before editing semantics')
    const existing = doc.semantics![id]
    if (action === 'reset') doc.semantics![id] = { id: existing.id, ...(existing.slot === undefined ? {} : { slot: existing.slot }) }
    else {
      const patch = args.semantics
      if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new Error('Expected a semantics patch')
      const next: Record<string, unknown> = { ...structuredClone(existing) }
      for (const [field, value] of Object.entries(patch)) {
        if (field === 'bindings' && value !== null && typeof value === 'object' && !Array.isArray(value)) {
          const bindings: Record<string, unknown> = { ...existing.bindings }
          for (const [key, binding] of Object.entries(value)) { if (binding === null) delete bindings[key]; else bindings[key] = binding }
          next.bindings = bindings
        } else if (value === null && field !== 'id') delete next[field]
        else next[field] = value
      }
      doc.semantics![id] = next as never
    }
    store.commit(doc, undefined, undefined, 'Edit semantics'); persist()
  } else if (action !== 'inspect') throw new Error('Unknown semantics action')
  return { widget_id: id, kind: node.kind, layer_name: node.name, semantics: resolvedSemantics(store.snapshot())[id], catalog: semanticCatalog(node.kind),
    revision: store.revision, compilerValidated: false, runtimeObserved: false }
}
