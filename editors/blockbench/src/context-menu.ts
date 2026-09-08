import { current } from './host.ts'
import { call } from './api.ts'
import { attempt } from './dom.ts'
import { clipboardStatus } from './clipboard.ts'
import { editableRoots } from './selection.ts'
import { GROUP_KINDS } from '../../gui-builder/src/model/types.ts'
import { findById } from '../../gui-builder/src/model/tree.ts'

let menu: Menu | undefined
export function contextMenu(position: MouseEvent | HTMLElement) {
  const store = current(), doc = store.snapshot(), ids = store.selection
  let editable = false
  try { editableRoots(doc, ids); editable = true } catch {}
  const item = (name: string, icon: string, command: string, args: Record<string, unknown>, keybind?: string, condition = true): CustomMenuItem =>
    ({ name, icon, keybind, condition, click: () => attempt(() => call(command, args)) })
  const edit = (name: string, icon: string, action: string, key?: string, allowed = editable) => item(name, icon, 'edit', { action }, key, allowed)
  const groups = ids.length > 0 && ids.every(id => GROUP_KINDS.has(findById(doc.root, id)!.kind))
  menu?.delete()
  menu = new Menu([
    item('Copy', 'content_copy', 'clipboard', { action: 'copy' }, 'Ctrl+C', ids.length > 0 && !ids.includes(doc.root.id)),
    item('Cut', 'content_cut', 'clipboard', { action: 'cut' }, 'Ctrl+X', editable),
    item('Paste', 'content_paste', 'clipboard', { action: 'paste' }, 'Ctrl+V', clipboardStatus().available),
    item('Paste in place', 'content_paste', 'clipboard', { action: 'paste_in_place' }, 'Ctrl+Shift+V', clipboardStatus().available),
    edit('Duplicate', 'content_copy', 'duplicate', 'Ctrl+D'), edit('Delete', 'delete', 'delete', 'Delete'), '_',
    edit('Group', 'folder', 'group', 'Ctrl+G', editable && !ids.some(id => findById(doc.root, id)?.kind === 'player')),
    edit('Ungroup', 'folder_open', 'ungroup', 'Ctrl+Shift+G', editable && groups),
    { name: 'Arrange', icon: 'layers', condition: editable, children: [
      edit('Bring to front', 'flip_to_front', 'bring_front', 'Ctrl+Shift+]'), edit('Bring forward', 'arrow_upward', 'bring_forward', 'Ctrl+]'),
      edit('Send backward', 'arrow_downward', 'send_backward', 'Ctrl+['), edit('Send to back', 'flip_to_back', 'send_back', 'Ctrl+Shift+['),
    ] },
    { name: 'Align', icon: 'align_horizontal_center', condition: editable, children: [
      ...[['Left', 'left'], ['Horizontal center', 'center_x'], ['Right', 'right'], ['Top', 'top'], ['Vertical center', 'center_y'], ['Bottom', 'bottom']].map(([name, mode]) =>
        item(name, 'vertical_align_center', 'align', { mode })),
      item('Distribute horizontal gaps', 'horizontal_distribute', 'distribute', { axis: 'horizontal' }, undefined, ids.length >= 3),
      item('Distribute vertical gaps', 'vertical_distribute', 'distribute', { axis: 'vertical' }, undefined, ids.length >= 3),
    ] }, '_',
    edit('Hide selection', 'visibility_off', 'hide', 'Ctrl+H', ids.length > 0), edit('Show selection', 'visibility', 'show', undefined, ids.length > 0),
    edit('Lock selection', 'lock', 'lock', 'Ctrl+L', ids.length > 0), edit('Unlock selection', 'lock_open', 'unlock', undefined, ids.length > 0),
    edit('Show all', 'visibility', 'show_all', 'Ctrl+Shift+H', true), edit('Unlock all', 'lock_open', 'unlock_all', 'Ctrl+Shift+L', true),
    edit('Reset selected layout', 'restart_alt', 'reset_layout'), '_',
    item('Select all', 'select_all', 'select', { mode: 'all' }, 'Ctrl+A'), item('Deselect', 'deselect', 'select', { mode: 'none' }, 'Esc'),
    item('Frame selection', 'filter_center_focus', 'frame', { target: 'selection' }, 'F'),
    item('Fit canvas', 'center_focus_strong', 'frame', { target: 'all' }, 'Shift+F'),
  ])
  menu.open(position)
}
export function disposeContextMenu() { menu?.hide(); menu?.delete(); menu = undefined }
