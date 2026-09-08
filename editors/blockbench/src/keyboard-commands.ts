import { current } from './host.ts'
import { call } from './api.ts'
import { viewState } from './view-state.ts'
import { inheritedFlag, selectable } from './selection.ts'

export function keyboardCommand(event: KeyboardEvent): (() => unknown) | undefined {
  const key = event.key.toLowerCase(), control = event.ctrlKey || event.metaKey, shift = event.shiftKey
  const edit = (action: string) => () => call('edit', { action })
  if (control) {
    if (key === 'z' || key === 'y') return () => {
      const direction = key === 'y' || shift ? 'redo' : 'undo', state = current().inspect()
      if (direction === 'undo' ? state.canUndo : state.canRedo) call('history', { direction })
    }
    if (key === 'a') return () => call('select', { mode: shift ? 'none' : 'all' })
    if (key === 'i') return () => call('select', { mode: 'invert' })
    if (key === 'c' || key === 'x' || key === 'v') return () => call('clipboard', { action: key === 'c' ? 'copy' : key === 'x' ? 'cut' : shift ? 'paste_in_place' : 'paste' })
    if (key === 'd') return edit('duplicate')
    if (key === 'g') return edit(shift ? 'ungroup' : 'group')
    if (key === 'h') return edit(shift ? 'show_all' : 'hide')
    if (key === 'l') return () => {
      const doc = current().snapshot(), ids = current().selection
      call('edit', { action: shift ? 'unlock_all' : ids.length && ids.every(id => inheritedFlag(doc, id, 'locked')) ? 'unlock' : 'lock' })
    }
    if (event.code === 'BracketLeft') return edit(shift ? 'send_back' : 'send_backward')
    if (event.code === 'BracketRight') return edit(shift ? 'bring_front' : 'bring_forward')
    if (key === '0') return () => call('frame', { target: 'all' })
    if (key === '1') return () => call('view', { zoom: 1, pan_x: 0, pan_y: 0 })
    if (key === 'f') return () => (document.querySelector(`input[aria-label="${shift ? 'Find layers' : 'Search components'}"]`) as HTMLInputElement | null)?.focus()
    return undefined
  }
  if (event.altKey) {
    if (key === 'h' || key === 'v') return () => call('align', { mode: key === 'h' ? 'center_x' : 'center_y' })
    return undefined
  }
  if (key === 'delete' || key === 'backspace') return edit('delete')
  if (key === 'escape') return () => call('select', { mode: 'none' })
  if (key === 'f') return () => call('frame', { target: shift ? 'all' : 'selection' })
  if (key === 'f2') return () => {
    const input = document.querySelector('input[aria-label="Layer name"]') as HTMLInputElement | null
    input?.focus(); input?.select()
  }
  if (key === 'enter') return () => call('select', { mode: 'parent' })
  if (key === '?') return () => call('help')
  if (key === 'tab' && (event.target as HTMLElement)?.classList.contains('butter-canvas')) return () => {
    const ids = selectable(current().snapshot(), viewState().selection_mode)
    if (!ids.length) return
    const index = ids.indexOf(current().selected), next = (index + (shift ? -1 : 1) + ids.length) % ids.length
    call('select', { id: ids[next] })
  }
  return undefined
}
