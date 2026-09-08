import { current, persist, refresh } from './host.ts'
import { attempt, modalOpen } from './dom.ts'
import { translate } from './transforms.ts'
import { keyboardCommand } from './keyboard-commands.ts'
import type { EditorStore } from './store.ts'

export function installKeyboard() {
  let timer: ReturnType<typeof setTimeout> | undefined
  let held: string | undefined, shifted = false, owner: EditorStore | undefined, project: ModelProject | undefined
  const arrows: Record<string, number[]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
  const active = () => !!Project && Modes.selected === Modes.options.butter_gui && !modalOpen()
  const editable = (target: EventTarget | null) => (target as HTMLElement)?.closest?.('input, textarea, select, [contenteditable="true"], .butter-machine, [role="separator"]')
  const finish = (commit = true) => {
    clearTimeout(timer); held = undefined
    const store = owner; owner = undefined
    if (!store) return
    if (commit && Project === project) { store.commitGesture(); persist() } else { store.cancelGesture(); refresh() }
  }
  const step = () => {
    if (!held || !active() || !owner || Project !== project) { finish(false); return }
    const [x, y] = arrows[held], amount = shifted ? 10 : 1, doc = owner.snapshot()
    try { translate(doc, owner.selection, x * amount, y * amount); owner.updateGesture(doc); refresh() }
    catch (error) { finish(false); throw error }
  }
  const repeat = () => { attempt(step); if (held) timer = setTimeout(repeat, 75) }
  const down = (event: KeyboardEvent) => {
    shifted = event.shiftKey
    if (!active() || editable(event.target)) return
    const store = current()
    if (store.gesturing && !owner) {
      if (event.key === 'Escape' || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z')) {
        event.preventDefault(); event.stopImmediatePropagation(); store.cancelGesture(); refresh()
      }
      return
    }
    const command = keyboardCommand(event)
    if (command) {
      event.preventDefault(); event.stopImmediatePropagation()
      if (event.repeat) return
      if (event.key === 'Escape' && owner) { finish(false); return }
      finish(); attempt(command); return
    }
    if (!arrows[event.key] || event.ctrlKey || event.metaKey || event.altKey) return
    if (!store.selection.length || store.selection.includes(store.snapshot().root.id)) return
    event.preventDefault(); event.stopImmediatePropagation()
    if (event.repeat || held === event.key) return
    finish(); owner = store; project = Project ?? undefined; held = event.key; owner.beginGesture('Move')
    attempt(step); if (held) timer = setTimeout(repeat, 350)
  }
  const up = (event: KeyboardEvent) => { shifted = event.shiftKey; if (event.key === held) finish() }
  const focus = (event: FocusEvent) => { if (editable(event.target)) finish() }
  const blur = () => finish(), leave = () => finish(false)
  document.addEventListener('keydown', down, true); document.addEventListener('keyup', up, true); document.addEventListener('focusin', focus, true)
  window.addEventListener('blur', blur); Blockbench.on('select_mode', leave); Blockbench.on('select_project', leave)
  return () => {
    finish(false); document.removeEventListener('keydown', down, true); document.removeEventListener('keyup', up, true)
    document.removeEventListener('focusin', focus, true); window.removeEventListener('blur', blur)
    Blockbench.removeListener('select_mode', leave); Blockbench.removeListener('select_project', leave)
  }
}
