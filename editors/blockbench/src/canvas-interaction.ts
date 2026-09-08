import type { ButterDocument } from './document.ts'
import { current, persist, refresh } from './host.ts'
import { call } from './api.ts'
import { viewState } from './view-state.ts'
import { selectedBounds } from './position.ts'
import { editableRoots, selectionBounds } from './selection.ts'
import { translate } from './transforms.ts'
import { dragDelta, type Guide } from './drag-guides.ts'
import { copyBundle, pasteBundle } from './clipboard-model.ts'
import { canvasHit, contains, marqueeHits, type Rectangle } from './canvas-hit.ts'
import { contextMenu } from './context-menu.ts'
import { attempt } from './dom.ts'
import type { EditorStore } from './store.ts'

type Point = { x: number; y: number }
type Drag = { pointer: number; start: Point; last: Point; ids: string[]; hit?: string; shift: boolean; alt: boolean;
  toggle: boolean; direct: boolean; marquee: boolean; moved: boolean; base: ButterDocument; revision: number; owner: EditorStore; project: ModelProject }
export function canvasInteraction(viewport: HTMLElement, canvas: HTMLCanvasElement, repaint: () => void) {
  let drag: Drag | undefined, guides: Guide[] = []
  const point = (event: MouseEvent): Point => { const r = canvas.getBoundingClientRect(); return { x: (event.clientX - r.left) * 176 / r.width, y: (event.clientY - r.top) * 166 / r.height } }
  const rectangle = (): Rectangle | undefined => drag?.marquee ? { x: Math.min(drag.start.x, drag.last.x), y: Math.min(drag.start.y, drag.last.y),
    w: Math.abs(drag.last.x - drag.start.x), h: Math.abs(drag.last.y - drag.start.y) } : undefined
  const clear = () => {
    const id = drag?.pointer; drag = undefined; guides = []
    if (id !== undefined && viewport.hasPointerCapture(id)) viewport.releasePointerCapture(id)
    viewport.classList.remove('moving-components'); repaint()
  }
  const cancel = () => { drag?.owner.cancelGesture(); clear(); refresh() }
  const safe = (action: () => void) => attempt(() => { try { action() } catch (error) { cancel(); throw error } })
  const down = (event: PointerEvent) => safe(() => {
    if (!Project || event.button !== 0 || viewState().source || (event.target as HTMLElement).closest('textarea')) return
    const owner = current()
    if (owner.gesturing) return
    canvas.focus({ preventScroll: true }); const p = point(event), base = owner.snapshot(), view = viewState()
    const hit = canvasHit(base, owner.selection, p.x, p.y, view.selection_mode, event.ctrlKey || event.metaKey)
    const union = selectionBounds(base, owner.selection), selected = hit && owner.selection.includes(hit)
    const multi = !hit && !event.shiftKey && owner.selection.length > 1 && union && contains(union, p.x, p.y)
    if (hit && !selected) owner.selectMany([hit], event.shiftKey ? 'add' : 'replace')
    else if (!hit && !multi && !event.shiftKey) owner.selectMany([])
    event.preventDefault(); event.stopPropagation()
    drag = { pointer: event.pointerId, start: p, last: p, hit, ids: [...owner.selection], shift: event.shiftKey, alt: event.altKey,
      toggle: !!selected && event.shiftKey, direct: event.ctrlKey || event.metaKey, marquee: !hit && !multi, moved: false, base, revision: owner.revision, owner, project: Project }
    viewport.setPointerCapture(event.pointerId); refresh()
  })
  const move = (event: PointerEvent) => safe(() => {
    if (!drag || event.pointerId !== drag.pointer) return
    if (Project !== drag.project || drag.owner.revision !== drag.revision || viewState().source) { cancel(); return }
    if (drag.moved && !drag.marquee && !drag.owner.gesturing) { clear(); return }
    const p = point(event), scale = canvas.width / 176
    drag.last = p
    if (Math.hypot(p.x - drag.start.x, p.y - drag.start.y) * scale < 3 && !drag.moved) return
    event.preventDefault(); event.stopPropagation()
    if (drag.marquee) { drag.moved = true; repaint(); return }
    if (!drag.moved) {
      editableRoots(drag.base, drag.ids)
      if (drag.alt) drag.ids = pasteBundle(drag.base, copyBundle(drag.base, drag.ids), drag.base.root.id, 0, 0, true)
      drag.owner.beginGesture(drag.alt ? 'Duplicate and move' : 'Move'); drag.moved = true
    }
    const delta = dragDelta(drag.base, drag.ids, Math.round(p.x - drag.start.x), Math.round(p.y - drag.start.y), viewState(), scale, event.shiftKey)
    const doc = structuredClone(drag.base); translate(doc, drag.ids, delta.dx, delta.dy)
    guides = delta.guides; drag.owner.updateGesture(doc, drag.ids); viewport.classList.add('moving-components'); refresh()
  })
  const up = (event: PointerEvent) => safe(() => {
    if (!drag || event.pointerId !== drag.pointer) return
    event.preventDefault(); event.stopPropagation()
    const end = drag
    if (end.marquee && end.moved) {
      const ids = marqueeHits(end.base, rectangle()!, end.direct ? 'component' : viewState().selection_mode)
      clear(); end.owner.selectMany(ids, end.shift ? 'toggle' : 'replace'); refresh(); return
    }
    clear()
    if (end.moved) { if (Project === end.project && end.owner.gesturing) { end.owner.commitGesture(); persist() } }
    else if (end.hit) {
      if (end.toggle) end.owner.selectMany([end.hit], 'toggle')
      else if (!end.shift) end.owner.selectMany([end.hit])
      refresh()
    }
  })
  const double = (event: MouseEvent) => safe(() => {
    if (viewState().source) return
    const p = point(event), store = current(), hit = canvasHit(store.snapshot(), [], p.x, p.y, 'component', true)
    if (hit) call('select', { id: hit })
  })
  const menu = (event: MouseEvent) => {
    if (viewState().source) return
    event.preventDefault(); event.stopPropagation()
    const p = point(event), store = current(), hit = canvasHit(store.snapshot(), store.selection, p.x, p.y, viewState().selection_mode, false)
    if (hit && !store.selection.includes(hit)) call('select', { id: hit })
    contextMenu(event)
  }
  const lost = () => { if (drag) cancel() }
  const blur = () => { if (drag) cancel() }
  viewport.addEventListener('pointerdown', down); viewport.addEventListener('pointermove', move)
  viewport.addEventListener('pointerup', up); viewport.addEventListener('pointercancel', lost)
  viewport.addEventListener('lostpointercapture', lost); viewport.addEventListener('dblclick', double); viewport.addEventListener('contextmenu', menu)
  window.addEventListener('blur', blur); Blockbench.on('select_project', blur); Blockbench.on('select_mode', blur)
  return { visual() {
    if (drag && (viewState().source || (!drag.marquee && drag.moved && !drag.owner.gesturing))) {
      const id = drag.pointer; drag.owner.cancelGesture(); drag = undefined; guides = []
      if (viewport.hasPointerCapture(id)) viewport.releasePointerCapture(id)
      viewport.classList.remove('moving-components')
    }
    return { marquee: rectangle(), guides, moving: !!drag?.moved && !drag.marquee }
  }, dispose() {
    blur(); viewport.removeEventListener('pointerdown', down); viewport.removeEventListener('pointermove', move)
    viewport.removeEventListener('pointerup', up); viewport.removeEventListener('pointercancel', lost)
    viewport.removeEventListener('lostpointercapture', lost); viewport.removeEventListener('dblclick', double); viewport.removeEventListener('contextmenu', menu)
    window.removeEventListener('blur', blur); Blockbench.removeListener('select_project', blur); Blockbench.removeListener('select_mode', blur)
  } }
}
