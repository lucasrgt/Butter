import { targetParent, hasKind } from '../../gui-builder/src/model/tree.ts'
import { current } from './host.ts'
import { call } from './api.ts'
import { iconButton, element } from './dom.ts'
import { componentCategories, matchingComponents, allComponents } from './component-catalog.ts'
import { viewState } from './view-state.ts'
import { COMPONENT_MIME, LIBRARY_MIME } from './canvas-drop.ts'
import { library } from './library/registry.ts'
import { showLibrary } from './library/manager.ts'
import { thumbnail } from './library/thumbnail.ts'
import { catalogTree, type CatalogBranch } from './catalog-tree.ts'
import { renderCatalogTree, type CatalogExpansion } from './palette-tree.ts'

export const TITLES = {
gas: 'Gas tank', flame: 'Flame', button: 'Button', slider: 'Slider', checkbox: 'Checkbox', toggle: 'Toggle', radio: 'Radio', scrollbar: 'Scrollbar', tab: 'Tab', separator: 'Separator',   screen: 'Screen', row: 'Row', column: 'Column', slot: 'Slot', progress: 'Progress',
  energy: 'Energy', tank: 'Fluid tank', search: 'Search', player: 'Inventory',
}
export const ICONS = {gas: 'cloud', flame: 'local_fire_department', button: 'smart_button', slider: 'tune', checkbox: 'check_box', toggle: 'toggle_on', radio: 'radio_button_checked', scrollbar: 'swap_vert', tab: 'tab', separator: 'horizontal_rule',  screen: 'web_asset', row: 'view_column', column: 'view_agenda', slot: 'crop_square',
  progress: 'trending_flat', energy: 'bolt', tank: 'opacity', search: 'search', player: 'apps' }

type Controls = { search: HTMLInputElement; category: HTMLSelectElement; pack:HTMLSelectElement; results: HTMLElement; pages: HTMLElement; expansion:CatalogExpansion; context:string }
const controls = new WeakMap<HTMLElement, Controls>()
function mount(root: HTMLElement): Controls {
  const filters = element('div', 'butter-library-filters'), search = element('input')
  search.type = 'search'; search.placeholder = 'Search components…'; search.maxLength = 100
  search.setAttribute('aria-label', 'Search components')
  search.oninput = () => call('view', { component_search: search.value })
  const clear = iconButton('close', 'Clear component search', () => { call('view', { component_search: '' }); search.focus() })
  const category = element('select'); category.setAttribute('aria-label', 'Component category')
  category.onchange = () => call('view', { component_category: category.value })
  const pack=element('select','butter-pack-filter');pack.setAttribute('aria-label','Component pack')
  pack.onchange=()=>call('view',{component_pack:pack.value})
  const manage=iconButton('inventory_2','Manage component packs',showLibrary);manage.classList.add('butter-pack-manage')
  filters.append(search, clear, pack,manage,category)
  const results = element('div', 'butter-library-results'), pages = element('div', 'butter-catalog-toolbar')
  results.setAttribute('aria-label', 'Matching components'); pages.setAttribute('aria-live', 'polite')
  root.replaceChildren(filters, pages, results)
  const value:Controls = { search, category, pack, results, pages, expansion:{closed:new Set(),pages:new Map()},context:'' }; controls.set(root, value); return value
}
export function renderPalette(root: HTMLElement) {
  const ui = controls.get(root) ?? mount(root), view = viewState(), doc = current().snapshot()
  if (ui.search.value !== view.component_search) ui.search.value = view.component_search
  const options=(select:HTMLSelectElement,entries:{id:string;title:string}[])=>{
    select.replaceChildren(...entries.map(e=>{const option=element('option','',e.title);option.value=e.id;return option}))
  }
  const categories=componentCategories(view.component_pack)
  const depth=(id:string):number=>{const c=categories.find(c=>c.id===id);return c?.parent?1+depth(c.parent):0}
  options(ui.category,[{id:'all',title:'All categories'},...categories.map(c=>({id:c.id,title:`${view.component_pack==='all'?c.pack_title+' · ':''}${'　'.repeat(depth(c.id))}${c.parent?'↳ ':''}${c.label}`}))])
  options(ui.pack,[{id:'all',title:'All packs'},{id:'builtin',title:'Built-in'},...library().list().filter(e=>e.enabled).map(e=>({id:`${e.pack.id}@${e.pack.version}`,title:`${e.pack.title} · ${e.pack.version}`}))])
  ui.category.value = view.component_category
  ui.pack.value=view.component_pack
  const context=`${Project?.uuid}/${view.component_pack}/${view.component_category}/${view.component_search}`
  if(ui.context!==context){ui.context=context;ui.expansion={closed:new Set(),pages:new Map()}}
  const matches=matchingComponents(view.component_search,view.component_category,allComponents(view.component_pack)),branches=catalogTree(categories,matches)
  const groups=element('div'),walk=(nodes:CatalogBranch[]):string[]=>nodes.flatMap(n=>[n.id,...walk(n.children)]),ids=walk(branches)
  const toggle=iconButton('unfold_less','Collapse all categories',()=>{
    ui.expansion.closed=ids.some(id=>ui.expansion.closed.has(id))?new Set():new Set(ids);renderPalette(root)
  })
  const syncToggle=()=>{
    const collapsed=ids.some(id=>ui.expansion.closed.has(id)),label=collapsed?'Expand all categories':'Collapse all categories'
    toggle.title=label;toggle.setAttribute('aria-label',label);toggle.querySelector('i')!.textContent=collapsed?'unfold_more':'unfold_less'
  }
  syncToggle();toggle.disabled=!matches.length;groups.append(toggle)
  ui.pages.replaceChildren(element('span','butter-library-count',`${matches.length} components · ${branches.length} ${branches.length===1?'pack':'packs'}`),groups)
  renderCatalogTree(ui.results,branches,ui.expansion,entry=>{
      const add = iconButton(entry.icon, `Add ${entry.title}`, () => {
        const store = current(), tree = store.snapshot().root
        const parent = entry.kind === 'player' ? tree : targetParent(tree, store.selected)
        if(entry.pack)call('component',{action:'add',pack:entry.pack,component:entry.component,parent_id:parent.id})
        else call('add', { kind: entry.kind, parent_id: parent.id })
      }, entry.title)
      add.disabled = entry.kind === 'player' && hasKind(doc.root, 'player')
      if(entry.pack){add.classList.add('butter-custom-card');add.querySelector('i')?.replaceWith(thumbnail(entry));add.title=`${entry.title}\n${entry.pack}\n${entry.keywords}`}
      add.draggable = !add.disabled
      add.ondragstart = event => { event.dataTransfer?.setData(entry.pack?LIBRARY_MIME:COMPONENT_MIME,entry.pack?JSON.stringify({pack:entry.pack,component:entry.component}):entry.kind); if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy' }
    return add
  },syncToggle)
  if(!matches.length)ui.results.append(element('p','butter-library-empty','No components found'))

}
