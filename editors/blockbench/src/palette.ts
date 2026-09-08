import { targetParent, hasKind } from '../../gui-builder/src/model/tree.ts'
import { current } from './host.ts'
import { call } from './api.ts'
import { iconButton, element } from './dom.ts'
import { CATEGORIES, componentPage } from './component-catalog.ts'
import { viewState } from './view-state.ts'
import { COMPONENT_MIME } from './canvas-drop.ts'

export const TITLES = {
gas: 'Gas tank', flame: 'Flame', button: 'Button', slider: 'Slider', checkbox: 'Checkbox', toggle: 'Toggle', radio: 'Radio', scrollbar: 'Scrollbar', tab: 'Tab', separator: 'Separator',   screen: 'Screen', row: 'Row', column: 'Column', slot: 'Slot', progress: 'Progress',
  energy: 'Energy', tank: 'Fluid tank', search: 'Search', player: 'Inventory',
}
export const ICONS = {gas: 'cloud', flame: 'local_fire_department', button: 'smart_button', slider: 'tune', checkbox: 'check_box', toggle: 'toggle_on', radio: 'radio_button_checked', scrollbar: 'swap_vert', tab: 'tab', separator: 'horizontal_rule',  screen: 'web_asset', row: 'view_column', column: 'view_agenda', slot: 'crop_square',
  progress: 'trending_flat', energy: 'bolt', tank: 'opacity', search: 'search', player: 'apps' }

type Controls = { search: HTMLInputElement; category: HTMLSelectElement; results: HTMLElement; pages: HTMLElement }
const controls = new WeakMap<HTMLElement, Controls>()
function mount(root: HTMLElement): Controls {
  const filters = element('div', 'butter-library-filters'), search = element('input')
  search.type = 'search'; search.placeholder = 'Search components…'; search.maxLength = 100
  search.setAttribute('aria-label', 'Search components')
  search.oninput = () => call('view', { component_search: search.value })
  const clear = iconButton('close', 'Clear component search', () => { call('view', { component_search: '' }); search.focus() })
  const category = element('select'); category.setAttribute('aria-label', 'Component category')
  const all = element('option', '', 'All categories'); all.value = 'all'; category.append(all)
  CATEGORIES.forEach(c => { const option = element('option', '', c.title); option.value = c.id; category.append(option) })
  category.onchange = () => call('view', { component_category: category.value })
  filters.append(search, clear, category)
  const results = element('div', 'butter-library-results'), pages = element('div', 'butter-library-pages')
  results.setAttribute('aria-label', 'Matching components'); pages.setAttribute('aria-live', 'polite')
  root.replaceChildren(filters, results, pages)
  const value = { search, category, results, pages }; controls.set(root, value); return value
}
export function renderPalette(root: HTMLElement) {
  const ui = controls.get(root) ?? mount(root), view = viewState(), doc = current().snapshot()
  if (ui.search.value !== view.component_search) ui.search.value = view.component_search
  ui.category.value = view.component_category
  const result = componentPage(view.component_search, view.component_category, view.component_page)
  ui.results.replaceChildren()
  for (const category of CATEGORIES) {
    const entries = result.items.filter(item => item.category === category.id)
    if (!entries.length) continue
    const grid = element('div', 'butter-palette')
    grid.setAttribute('role', 'group'); grid.setAttribute('aria-label', category.title)
    for (const entry of entries) {
      const add = iconButton(entry.icon, `Add ${entry.title}`, () => {
        const store = current(), tree = store.snapshot().root
        const parent = entry.kind === 'player' ? tree : targetParent(tree, store.selected)
        call('add', { kind: entry.kind, parent_id: parent.id })
      }, entry.title)
      add.disabled = entry.kind === 'player' && hasKind(doc.root, 'player'); grid.append(add)
      add.draggable = !add.disabled
      add.ondragstart = event => { event.dataTransfer?.setData(COMPONENT_MIME, entry.kind); if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy' }
    }
    ui.results.append(element('h3', 'butter-library-heading', category.title), grid)
  }
  if (!result.total) ui.results.append(element('p', 'butter-library-empty', 'No components found'))
  const previous = iconButton('chevron_left', 'Previous component page', () => call('view', { component_page: result.page - 1 }))
  const next = iconButton('chevron_right', 'Next component page', () => call('view', { component_page: result.page + 1 }))
  previous.disabled = result.page === 1; next.disabled = result.page === result.pages
  previous.hidden = next.hidden = result.pages === 1
  ui.pages.replaceChildren(previous, element('span', 'butter-library-count', result.pages > 1 ? `${result.page} / ${result.pages} · ${result.total} components` : `${result.total} components`), next)
}
