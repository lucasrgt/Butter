import { call } from './api.ts'
import { viewState } from './view-state.ts'
import { zoomAt } from './canvas-camera.ts'
import { modalOpen } from './dom.ts'

export function canvasNavigation(viewport: HTMLElement, canvas: HTMLCanvasElement) {
  let space = false, inside = false, wheel = 0
  let drag: { id: number; x: number; y: number; panX: number; panY: number } | undefined
  const editing = (target: EventTarget | null) => (target as HTMLElement)?.closest?.('input, textarea, select, [contenteditable="true"]')
  const enabled = () => !!Project && Modes.selected === Modes.options.butter_gui && !viewState().source && !modalOpen()
  const finish = () => {
    const id = drag?.id; drag = undefined
    if (id !== undefined && viewport.hasPointerCapture(id)) viewport.releasePointerCapture(id)
    viewport.classList.remove('panning')
  }
  const reset = () => { finish(); space = false; wheel = 0; viewport.classList.remove('space-held') }
  const down = (event: KeyboardEvent) => {
    if (!(event.code === 'Space' || event.key === ' ') || !enabled() || editing(event.target)) return
    if (!inside && !viewport.contains(document.activeElement)) return
    event.preventDefault(); event.stopImmediatePropagation()
    space = true; viewport.classList.add('space-held')
  }
  const up = (event: KeyboardEvent) => { if (event.code === 'Space' || event.key === ' ') reset() }
  const enter = () => { inside = true }
  const leave = () => { inside = false }
  const start = (event: PointerEvent) => {
    if (!enabled() || !space || event.button !== 0 || editing(event.target)) return
    event.preventDefault(); event.stopImmediatePropagation(); canvas.focus({ preventScroll: true })
    const view = viewState()
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, panX: view.pan_x, panY: view.pan_y }
    viewport.setPointerCapture(event.pointerId); viewport.classList.add('panning')
  }
  const move = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.id) return
    if (!enabled()) { reset(); return }
    event.preventDefault(); event.stopImmediatePropagation()
    const bounded = (n: number) => Math.max(-100000, Math.min(100000, Math.round(n)))
    call('view', { pan_x: bounded(drag.panX + event.clientX - drag.x), pan_y: bounded(drag.panY + event.clientY - drag.y) })
  }
  const stop = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.id) return
    event.preventDefault(); event.stopImmediatePropagation(); finish()
  }
  const zoom = (event: WheelEvent) => {
    if (!enabled() || !event.ctrlKey || editing(event.target)) return
    event.preventDefault(); event.stopImmediatePropagation()
    if (!event.deltaY) return
    if (Math.sign(wheel) !== Math.sign(event.deltaY)) wheel = 0
    wheel += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientHeight : 1)
    if (Math.abs(wheel) < 40) return
    const rect = canvas.getBoundingClientRect(), area = viewport.getBoundingClientRect(), oldScale = Math.round(rect.width / 176)
    if (!oldScale) return
    const nextScale = Math.max(1, Math.min(8, oldScale + (wheel < 0 ? 1 : -1))); wheel = 0
    if (nextScale === oldScale) return
    finish()
    const pan = zoomAt({ width: viewport.clientWidth, height: viewport.clientHeight },
      { x: event.clientX - area.left, y: event.clientY - area.top },
      { left: rect.left - area.left, top: rect.top - area.top, scale: oldScale }, nextScale)
    call('view', { zoom: nextScale, ...pan })
  }
  const focus = (event: FocusEvent) => { if (editing(event.target)) reset() }
  viewport.addEventListener('pointerenter', enter); viewport.addEventListener('pointerleave', leave)
  viewport.addEventListener('pointerdown', start, true); viewport.addEventListener('pointermove', move, true)
  viewport.addEventListener('pointerup', stop, true); viewport.addEventListener('pointercancel', stop, true)
  viewport.addEventListener('lostpointercapture', finish); viewport.addEventListener('wheel', zoom, { passive: false, capture: true })
  document.addEventListener('keydown', down, true); document.addEventListener('keyup', up, true)
  document.addEventListener('focusin', focus, true); window.addEventListener('blur', reset)
  Blockbench.on('select_project', reset); Blockbench.on('select_mode', reset)
  return () => {
    reset(); viewport.removeEventListener('pointerenter', enter); viewport.removeEventListener('pointerleave', leave)
    viewport.removeEventListener('pointerdown', start, true); viewport.removeEventListener('pointermove', move, true)
    viewport.removeEventListener('pointerup', stop, true); viewport.removeEventListener('pointercancel', stop, true)
    viewport.removeEventListener('lostpointercapture', finish); viewport.removeEventListener('wheel', zoom, true)
    document.removeEventListener('keydown', down, true); document.removeEventListener('keyup', up, true)
    document.removeEventListener('focusin', focus, true); window.removeEventListener('blur', reset)
    Blockbench.removeListener('select_project', reset); Blockbench.removeListener('select_mode', reset)
  }
}
