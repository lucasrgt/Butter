import type { Kind } from '../../gui-builder/src/model/types.ts'

export type BindingField = 'value' | 'max' | 'item' | 'count' | 'enabled' | 'visible' | 'readOnly'
export interface SemanticConfig {
  id: string
  role?: string
  label?: string
  description?: string
  region?: boolean
  slot?: number
  tab_index?: number
  bindings?: Partial<Record<BindingField, string>>
  action?: string
  capabilities?: string[]
  attributes?: Record<string,string>
}
export const SEMANTIC_ROLES: Record<Kind, readonly string[]> = {
gas: ['tank'], flame: ['flame'], button: ['button'], slider: ['slider'], checkbox: ['checkbox'], toggle: ['toggle'], radio: ['radio'], scrollbar: ['scrollbar'], tab: ['tab'], separator: ['separator'],   screen: ['screen'], row: ['group', 'region', 'panel', 'generic'], column: ['group', 'region', 'panel', 'generic'],
  slot: ['slot'], progress: ['progress'], energy: ['energy'], tank: ['tank'], search: ['search', 'textbox'], player: ['inventory'],
}
export const BINDING_TYPES: Record<BindingField, string> = {
  value: 'number', max: 'number', item: 'integer', count: 'integer', enabled: 'boolean', visible: 'boolean', readOnly: 'boolean',
}
export function bindingFields(kind: Kind): BindingField[] {
  const common: BindingField[] = ['enabled', 'visible']
  if (kind === 'search') return [...common, 'value', 'readOnly']
  if (['checkbox', 'toggle', 'radio'].includes(kind)) return [...common, 'value']
  if (kind === 'slot') return [...common, 'item', 'count']
  if (['progress', 'energy', 'tank', 'gas', 'flame', 'slider', 'scrollbar'].includes(kind)) return [...common, 'value', 'max']
  return common
}
export function bindingType(kind: Kind, field: BindingField) { return field === 'value' && kind === 'search' ? 'string' : field === 'value' && ['checkbox', 'toggle', 'radio'].includes(kind) ? 'boolean' : BINDING_TYPES[field] }
export function semanticActions(kind: Kind) {
  if (['slider', 'scrollbar'].includes(kind)) return ['click', 'set_value']
  if (['button', 'tab', 'checkbox', 'toggle', 'radio'].includes(kind)) return ['click']
  return kind === 'slot' ? ['click', 'right_click'] : kind === 'search' ? ['click', 'focus', 'type', 'backspace', 'tab'] : []
}
export const canDeclareAction = (kind: Kind) => ['slot', 'search', 'button', 'tab', 'slider', 'scrollbar', 'checkbox', 'toggle', 'radio'].includes(kind)
export const canExposeRegion = (kind: Kind) => ['row', 'column', 'player'].includes(kind)
export function semanticCatalog(kind: Kind) {
  return { roles: SEMANTIC_ROLES[kind], region: canExposeRegion(kind), bindings: bindingFields(kind).map(field => ({ field, type: bindingType(kind, field) })),
    actions: semanticActions(kind), click_handler: canDeclareAction(kind), slot_binding: kind === 'slot' || kind === 'player', tab_order: kind === 'search' }
}
