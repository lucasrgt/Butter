import { targetParent, hasKind } from '../../gui-builder/src/model/tree.ts'
import { current } from './host.ts'
import { call } from './api.ts'
import { iconButton, element } from './dom.ts'
import { componentCategories, componentPage, allComponents } from './component-catalog.ts'
import { viewState } from './view-state.ts'
import { COMPONENT_MIME, LIBRARY_MIME } from './canvas-drop.ts'
import { library } from './library/registry.ts'
import { showLibrary } from './library/manager.ts'
import { thumbnail } from './library/thumbnail.ts'

export const TITLES = {
gas: 'Gas tank', flame: 'Flame', button: 'Button', slider: 'Slider', checkbox: 'Checkbox', toggle: 'Toggle', radio: 'Radio', scrollbar: 'Scrollbar', tab: 'Tab', separator: 'Separator',   screen: 'Screen', row: 'Row', column: 'Column', slot: 'Slot', progress: 'Progress',
  energy: 'Energy', tank: 'Fluid tank', search: 'Search', player: 'Inventory',
}
export const ICONS = {gas: 'cloud', flame: 'local_fire_department', button: 'smart_button', slider: 'tune', checkbox: 'check_box', toggle: 'toggle_on', radio: 'radio_button_checked', scrollbar: 'swap_vert', tab: 'tab', separator: 'horizontal_rule',  screen: 'web_asset', row: 'view_column', column: 'view_agenda', slot: 'crop_square',
  progress: 'trending_flat', energy: 'bolt', tank: 'opacity', search: 'search', player: 'apps' }

type Controls = { search: HTMLInputElement; category: HTMLSelectElement; pack:HTMLSelectElement; results: HTMLElement; pages: HTMLElement }
const controls = new WeakMap<HTMLElement, Controls>()
function mount(root: HTMLElement): Controls {
  const filters = element('div', 'butter-library-filters'), search = element('input')
  search.type = 'search'; search.placeholder = 'Search components…'; search.maxLength = 100
  search.setAttribute('aria-label', 'Search components')
  search.oninput = () => call('view', { component_search: search.value })
  const clear = iconButton('close', 'Clear component search', () => { call('view', { component_search: '' }); search.focus() })
  const category = element('select'); category.setAttribute('aria-label', 'Component category')
  category.onchange = () => call('view', { component_category: category.value })
  const pack=element('select');pack.setAttribute('aria-label','Component pack')
  pack.onchange=()=>call('view',{component_pack:pack.value})
  const manage=iconButton('inventory_2','Manage component packs',showLibrary,'Packs')
  filters.append(search, clear, pack,category,manage)
  const results = element('div', 'butter-library-results'), pages = element('div', 'butter-library-pages')
  results.setAttribute('aria-label', 'Matching components'); pages.setAttribute('aria-live', 'polite')
  root.replaceChildren(filters, results, pages)
  const value = { search, category, pack, results, pages }; controls.set(root, value); return value
}
export function renderPalette(root: HTMLElement) {
  const ui = controls.get(root) ?? mount(root), view = viewState(), doc = current().snapshot()
  if (ui.search.value !== view.component_search) ui.search.value = view.component_search
  const options=(select:HTMLSelectElement,entries:{id:string;title:string}[])=>{
    select.replaceChildren(...entries.map(e=>{const option=element('option','',e.title);option.value=e.id;return option}))
  }
  options(ui.category,[{id:'all',title:'All categories'},...componentCategories()])
  options(ui.pack,[{id:'all',title:'All packs'},{id:'builtin',title:'Built-in'},...library().list().filter(e=>e.enabled).map(e=>({id:`${e.pack.id}@${e.pack.version}`,title:`${e.pack.title} · ${e.pack.version}`}))])
  ui.category.value = view.component_category
  ui.pack.value=view.component_pack
  const result = componentPage(view.component_search, view.component_category, view.component_page,allComponents(view.component_pack))
  ui.results.replaceChildren()
  for (const category of componentCategories()) {
    const entries = result.items.filter(item => item.category === category.id)
    if (!entries.length) continue
    const grid = element('div', 'butter-palette')
    grid.setAttribute('role', 'group'); grid.setAttribute('aria-label', category.title)
    for (const entry of entries) {
      const add = iconButton(entry.icon, `Add ${entry.title}`, () => {
        const store = current(), tree = store.snapshot().root
        const parent = entry.kind === 'player' ? tree : targetParent(tree, store.selected)
        if(entry.pack)call('component',{action:'add',pack:entry.pack,component:entry.component,parent_id:parent.id})
        else call('add', { kind: entry.kind, parent_id: parent.id })
      }, entry.title)
      add.disabled = entry.kind === 'player' && hasKind(doc.root, 'player'); grid.append(add)
      if(entry.pack){add.classList.add('butter-custom-card');add.querySelector('i')?.replaceWith(thumbnail(entry));add.title=`${entry.title}\n${entry.pack}\n${entry.keywords}`}
      add.draggable = !add.disabled
      add.ondragstart = event => { event.dataTransfer?.setData(entry.pack?LIBRARY_MIME:COMPONENT_MIME,entry.pack?JSON.stringify({pack:entry.pack,component:entry.component}):entry.kind); if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy' }
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
