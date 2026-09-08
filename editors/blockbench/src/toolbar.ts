import { PRESETS } from '../../gui-builder/src/model/presets.ts'
import { call } from './api.ts'
import { current } from './host.ts'
import { viewState } from './view-state.ts'
import { element, iconButton, group, attempt } from './dom.ts'
import { openDocument, save } from './files.ts'
import { contextMenu } from './context-menu.ts'

export function toolbar() {
  const root = element('div', 'butter-toolbar')
  root.setAttribute('role', 'toolbar'); root.setAttribute('aria-label', 'GUI document and layout')
  const presets = element('select'); presets.setAttribute('aria-label', 'Create GUI from preset')
  presets.title = 'Replace this project’s GUI with a preset · Undo available'
  presets.append(element('option', '', 'New GUI…'))
  PRESETS.forEach(p => { const o = element('option', '', p.label); o.value = p.id; presets.append(o) })
  presets.onchange = () => attempt(() => { if (presets.selectedIndex) call('begin', { preset: presets.value }); presets.selectedIndex = 0 })
  const exports = element('select'); exports.setAttribute('aria-label', 'Export GUI')
  for (const [value, text] of [['', 'Export…'], ['document', 'Document JSON'], ['butter', '.butter source'], ['spec', 'GameUiSpec JSON'], ['semantics', 'Semantic tree JSON'], ['png', 'PNG image']]) {
    const option = element('option', '', text); option.value = value; exports.append(option)
  }
  exports.onchange = () => attempt(() => { if (exports.value) save(exports.value as 'document'); exports.value = '' })
  const undo = iconButton('undo', 'Undo · Ctrl Z', () => call('history', { direction: 'undo' }))
  const redo = iconButton('redo', 'Redo · Ctrl Shift Z', () => call('history', { direction: 'redo' }))
  const gui = iconButton('web_asset', 'GUI canvas', () => call('view', { layout: 'gui' }), 'GUI')
  const split = iconButton('vertical_split', 'GUI and current project model', () => call('view', { layout: 'split' }), 'Split')
  const source = iconButton('code', 'Toggle .butter source', () => call('view', { source: !viewState().source }))
  const edit = iconButton('edit', 'Edit and selection actions', () => contextMenu(edit), 'Edit')
  const help = iconButton('help_outline', 'Editor shortcuts · ?', () => call('help'))
  root.append(group('Document', presets, iconButton('folder_open', 'Open document JSON', openDocument), exports),
    group('History', undo, redo, edit), element('span', 'butter-toolbar-spacer'), group('Layout', gui, split), group('Source', source, help))
  return { root, update() {
    const state = current().inspect(), view = viewState()
    undo.disabled = !state.canUndo; redo.disabled = !state.canRedo
    undo.title = `Undo${state.undo_label ? ` ${state.undo_label}` : ''} · Ctrl Z`
    redo.title = `Redo${state.redo_label ? ` ${state.redo_label}` : ''} · Ctrl Y / Ctrl Shift Z`
    gui.setAttribute('aria-pressed', String(view.layout === 'gui'))
    split.setAttribute('aria-pressed', String(view.layout === 'split'))
    source.setAttribute('aria-pressed', String(view.source))
  } }
}
