import { findById, parentOf } from '../../gui-builder/src/model/tree.ts'
import { GROUP_KINDS, type Widget } from '../../gui-builder/src/model/types.ts'
import { selectionBounds, editableRoots, inheritedFlag } from './selection.ts'
import { current } from './host.ts'
import { call } from './api.ts'
import { iconButton, element, label, attempt, button } from './dom.ts'
import { TITLES } from './palette.ts'
import { alignmentControls } from './alignment-controls.ts'
import { contextMenu } from './context-menu.ts'
import { propertiesInspector } from './properties-inspector.ts'
import { semanticsInspector } from './semantics-inspector.ts'
import { definition } from './library/document.ts'

export function renderInspector(root: HTMLElement) {
  root.replaceChildren()
  const store = current(), doc = store.snapshot(), ids = store.selection, nodes = ids.map(id => findById(doc.root, id)!)
  if (!ids.length) {
    root.append(element('h3', 'butter-title', 'No selection'), button('Select all', () => call('select', { mode: 'all' })))
    return
  }
  const selected = nodes.length === 1 ? nodes[0] : undefined, screen = selected?.kind === 'screen'
  root.append(element('h3', 'butter-title', selected ? definition(doc,selected.id)?.title??TITLES[selected.kind] : `${ids.length} layers selected`))
  let editable = false
  try { editableRoots(doc, ids); editable = true } catch {}
  if (selected) {
    const input = element('input'); input.value = selected.name; input.maxLength = 100; input.setAttribute('aria-label', 'Layer name')
    input.disabled = selected.kind === 'player' || inheritedFlag(doc, selected.id, 'locked')
    input.onchange = () => attempt(() => call('update', { id: selected.id, name: input.value }))
    root.append(label('Name', input))
  }
  const box = screen ? { x: 0, y: 0, w: 176, h: 166 } : selectionBounds(doc, ids)
  if (box) {
    root.append(element('p', 'butter-metrics', `${box.w} × ${box.h} px`))
    if (!screen) {
      const coordinates = element('div', 'butter-coordinates')
      for (const axis of ['x', 'y'] as const) {
        const field = element('input'); field.type = 'number'; field.step = '1'; field.value = String(box[axis]); field.disabled = !editable
        field.setAttribute('aria-label', `Selection ${axis.toUpperCase()}`)
        field.onchange = () => attempt(() => call('position', { ids, x: box.x, y: box.y, [axis]: Number(field.value) }))
        coordinates.append(label(axis.toUpperCase(), field))
      }
      root.append(coordinates)
    }
  }
  const flags = element('div', 'butter-distribute-grid')
  for (const [flag, onIcon, offIcon, onAction, offAction] of [
    ['hidden', 'visibility_off', 'visibility', 'hide', 'show'], ['locked', 'lock', 'lock_open', 'lock', 'unlock'],
  ] as const) {
    const active = ids.every(id => inheritedFlag(doc, id, flag)), own = ids.some(id => doc[flag]?.includes(id))
    const control = iconButton(active ? onIcon : offIcon, active ? `${offAction} selection` : `${onAction} selection`,
      () => call('edit', { action: active ? offAction : onAction }))
    control.setAttribute('aria-pressed', String(active)); control.disabled = active && !own
    if (control.disabled) control.title = `${flag === 'hidden' ? 'Hidden' : 'Locked'} by parent group`
    flags.append(control)
  }
  root.append(flags)
  if (screen) { root.append(semanticsInspector(selected!)); return }
  const parents = element('select'); parents.setAttribute('aria-label', 'Parent layer'); parents.disabled = !editable
  function option(node: Widget) {
    if (!GROUP_KINDS.has(node.kind) || nodes.some(selected => !!findById(selected, node.id))) return
    if (!nodes.some(node => node.kind === 'player') || node === doc.root) {
      const item = element('option', '', node.name); item.value = node.id; item.disabled = inheritedFlag(doc, node.id, 'locked'); parents.append(item)
    }
    node.children.forEach(option)
  }
  option(doc.root)
  const parentIds = [...new Set(ids.map(id => parentOf(doc.root, id)?.id))]
  if (parentIds.length === 1) parents.value = parentIds[0] ?? ''
  else { const mixed = element('option', '', 'Multiple parents'); mixed.value = ''; mixed.disabled = true; parents.prepend(mixed); parents.value = '' }
  parents.onchange = () => attempt(() => call('move', { ids, parent_id: parents.value }))
  root.append(label('Parent layer', parents), alignmentControls(editable && !!box, ids.length))
  const controls = element('div', 'butter-controls')
  const clone = iconButton('content_copy', 'Duplicate selection · Ctrl D', () => call('edit', { action: 'duplicate' }))
  clone.disabled = !editable || nodes.some(node => node.kind === 'player')
  const group = iconButton('folder', 'Group selection · Ctrl G', () => call('edit', { action: 'group' }))
  group.disabled = clone.disabled
  const remove = iconButton('delete', 'Delete selection · Del', () => call('edit', { action: 'delete' })); remove.disabled = !editable
  const more = iconButton('more_horiz', 'More selection actions', () => contextMenu(more))
  controls.append(clone, group, remove, more); root.append(controls)
  if (selected) root.append(propertiesInspector(selected), semanticsInspector(selected))
}
