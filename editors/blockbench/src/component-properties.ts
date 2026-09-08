import { LEAF_SIZE, PALETTE, type Kind, type Widget } from '../../gui-builder/src/model/types.ts'
import type { ComponentDefinition } from './library/types.ts'

export type PropertyValue = string | number | boolean
export type PropertyValues = Record<string, PropertyValue>
export interface ComponentConfig { variant?: string; props?: PropertyValues }
export interface Field { key: string; label: string; type: 'number' | 'text' | 'boolean' | 'color' | 'select'; default: PropertyValue; min?: number; max?: number; options?: string[] }
export interface Variant { id: string; title: string; w: number; h: number }
const variant = (id: string, title: string, w: number, h: number): Variant => ({ id, title, w, h })
const variants: Partial<Record<Kind, Variant[]>> = {
  tank: [variant('big', 'Big', 18, 54), variant('small', 'Small', 18, 18), variant('wide', 'Wide', 36, 54)],
  gas: [variant('big', 'Big', 18, 54), variant('small', 'Small', 18, 18), variant('wide', 'Wide', 36, 54)],
  slot: [variant('normal', 'Normal', 18, 18), variant('big', 'Big', 26, 26)],
  energy: [variant('tall', 'Tall', 8, 54), variant('small', 'Small', 8, 18), variant('wide', 'Wide', 18, 54)],
  progress: [variant('arrow', 'Arrow', 24, 17), variant('bar', 'Bar', 54, 8)],
  search: [variant('normal', 'Normal', 88, 12), variant('compact', 'Compact', 54, 12), variant('wide', 'Wide', 140, 12)],
  button: [variant('normal', 'Normal', 60, 20), variant('small', 'Small', 40, 16), variant('wide', 'Wide', 100, 20)],
  slider: [variant('normal', 'Normal', 88, 12), variant('compact', 'Compact', 44, 12)],
  scrollbar: [variant('normal', 'Normal', 6, 54), variant('wide', 'Wide', 12, 54), variant('short', 'Short', 6, 27)],
  tab: [variant('normal', 'Normal', 28, 20), variant('wide', 'Wide', 54, 20)],
  separator: [variant('normal', 'Normal', 88, 2), variant('short', 'Short', 44, 2)],
}
const bool = (key: string, label: string, value = false): Field => ({ key, label, type: 'boolean', default: value })
const num = (key: string, label: string, value: number, max = 1000000): Field => ({ key, label, type: 'number', default: value, min: 0, max })
const text = (key: string, label: string, value = ''): Field => ({ key, label, type: 'text', default: value })
export const GAUGES = ['tank', 'gas', 'energy', 'progress', 'flame', 'slider', 'scrollbar']
export const BOOLEANS = ['checkbox', 'toggle', 'radio']
export const SUBSTANCES = {
  water: '#3344ff', heavy_water: '#1a237e', lava: '#ff6600', oil: '#403932', honey: '#d89c30',
  steam: '#d7e8ec', oxygen: '#ff8888', hydrogen: '#88bbff', ozone: '#99ddff', chlorine: '#bed25b', custom: '#7799bb',
}
export function componentVariants(kind: Kind, definition?: ComponentDefinition): Variant[] {
  if (definition) return definition.variants
  if(!PALETTE.includes(kind))return []
  const size = LEAF_SIZE[kind as keyof typeof LEAF_SIZE]
  return variants[kind] ?? (size ? [variant('normal', 'Normal', size.w, size.h)] : [])
}
export function componentFields(kind: Kind, definition?: ComponentDefinition): Field[] {
  if (definition) return [...componentFields(kind), ...definition.fields ?? []]
  if (GAUGES.includes(kind)) return [num('max', 'Capacity / maximum', 100)]
  if (kind === 'search') return [text('placeholder', 'Placeholder', 'Search...')]
  if (kind === 'button' || kind === 'tab') return [text('text', 'Text', kind === 'button' ? 'Button' : 'Tab')]
  return []
}
export function previewFields(kind: Kind): Field[] {
  if (!componentVariants(kind).length) return []
  const fields: Field[] = []
  if (GAUGES.includes(kind)) fields.push(num('level', 'Level (%)', kind === 'energy' ? 70 : 0, 100))
  if (kind === 'tank' || kind === 'gas') fields.push({ key: 'substance', label: kind === 'gas' ? 'Gas' : 'Fluid', type: 'select',
    default: kind === 'gas' ? 'oxygen' : 'water', options: kind === 'gas' ? ['oxygen', 'hydrogen', 'ozone', 'steam', 'chlorine', 'custom'] : ['water', 'heavy_water', 'lava', 'oil', 'honey', 'custom'] },
    { key: 'color', label: 'Custom color', type: 'color', default: '#7799bb' }, bool('graduations', 'Graduations', true), bool('animated', 'Animate texture', true))
  if (BOOLEANS.includes(kind) || kind === 'tab') fields.push(bool('checked', kind === 'tab' ? 'Selected' : 'Checked'))
  if (kind === 'slot') fields.push({ key: 'sample', label: 'Sample item', type: 'select', default: 'empty', options: ['empty', 'ingot', 'crystal', 'dust'] }, num('count', 'Item count', 1, 64))
  if (kind === 'search') fields.push(text('text', 'Test text'), bool('focused', 'Focused'))
  if (['button', 'tab'].includes(kind)) fields.push(bool('pressed', 'Pressed'))
  fields.push(bool('enabled', 'Enabled', true), bool('hovered', 'Hovered'))
  return fields
}
export function values(fields: Field[], overrides?: PropertyValues): PropertyValues {
  return { ...Object.fromEntries(fields.map(field => [field.key, field.default])), ...overrides }
}
export function readValues(fields: Field[], raw: unknown): PropertyValues {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Properties must be an object')
  const result: PropertyValues = {}
  for (const [key, value] of Object.entries(raw)) {
    const field = fields.find(field => field.key === key)
    if (!field) throw new Error(`Unsupported component property: ${key}`)
    if (field.type === 'number' ? typeof value !== 'number' || !Number.isFinite(value) || value < field.min! || value > field.max! || !Number.isInteger(value)
      : field.type === 'boolean' ? typeof value !== 'boolean'
      : typeof value !== 'string' || value.length > 200 || /[\x00-\x1f]/.test(value)
        || (field.type === 'color' && !/^#[0-9a-f]{6}$/i.test(value)) || (field.type === 'select' && !field.options!.includes(value))) {
      throw new Error(`Invalid component property: ${key}`)
    }
    result[key] = value as PropertyValue
  }
  return result
}
export function readComponentMaps(root: Widget, components: unknown, preview: unknown, definitions: Record<string,ComponentDefinition> = {}) {
  const nodes = new Map<string, Widget>(), visit = (node: Widget) => { nodes.set(node.id, node); node.children.forEach(visit) }; visit(root)
  const result: { components: Record<string, ComponentConfig>; preview: Record<string, PropertyValues> } = { components: {}, preview: {} }
  for (const [section, raw] of [['components', components], ['preview', preview]] as const) {
    if (raw === undefined) continue
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error(`Invalid ${section} map`)
    for (const [id, config] of Object.entries(raw)) {
      const node = nodes.get(id)
      if (!node || !componentVariants(node.kind).length) throw new Error(`Invalid component reference: ${id}`)
      if (section === 'preview') { result.preview[id] = readValues(previewFields(node.kind), config); continue }
      if (!config || typeof config !== 'object' || Array.isArray(config) || Object.keys(config).some(key => !['variant', 'props'].includes(key))) throw new Error('Invalid component configuration')
      const value = config as ComponentConfig, next: ComponentConfig = {}
      if (value.variant !== undefined) {
        if (!componentVariants(node.kind,definitions[id]).some(v => v.id === value.variant)) throw new Error(`Invalid variant for ${node.kind}`)
        next.variant = value.variant
      }
      if (value.props !== undefined) next.props = readValues(componentFields(node.kind,definitions[id]), value.props)
      result.components[id] = next
    }
  }
  return result
}
export function componentSize(kind: Kind, config?: ComponentConfig, definition?:ComponentDefinition) {
  const list = componentVariants(kind,definition)
  return list.find(item => item.id === config?.variant) ?? list[0]
}
