import { call } from './api.ts'
import { viewState } from './view-state.ts'
import { element, iconButton, group, label, attempt } from './dom.ts'

export function canvasTools() {
  const root = element('div', 'butter-canvas-tools')
  root.setAttribute('role', 'toolbar'); root.setAttribute('aria-label', 'Canvas zoom and grid')
  const zoom = element('select'); zoom.setAttribute('aria-label', 'GUI zoom'); zoom.title = 'GUI zoom'
  for (const value of ['fit', '1', '2', '3', '4', '5', '6', '7', '8']) {
    const option = element('option', '', value === 'fit' ? 'Fit' : `${value}×`); option.value = value; zoom.append(option)
  }
  zoom.onchange = () => call('view', { zoom: zoom.value === 'fit' ? 'fit' : Number(zoom.value), pan_x: 0, pan_y: 0 })
  const center = iconButton('center_focus_strong', 'Fit and center GUI', () => call('view', { zoom: 'fit', pan_x: 0, pan_y: 0 }))
  const frame = iconButton('filter_center_focus', 'Frame selection · F', () => call('frame', { target: 'selection' }))
  const selection = element('select'); selection.setAttribute('aria-label', 'Canvas selection mode')
  for (const [value, text] of [['group', 'Groups'], ['component', 'Components']]) {
    const option = element('option', '', text); option.value = value; selection.append(option)
  }
  selection.title = 'Ctrl-click or double-click picks an individual component inside a group'
  selection.onchange = () => call('view', { selection_mode: selection.value })
  const grid = iconButton('grid_on', 'Toggle pixel grid', () => call('view', { grid: !viewState().grid }), 'Grid')
  const size = element('input'); size.type = 'number'; size.min = '1'; size.max = '32'; size.step = '1'
  size.setAttribute('aria-label', 'Grid size in pixels'); size.title = 'Grid spacing in GUI pixels'
  size.onchange = () => attempt(() => call('view', { grid_size: Number(size.value) }))
  const opacity = element('input'); opacity.type = 'number'; opacity.min = '0'; opacity.max = '100'; opacity.step = '5'
  opacity.setAttribute('aria-label', 'Grid opacity percent'); opacity.title = 'Grid opacity'
  opacity.onchange = () => attempt(() => call('view', { grid_opacity: Number(opacity.value) / 100 }))
  const snap = iconButton('filter_center_focus', 'Snap dragging to grid · Arrow keys keep 1 / 10 px steps', () => call('view', { snap: !viewState().snap }), 'Snap')
  const guides = iconButton('border_inner', 'Toggle smart alignment guides', () => call('view', { smart_guides: !viewState().smart_guides }))
  root.append(group('Selection', selection), group('Zoom', zoom, center, frame), group('Grid', grid, label('px', size), label('%', opacity), snap, guides))
  return { root, update() {
    const view = viewState()
    zoom.value = String(view.zoom); size.value = String(view.grid_size); opacity.value = String(Math.round(view.grid_opacity * 100))
    grid.setAttribute('aria-pressed', String(view.grid)); snap.setAttribute('aria-pressed', String(view.snap))
    selection.value = view.selection_mode; guides.setAttribute('aria-pressed', String(view.smart_guides))
    opacity.disabled = !view.grid
    root.hidden = view.source
  } }
}

