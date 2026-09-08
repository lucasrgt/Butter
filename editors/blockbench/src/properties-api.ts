import { current, persist, refresh } from './host.ts'
import { requireNode } from './operations.ts'
import { inheritedFlag } from './selection.ts'
import { expectedRevision } from './editor-args.ts'
import { freezePositions } from './position.ts'
import { componentVariants, componentFields, previewFields, values } from './component-properties.ts'
import { definition, resolvedComponent } from './library/document.ts'

export function propertiesCall(args: Record<string, unknown>) {
  const store = current(), doc = store.snapshot(), id = args.id ?? store.selected
  if (typeof id !== 'string') throw new Error('Expected widget id')
  const node = requireNode(doc, id), action = args.action ?? 'inspect', section = args.section ?? 'components'
  if (section !== 'components' && section !== 'preview') throw new Error('Expected components or preview section')
  if (!componentVariants(node.kind).length) throw new Error('Select a component to configure')
  if (action !== 'inspect') {
    if (!['update', 'reset', 'begin', 'finish', 'cancel'].includes(String(action))) throw new Error('Unknown properties action')
    store.checkRevision(expectedRevision(args))
    if (store.gesturing && (store.inspect().gesture !== 'Adjust preview' || section !== 'preview')) throw new Error('Finish the current gesture first')
    if (inheritedFlag(doc, id, 'locked')) throw new Error('Unlock this layer before editing properties')
    if (action === 'begin') { store.beginGesture('Adjust preview'); return { gesture: true } }
    if (action === 'finish' || action === 'cancel') {
      if (action === 'finish') store.commitGesture(); else store.cancelGesture()
      persist()
    } else {
      if (section === 'components') freezePositions(doc)
      doc[section] ??= {}
      if (action === 'reset') delete doc[section]![id]
      else {
        const patch = args.patch
        if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new Error('Expected properties patch')
        const next: Record<string, unknown> = { ...doc[section]![id] }
        for (const [key, value] of Object.entries(patch)) {
          if (value === null) delete next[key]
          else if (section === 'components' && key === 'props') {
            if (typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected props object')
            const props = { ...(next.props as object) } as Record<string, unknown>
            for (const [name, property] of Object.entries(value)) { if (property === null) delete props[name]; else props[name] = property }
            next.props = props
          } else next[key] = value
        }
        doc[section]![id] = next as never
      }
      if (store.gesturing) { store.updateGesture(doc); refresh() }
      else { store.commit(doc, undefined, undefined, section === 'preview' ? 'Adjust preview' : 'Edit component'); persist() }
    }
  }
  const result = store.snapshot()
  const def=definition(result,id),resolved=resolvedComponent(result,id)
  return { widget_id: id, kind: node.kind, component: result.components?.[id] ?? {}, resolved_props:resolved.props,preview: values(previewFields(node.kind), resolved.preview),
    variants: componentVariants(node.kind,def), properties: componentFields(node.kind,def), preview_properties: previewFields(node.kind),
    revision: store.revision, preview_only: true }
}
