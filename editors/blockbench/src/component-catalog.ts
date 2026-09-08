import type { Kind } from '../../gui-builder/src/model/types.ts'

export const CATEGORIES = [
  { id: 'layout', title: 'Layout' }, { id: 'inventory', title: 'Inventory' },
  { id: 'machine', title: 'Machine' }, { id: 'input', title: 'Input' },
] as const
export interface ComponentEntry {
  kind: Kind
  title: string
  icon: string
  category: typeof CATEGORIES[number]['id']
  keywords: string
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
export function componentPage(query = '', category = 'all', page = 1, entries = COMPONENTS) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
  const matches = entries.filter(item => (category === 'all' || item.category === category) &&
    terms.every(term => `${item.title} ${item.kind} ${item.keywords}`.toLocaleLowerCase().includes(term)))
  const pages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE))
  const current = Math.max(1, Math.min(pages, page))
  return { items: matches.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    total: matches.length, page: current, pages, page_size: PAGE_SIZE }
}
