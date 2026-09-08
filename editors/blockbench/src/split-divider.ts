import { element } from './dom.ts'
import { call } from './api.ts'
import { viewState } from './view-state.ts'

export function splitDivider(workspace: HTMLElement) {
  const root = element('div', 'butter-divider'); root.tabIndex = 0
  root.setAttribute('role', 'separator'); root.setAttribute('aria-orientation', 'vertical')
  root.setAttribute('aria-label', 'Resize GUI and model panes'); root.title = 'Drag to resize · Double-click to center'
  root.setAttribute('aria-valuemin', '25'); root.setAttribute('aria-valuemax', '75')
  let dragging = false
  const move = (event: PointerEvent) => {
    if (!dragging) return
    const bounds = workspace.getBoundingClientRect()
    call('view', { split_ratio: Math.max(25, Math.min(75, (event.clientX - bounds.left) / bounds.width * 100)) })
  }
  root.onpointerdown = event => {
    if (event.button !== 0) return
    dragging = true; root.setPointerCapture(event.pointerId); event.preventDefault()
  }
  root.onpointermove = move
  root.onpointerup = () => { dragging = false }
  root.onpointercancel = () => { dragging = false }
  root.ondblclick = () => call('view', { split_ratio: 50 })
  root.onkeydown = event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault(); event.stopPropagation()
    const step = event.shiftKey ? 10 : 1
    const value = event.key === 'Home' ? 25 : event.key === 'End' ? 75 : viewState().split_ratio + (event.key === 'ArrowLeft' ? -step : step)
    call('view', { split_ratio: Math.max(25, Math.min(75, value)) })
  }
  return root
}
