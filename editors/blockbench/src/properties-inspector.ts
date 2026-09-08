import type { Widget } from '../../gui-builder/src/model/types.ts'
import { current } from './host.ts'
import { call } from './api.ts'
import { element, label, button, attempt } from './dom.ts'
import { inheritedFlag } from './selection.ts'
import { componentVariants, componentFields, previewFields, values, type Field, type PropertyValue } from './component-properties.ts'
import { definition, resolvedComponent } from './library/document.ts'
import { instanceInspector } from './library/inspector.ts'

const open = new Map<string, boolean>()
function update(id: string, section: string, patch: object) { call('properties', { action: 'update', id, section, patch }) }
function input(field: Field, value: PropertyValue, change: (value: PropertyValue) => void, prefix: string, disabled: boolean) {
  const control = field.type === 'select' ? element('select') : element('input')
  if (control instanceof HTMLSelectElement) for (const choice of field.options!) {
    const custom = ['oil', 'honey', 'steam', 'chlorine'].includes(choice) ? ' (test tint)' : ''
    const option = element('option', '', choice[0].toUpperCase() + choice.slice(1).replaceAll('_', ' ') + custom); option.value = choice; control.append(option)
  } else {
    control.type = field.type === 'boolean' ? 'checkbox' : field.type === 'color' ? 'color' : field.type === 'number' ? 'number' : 'text'
    if (field.type === 'number') { control.min = String(field.min); control.max = String(field.max); control.step = '1' }
    if (field.type === 'boolean') control.checked = Boolean(value)
  }
  control.value = String(value); control.disabled = disabled; control.setAttribute('aria-label', `${prefix} ${field.label}`)
  control.onchange = () => attempt(() => change(field.type === 'boolean' ? (control as HTMLInputElement).checked : field.type === 'number' ? Number(control.value) : control.value))
  return label(field.label, control)
}
export function propertiesInspector(node: Widget) {
  const root = element('div', 'butter-component-properties'), doc = current().snapshot(), def=definition(doc,node.id),resolved=resolvedComponent(doc,node.id),variants = componentVariants(node.kind,def)
  if (!variants.length) return root
  const disabled = inheritedFlag(doc, node.id, 'locked'), config = doc.components?.[node.id]
  root.append(element('h3', 'butter-title', 'Component'))
  if(def)root.append(instanceInspector(node.id))
  if (variants.length > 1) {
    const select = element('select'); select.setAttribute('aria-label', 'Component variant'); select.disabled = disabled
    for (const variant of variants) { const option = element('option', '', `${variant.title} · ${variant.w} × ${variant.h}`); option.value = variant.id; select.append(option) }
    select.value = config?.variant ?? variants[0].id
    select.onchange = () => attempt(() => update(node.id, 'components', { variant: select.value }))
    root.append(label('Variant', select))
  }
  const props = values(componentFields(node.kind,def), resolved.props)
  for (const field of componentFields(node.kind,def)) root.append(input(field, props[field.key], value => update(node.id, 'components', { props: { [field.key]: value } }), 'Property', disabled))
  const details = element('details', 'butter-preview-details'), key = `${Project?.uuid ?? 'none'}:${node.id}`
  details.open = open.get(key) ?? true
  details.ontoggle = () => open.set(key, details.open)
  details.append(element('summary', '', 'Visual test'), element('p', 'butter-metrics', 'This instance only · saved with the editor document'))
  const fields = previewFields(node.kind), state = values(fields, resolved.preview)
  for (const field of fields) {
    if (field.key === 'color' && state.substance !== 'custom') continue
    if (field.key === 'level') {
      const row = element('div', 'butter-preview-level'), range = element('input'), output = element('output', '', `${state.level}%`)
      range.type = 'range'; range.min = '0'; range.max = '100'; range.step = '1'; range.value = String(state.level); range.disabled = disabled
      range.setAttribute('aria-label', `Preview ${field.label}`)
      // Keep this input mounted while dragging; the preview canvas repaints directly.
      range.oninput = () => attempt(() => {
        if (!current().gesturing) call('properties', { id: node.id, action: 'begin', section: 'preview' })
        update(node.id, 'preview', { level: Number(range.value) }); output.value = `${range.value}%`
      })
      range.onkeydown = event => { if (event.key === 'Escape' && current().gesturing) { event.preventDefault(); event.stopPropagation(); call('properties', { id: node.id, action: 'cancel', section: 'preview' }) } }
      range.onchange = range.onblur = () => attempt(() => { if (current().gesturing) call('properties', { id: node.id, action: 'finish', section: 'preview' }) })
      row.append(range, output); details.append(label(field.label, row))
      const presets = element('div', 'butter-preview-presets')
      for (const amount of [0, 25, 50, 75, 100]) { const preset = button(`${amount}%`, () => update(node.id, 'preview', { level: amount })); preset.disabled = disabled; presets.append(preset) }
      details.append(presets)
    } else details.append(input(field, state[field.key], value => update(node.id, 'preview', { [field.key]: value }), 'Preview', disabled))
  }
  const reset = button('Reset visual test', () => call('properties', { id: node.id, section: 'preview', action: 'reset' })); reset.disabled = disabled
  details.append(reset); root.append(details); return root
}
