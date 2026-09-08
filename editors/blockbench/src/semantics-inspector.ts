import { element, label, button, attempt } from './dom.ts'
import { call } from './api.ts'
import { viewState, rememberBindings } from './view-state.ts'
import { current } from './host.ts'
import { inheritedFlag } from './selection.ts'
import { semanticCatalog, type SemanticConfig } from './semantics-catalog.ts'
import type { Widget } from '../../gui-builder/src/model/types.ts'
import { resolvedSemantics, definition } from './library/document.ts'
import { semanticFields } from './library/semantic-fields.ts'

export function semanticsInspector(node: Widget) {
  const store = current(), doc = store.snapshot(), config = resolvedSemantics(doc)[node.id], catalog = semanticCatalog(node.kind)
  const root = element('section', 'butter-semantics'), locked = inheritedFlag(doc, node.id, 'locked')
  const heading = element('div', 'butter-semantics-heading')
  heading.append(element('h3', 'butter-title', 'Semantics'), button('Tree', () => call('semantic_tree')))
  root.append(heading)
  const update = (patch: Record<string, unknown>) => call('semantics', { action: 'update', id: node.id, semantics: patch })
  const textField = (title: string, key: keyof SemanticConfig, value: string, hint: string, max = 200) => {
    const input = element('input'); input.type = 'text'; input.value = value; input.maxLength = max; input.disabled = locked
    input.setAttribute('aria-label', `Semantics ${title}`); input.title = hint
    input.onchange = () => attempt(() => update({ [key]: key === 'id' ? input.value : input.value || null }))
    root.append(label(title, input)); return input
  }
  textField('ID', 'id', config.id, 'Stable automation identity. Renaming the layer does not change it.', 100)
  const roles = element('select'); roles.setAttribute('aria-label', 'Semantics Role'); roles.disabled = locked
  const auto = element('option', '', `Auto · ${catalog.roles[0]}`); auto.value = ''; roles.append(auto)
  for (const role of catalog.roles) { const option = element('option', '', role); option.value = role; roles.append(option) }
  roles.value = config.role ?? ''; roles.onchange = () => attempt(() => update({ role: roles.value || null }))
  root.append(label('Role', roles))
  textField('Label', 'label', config.label ?? '', `Default: ${node.name}`).placeholder = node.name
  textField('Description', 'description', config.description ?? '', 'Semantic description for test inspection.', 500)
  if (catalog.region) {
    const toggle = button(config.region ? 'Region exposed' : 'Expose region', () => update({ region: !config.region }))
    toggle.setAttribute('aria-pressed', String(!!config.region)); toggle.disabled = locked
    toggle.title = 'Expose this group in the semantic tree. Its children retain their own identities.'; root.append(toggle)
  }
  for (const [visible, title, key, value, max] of [
    [catalog.slot_binding, node.kind === 'player' ? 'First container slot' : 'Container slot', 'slot', config.slot, 4095],
    [catalog.tab_order, 'Tab order', 'tab_index', config.tab_index, 511],
  ] as const) if (visible) {
    const input = element('input'); input.type = 'number'; input.min = '0'; input.max = String(max); input.step = '1'
    input.value = value === undefined ? '' : String(value); input.disabled = locked; input.placeholder = 'Automatic'
    input.setAttribute('aria-label', `Semantics ${title}`); input.onchange = () => attempt(() => update({ [key]: input.value === '' ? null : Number(input.value) }))
    root.append(label(title, input))
  }
  const details = element('details', 'butter-binding-details'), summary = element('summary', '', 'Bindings and actions')
  details.open = viewState().semantics_bindings_open
  details.ontoggle = () => rememberBindings(details.open)
  details.append(summary)
  for (const { field, type } of catalog.bindings) {
    const input = element('input'); input.value = config.bindings?.[field] ?? ''; input.placeholder = `${type} backing symbol`
    input.placeholder=definition(doc,node.id)?.binding_hints?.[field]??input.placeholder
    input.maxLength = 120; input.disabled = locked; input.setAttribute('aria-label', `Binding ${field}`)
    input.title = `Java ${type} field, signal or getter. Evaluated by the runtime.`
    input.onchange = () => attempt(() => update({ bindings: { [field]: input.value || null } }))
    details.append(label(field, input))
  }
  if (catalog.click_handler) {
    const input = element('input'); input.value = config.action ?? ''; input.placeholder = '@ButterAction method'; input.maxLength = 100; input.disabled = locked
    input.setAttribute('aria-label', 'Click handler'); input.onchange = () => attempt(() => update({ action: input.value || null }))
    details.append(label('Click handler', input))
  }
  details.append(element('p', 'butter-asset-status', catalog.actions.length ? `Actions: ${catalog.actions.join(', ')}` : 'Read-only semantic node'))
  root.append(details)
  root.append(semanticFields(config,locked,update))
  return root
}
