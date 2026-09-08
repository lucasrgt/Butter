import type { Widget } from '../../gui-builder/src/model/types.ts'
import { SEMANTIC_ROLES, bindingFields, canDeclareAction, canExposeRegion, type SemanticConfig } from './semantics-catalog.ts'
import { allocateSlots, freshSemanticId } from './semantics-slots.ts'

export const semanticWidgets = (root: Widget): Widget[] => [root, ...root.children.flatMap(semanticWidgets)]
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
function text(value: unknown, field: string, max: number, required = false): string {
  if (typeof value !== 'string' || value.length > max || /[\x00-\x1f\x7f]/.test(value) || (required && !value.trim())) throw new Error(`Invalid semantics ${field}`)
  return value
}
export function readSemanticConfig(node: Widget, value: unknown): SemanticConfig {
  if (!record(value)) throw new Error('Semantics must be an object')
  const allowed = ['id', 'role', 'label', 'description', 'region', 'slot', 'tab_index', 'bindings', 'action', 'capabilities', 'attributes']
  for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new Error(`Unknown semantics field: ${key}`)
  const result: SemanticConfig = { id: text(value.id, 'id', 100, true) }
  if (value.capabilities !== undefined) {
    if (!Array.isArray(value.capabilities) || value.capabilities.length>32 || value.capabilities.some(c=>typeof c!=='string'||c.length>100||!/^[a-z][a-z0-9_-]*(\.[a-z][a-z0-9_-]*)+$/.test(c))) throw Error('Capabilities require up to 32 namespaced identifiers')
    result.capabilities=[...new Set(value.capabilities)]
  }
  if (value.attributes !== undefined) {
    if(!record(value.attributes)||Object.keys(value.attributes).length>32)throw Error('Expected up to 32 semantic attributes')
    result.attributes={}
    for(const [key,v] of Object.entries(value.attributes)) {
      if(key.length>100||!/^[a-z][a-z0-9_-]*(\.[a-z][a-z0-9_-]*)+$/.test(key))throw Error('Custom semantic attributes require a namespace')
      result.attributes[key]=text(v,'attribute',200)
    }
  }
  if (value.role !== undefined) {
    if (typeof value.role !== 'string' || !SEMANTIC_ROLES[node.kind].includes(value.role)) throw new Error(`Role is incompatible with ${node.kind}`)
    result.role = value.role
  }
  for (const field of ['label', 'description'] as const) if (value[field] !== undefined) result[field] = text(value[field], field, field === 'label' ? 200 : 500)
  if (value.region !== undefined) {
    if (!canExposeRegion(node.kind) || typeof value.region !== 'boolean') throw new Error('Only groups and inventories can expose a semantic region')
    result.region = value.region
  }
  if (value.slot !== undefined) {
    if (!['slot', 'player'].includes(node.kind) || !Number.isInteger(value.slot)) throw new Error('Only slots or inventory can declare a container slot binding')
    result.slot = value.slot as number
  }
  if (value.tab_index !== undefined) {
    if (node.kind !== 'search' || !Number.isInteger(value.tab_index) || Number(value.tab_index) < 0 || Number(value.tab_index) > 511) throw new Error('Tab order requires a search field and an index from 0 to 511')
    result.tab_index = Number(value.tab_index)
  }
  if (value.bindings !== undefined) {
    if (!record(value.bindings)) throw new Error('Bindings must map fields to backing symbols')
    const bindings: SemanticConfig['bindings'] = {}
    for (const [field, path] of Object.entries(value.bindings)) {
      if (!bindingFields(node.kind).includes(field as never)) throw new Error(`Binding ${field} is incompatible with ${node.kind}`)
      if (typeof path !== 'string' || path.length > 120 || !/^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$/.test(path)) throw new Error(`Invalid backing symbol for ${field}`)
      Object.assign(bindings, { [field]: path })
    }
    if (Object.keys(bindings).length) result.bindings = bindings
  }
  if (value.action !== undefined) {
    if (!canDeclareAction(node.kind) || typeof value.action !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]{0,99}$/.test(value.action)) throw new Error('Click handlers require a supported control and a Java method name')
    result.action = value.action
  }
  return result
}
export function readSemantics(root: Widget, value: unknown): Record<string, SemanticConfig> {
  if (value !== undefined && !record(value)) throw new Error('Semantics must map widget ids to metadata')
  const raw = value as Record<string, unknown> | undefined, nodes = semanticWidgets(root), result: Record<string, SemanticConfig> = {}
  const ids = new Set(nodes.map(node => node.id)), used = new Set<string>(), tabs = new Set<number>()
  for (const id of Object.keys(raw ?? {})) if (!ids.has(id)) throw new Error(`Semantics references missing widget: ${id}`)
  for (const node of nodes) if (raw?.[node.id] !== undefined) {
    const config = readSemanticConfig(node, raw[node.id])
    if (used.has(config.id)) throw new Error(`Duplicate semantic ID: ${config.id}`)
    used.add(config.id); result[node.id] = config
    if (config.tab_index !== undefined) {
      if (tabs.has(config.tab_index)) throw new Error(`Duplicate tab index: ${config.tab_index}`)
      tabs.add(config.tab_index)
    }
  }
  for (const node of nodes) if (!result[node.id]) result[node.id] = { id: freshSemanticId(node.name, used) }
  for (const node of nodes.filter(node => node.kind === 'player')) {
    for (let index = 0; index < 36; index++) {
      const id = `${result[node.id].id}.${index}`
      if (used.has(id)) throw new Error(`Inventory semantic ID is reserved: ${id}`)
      used.add(id)
    }
  }
  allocateSlots(nodes, result)
  return result
}
