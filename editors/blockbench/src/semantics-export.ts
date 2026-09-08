import type { Widget } from '../../gui-builder/src/model/types.ts'
import type { ButterDocument } from './document.ts'
import { readSemantics, semanticWidgets } from './semantics-model.ts'
import { resolvedSemantics } from './library/document.ts'
import { SEMANTIC_ROLES, semanticActions, type SemanticConfig } from './semantics-catalog.ts'

export interface DeclaredSemanticNode {
  widget_id: string
  role: string
  name: string
  id: string
  index: number
  parent_id: string | null
  attributes: Record<string, string>
  bindings: SemanticConfig['bindings']
  actions: string[]
  action?: string
}
export function semanticTree(doc: ButterDocument) {
  const configs = resolvedSemantics(doc), nodes: DeclaredSemanticNode[] = []
  function visit(node: Widget, parent: string | null) {
    const config = configs[node.id], group = ['row', 'column', 'player'].includes(node.kind)
    const exposed = !group || config.region === true
    const attributes: Record<string, string> = { ...config.attributes, id: config.id, label: config.label ?? node.name }
    if(config.capabilities?.length)attributes.capabilities=config.capabilities.join(',')
    if (config.description) attributes.description = config.description
    if (config.tab_index !== undefined) attributes.tabIndex = String(config.tab_index)
    if (exposed) nodes.push({ widget_id: node.id, id: config.id, role: config.role ?? SEMANTIC_ROLES[node.kind][0], name: config.id,
      index: node.kind === 'slot' ? config.slot! : -1, parent_id: parent, attributes, bindings: config.bindings ?? {}, actions: semanticActions(node.kind),
      ...(config.action ? { action: config.action } : {}) })
    const nextParent = exposed ? config.id : parent
    if (node.kind === 'player') for (let index = 0; index < 36; index++) {
      const id = `${config.id}.${index}`
      nodes.push({ widget_id: node.id, id, name: id, role: 'slot', index: config.slot! + index, parent_id: nextParent,
        attributes: { id, label: `${config.label ?? 'Player inventory'} ${index + 1}` }, bindings: {}, actions: semanticActions('slot') })
    }
    node.children.forEach(child => visit(child, nextParent))
  }
  visit(doc.root, null)
  return { schema: 'butter.semantics.v1', screen: configs[doc.root.id].id, nodes,
    bindings: semanticWidgets(doc.root).flatMap(node => Object.entries(configs[node.id].bindings ?? {}).map(([field, symbol]) => ({ widget_id: node.id, id: configs[node.id].id, field, symbol }))),
    compilerValidated: false, runtimeObserved: false }
}
export function semanticSpec(doc: ButterDocument) {
  const tree = semanticTree(doc)
  return { screen: tree.screen, nodes: tree.nodes.map(node => ({ role: node.role, name: node.name, index: node.index, attributes: node.attributes })) }
}
