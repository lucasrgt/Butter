import { GROUP_KINDS, type Widget } from '../../gui-builder/src/model/types.ts'
import { current } from './host.ts'
import { call } from './api.ts'
import { button, element, iconButton, attempt } from './dom.ts'
import { TITLES, ICONS } from './palette.ts'
import { viewState } from './view-state.ts'
import { inheritedFlag } from './selection.ts'
import { contextMenu } from './context-menu.ts'
import { layerDrag } from './layer-drag.ts'

type Controls = { input: HTMLInputElement; tree: HTMLElement; project: string }
const controls = new WeakMap<HTMLElement, Controls>()
function mount(root: HTMLElement) {
  const input = element('input'); input.type = 'search'; input.placeholder = 'Find layers…'; input.maxLength = 100
  input.setAttribute('aria-label', 'Find layers'); input.oninput = () => call('view', { layer_search: input.value })
  const bar = element('div', 'butter-layer-tools')
  bar.append(input, iconButton('unfold_more', 'Expand all groups', () => call('tree', { action: 'expand_all' })),
    iconButton('unfold_less', 'Collapse all groups', () => call('tree', { action: 'collapse_all' })))
  const tree = element('div', 'butter-layers'); tree.setAttribute('role', 'tree'); tree.setAttribute('aria-multiselectable', 'true')
  root.replaceChildren(bar, tree)
  const value = { input, tree, project: Project!.uuid }; controls.set(root, value); return value
}
export function renderLayers(root: HTMLElement) {
  if (!Project) return
  const ui = controls.get(root) ?? mount(root), store = current(), doc = store.snapshot(), view = viewState()
  if (ui.project !== Project.uuid) { delete root.dataset.dragging; ui.project = Project.uuid }
  if (ui.input.value !== view.layer_search) ui.input.value = view.layer_search
  if (root.dataset.dragging) return
  ui.tree.replaceChildren()
  const query = view.layer_search.trim().toLocaleLowerCase(), collapsed = new Set(view.collapsed_ids)
  const matches = (node: Widget): boolean => `${node.name} ${node.kind}`.toLocaleLowerCase().includes(query) || node.children.some(matches)
  function visit(node: Widget, depth: number) {
    if (query && !matches(node)) return
    const group = GROUP_KINDS.has(node.kind), expanded = !!query || !collapsed.has(node.id)
    const row = element('div', 'butter-layer'); row.dataset.id = node.id
    row.style.paddingLeft = `${depth * 12}px`; row.classList.toggle('selected', store.selection.includes(node.id))
    row.setAttribute('role', 'treeitem'); row.setAttribute('aria-selected', String(store.selection.includes(node.id)))
    row.setAttribute('aria-level', String(depth + 1)); if (group) row.setAttribute('aria-expanded', String(expanded))
    const fold = group ? iconButton(expanded ? 'expand_more' : 'chevron_right', expanded ? `Collapse ${node.name}` : `Expand ${node.name}`,
      () => call('tree', { action: 'toggle', ids: [node.id] })) : element('span', 'butter-fold-spacer')
    if (group) fold.classList.add('butter-fold')
    const select = button(node.name, () => {}, `${TITLES[node.kind]}: ${node.name}`)
    select.onclick = event => attempt(() => call('select', { id: node.id, mode: event.shiftKey ? 'toggle' : 'replace' }))
    select.classList.add('butter-layer-name')
    const ownHidden = doc.hidden.includes(node.id), hidden = inheritedFlag(doc, node.id, 'hidden')
    const ownLock = doc.locked?.includes(node.id), locked = inheritedFlag(doc, node.id, 'locked')
    row.classList.toggle('muted', hidden)
    const visibility = iconButton(hidden ? 'visibility_off' : 'visibility', hidden && !ownHidden ? 'Hidden by parent' : ownHidden ? 'Show layer' : 'Hide layer',
      () => call('update', { id: node.id, hidden: !ownHidden }))
    const lock = iconButton(locked ? 'lock' : 'lock_open', locked && !ownLock ? 'Locked by parent' : ownLock ? 'Unlock layer' : 'Lock layer',
      () => call('update', { id: node.id, locked: !ownLock }))
    lock.disabled = locked && !ownLock
    row.append(fold, element('i', 'material-icons butter-kind', ICONS[node.kind]), select, lock, visibility)
    row.oncontextmenu = event => {
      event.preventDefault(); if (!store.selection.includes(node.id)) call('select', { id: node.id }); contextMenu(event)
    }
    layerDrag(row, node, root, () => renderLayers(root)); ui.tree.append(row)
    if (group && expanded) node.children.forEach(child => visit(child, depth + 1))
  }
  visit(doc.root, 0)
  if (!ui.tree.children.length) ui.tree.append(element('p', 'butter-library-empty', 'No layers found'))
}
