import type { Kind } from '../../gui-builder/src/model/types.ts'
import { library } from './library/registry.ts'
import { categoryPath, categoryTree } from './library/categories.ts'

export const CATEGORIES = [
  { id: 'layout', title: 'Layout' }, { id: 'inventory', title: 'Inventory' },
  { id: 'machine', title: 'Machine' }, { id: 'input', title: 'Input' },
] as const
export interface ComponentEntry {
  kind: Kind
  title: string
  icon: string
  category: string
  keywords: string
  pack?: string
  component?: string
  category_ancestors?: string[]
}
export const COMPONENTS: ComponentEntry[] = [

  { kind: 'row', title: 'Row', icon: 'view_column', category: 'layout', keywords: 'horizontal group container' },
  { kind: 'column', title: 'Column', icon: 'view_agenda', category: 'layout', keywords: 'vertical group container' },
  { kind: 'slot', title: 'Slot', icon: 'crop_square', category: 'inventory', keywords: 'item input output' },
  { kind: 'player', title: 'Inventory', icon: 'apps', category: 'inventory', keywords: 'player slots hotbar' },
  { kind: 'progress', title: 'Progress', icon: 'trending_flat', category: 'machine', keywords: 'recipe arrow progressbar' },
  { kind: 'energy', title: 'Energy', icon: 'bolt', category: 'machine', keywords: 'power energybar gauge' },
  { kind: 'tank', title: 'Fluid tank', icon: 'opacity', category: 'machine', keywords: 'liquid fluidtank gauge' },
  { kind: 'search', title: 'Search', icon: 'search', category: 'input', keywords: 'text field searchbar' },
  { kind: 'gas', title: 'Gas tank', icon: 'cloud', category: 'machine', keywords: 'gas' },
  { kind: 'flame', title: 'Flame', icon: 'local_fire_department', category: 'machine', keywords: 'flame' },
  { kind: 'button', title: 'Button', icon: 'smart_button', category: 'input', keywords: 'button' },
  { kind: 'slider', title: 'Slider', icon: 'tune', category: 'input', keywords: 'slider' },
  { kind: 'checkbox', title: 'Checkbox', icon: 'check_box', category: 'input', keywords: 'checkbox' },
  { kind: 'toggle', title: 'Toggle', icon: 'toggle_on', category: 'input', keywords: 'toggle' },
  { kind: 'radio', title: 'Radio', icon: 'radio_button_checked', category: 'input', keywords: 'radio' },
  { kind: 'scrollbar', title: 'Scrollbar', icon: 'swap_vert', category: 'input', keywords: 'scrollbar' },
  { kind: 'tab', title: 'Tab', icon: 'tab', category: 'input', keywords: 'tab' },
  { kind: 'separator', title: 'Separator', icon: 'horizontal_rule', category: 'layout', keywords: 'separator' },
]
export const PAGE_SIZE = 10
export interface CatalogCategory {id:string;title:string;label:string;parent?:string;pack:string;pack_title:string;version?:string;icon?:string}
export function componentCategories(pack='all') {
  const builtin:CatalogCategory[]=CATEGORIES.map(c=>({...c,label:c.title,pack:'builtin',pack_title:'Built-in'}))
  return [...(pack==='all'||pack==='builtin'?builtin:[]),...(pack==='builtin'?[]:library().visible(pack==='all'?undefined:pack).flatMap(e=>categoryTree(e.pack.categories).map(c=>({
    id:`${e.pack.id}@${e.pack.version}/${c.id}`,title:`${e.pack.title} · ${categoryPath(e.pack.categories,c.id).map(p=>p.title).join(' / ')}`,
    label:c.title,parent:c.parent?`${e.pack.id}@${e.pack.version}/${c.parent}`:undefined,pack:`${e.pack.id}@${e.pack.version}`,pack_title:e.pack.title,version:e.pack.version,icon:c.icon,
  }))))]
}
export function allComponents(pack='all'):ComponentEntry[] {
  return [...(pack==='all'||pack==='builtin'?COMPONENTS:[]),...(pack==='builtin'?[]:library().catalog('',pack==='all'?undefined:pack).map(c=>({
    kind:c.base,title:c.title,icon:c.icon??'extension',category:`${c.pack}/${c.category}`,category_ancestors:c.category_ancestors.map(id=>`${c.pack}/${id}`),keywords:[c.id,c.description,c.pack_title,c.category_title,...c.tags??[]].join(' '),pack:c.pack,component:c.id,
  })))]
}
export function matchingComponents(query = '', category = 'all', entries = allComponents()) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
  return entries.filter(item => (category === 'all' || item.category === category || item.category_ancestors?.includes(category)) &&
    terms.every(term => `${item.title} ${item.kind} ${item.keywords}`.toLocaleLowerCase().includes(term)))
}
export function componentPage(query = '', category = 'all', page = 1, entries = allComponents()) {
  const matches=matchingComponents(query,category,entries)
  const pages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE))
  const current = Math.max(1, Math.min(pages, page))
  return { items: matches.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    total: matches.length, page: current, pages, page_size: PAGE_SIZE }
}
