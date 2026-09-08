import { current, subscribe } from './host.ts'
import { call } from './api.ts'
import { layoutWarnings, visibleBoxes } from './document.ts'
import { selectionBounds } from './selection.ts'
import { paint } from './preview.ts'
import { element } from './dom.ts'
import { toolbar } from './toolbar.ts'
import { viewState } from './view-state.ts'
import { paintGrid } from './grid.ts'
import { mountMachine } from './machine-view.ts'
import { assetStatus } from './minecraft/assets.ts'
import { canvasTools } from './canvas-tools.ts'
import { splitDivider } from './split-divider.ts'
import { canvasNavigation } from './canvas-navigation.ts'
import { canvasInteraction } from './canvas-interaction.ts'
import { paintSelection } from './selection-overlay.ts'
import { canvasDrop } from './canvas-drop.ts'

export function mountViewer(root: HTMLElement) {
  root.className = 'butter-ui butter-viewer'
  const bar = toolbar(), workspace = element('div', 'butter-workspace'), viewport = element('div', 'butter-viewport')
  const canvas = element('canvas', 'butter-canvas'); canvas.tabIndex = 0
  canvas.setAttribute('aria-label', 'GUI preview. Ctrl + wheel zooms; Space + drag pans. Arrow keys move selection 1 pixel; Shift moves 10 pixels.')
  viewport.title = 'Ctrl + wheel: zoom · Space + drag: pan'
  const overlay = element('canvas', 'butter-selection-overlay'); overlay.setAttribute('aria-hidden', 'true')
  let interaction: ReturnType<typeof canvasInteraction> | undefined
  const source = element('textarea', 'butter-source'); source.readOnly = true
  source.setAttribute('aria-label', 'Generated Butter template')
  const machine = element('div', 'butter-machine'), gui = element('div', 'butter-gui-pane')
  const canvasBar = canvasTools(), divider = splitDivider(workspace)
  viewport.append(canvas, source, overlay); gui.append(canvasBar.root, viewport); workspace.append(gui, divider, machine)
  const status = element('div', 'butter-status')
  root.replaceChildren(bar.root, workspace, status)
  let closeMachine: (() => void) | undefined
  let machineProject: string | undefined
  let canvasScale = 1
  function render() {
    if (!Project || !root.isConnected || Modes.selected !== Modes.options.butter_gui) { closeMachine?.(); closeMachine = undefined; return }
    const state = current().inspect(), view = viewState(), split = view.layout === 'split'
    machine.hidden = !split; divider.hidden = !split
    workspace.style.gridTemplateColumns = split ? `minmax(0, ${view.split_ratio}fr) 5px minmax(0, ${100 - view.split_ratio}fr)` : '1fr'
    if (closeMachine && machineProject !== Project.uuid) { closeMachine(); closeMachine = undefined }
    if (split && !closeMachine) { closeMachine = mountMachine(machine); machineProject = Project.uuid }
    if (!split && closeMachine) { closeMachine(); closeMachine = undefined }
    divider.setAttribute('aria-valuenow', String(Math.round(view.split_ratio)))
    const scale = view.zoom === 'fit' ? Math.max(1, Math.min(8, Math.floor(Math.min((viewport.clientWidth - 32) / 176, (viewport.clientHeight - 32) / 166)))) : view.zoom
    canvasScale = scale
    paint(canvas, state.document, scale, null, performance.now()); paintGrid(canvas.getContext('2d')!, scale, view)
    canvas.style.width = `${176 * scale}px`; canvas.style.height = `${166 * scale}px`
    canvas.style.left = `${Math.round((viewport.clientWidth - 176 * scale) / 2 + view.pan_x)}px`
    canvas.style.top = `${Math.round((viewport.clientHeight - 166 * scale) / 2 + view.pan_y)}px`
    canvas.hidden = view.source; overlay.hidden = view.source; source.hidden = !view.source
    const visual = interaction?.visual() ?? { guides: [], moving: false }
    if (!view.source) paintSelection(overlay, canvas, state.document, state.selected_ids, visual)
    if (view.source) source.value = (call('export', { format: 'butter' }) as { text: string }).text
    bar.update(); canvasBar.update()
    const bounds = selectionBounds(state.document, state.selected_ids)
    status.textContent = `176 × 166 px  ·  ${scale}×  ·  ${state.selected_ids.length} selected${bounds ? `  ·  X ${bounds.x}  Y ${bounds.y}` : ''}${assetStatus().loaded ? '' : '  ·  Fallback assets'}`
    const warnings = layoutWarnings(state.document); status.title = warnings.join('\n')
    if (warnings.length) status.textContent += ` · ${warnings.length} outside canvas`
  }
  const animation = window.setInterval(() => {
    if (!Project || document.hidden || Modes.selected !== Modes.options.butter_gui || viewState().source) return
    const doc = current().snapshot()
    if (!visibleBoxes(doc).some(box => ['tank', 'gas'].includes(box.kind) && Number(doc.preview?.[box.id]?.level) > 0 && doc.preview?.[box.id]?.animated !== false)) return
    paint(canvas, doc, canvasScale, null, performance.now()); paintGrid(canvas.getContext('2d')!, canvasScale, viewState())
  }, 50)
  const observer = new ResizeObserver(render); observer.observe(viewport)
  const closeNavigation = canvasNavigation(viewport, canvas)
  interaction = canvasInteraction(viewport, canvas, render)
  const closeDrop = canvasDrop(viewport, canvas)
  const unsubscribe = subscribe(render); render()
  return () => { clearInterval(animation); unsubscribe(); observer.disconnect(); closeMachine?.(); closeNavigation(); interaction?.dispose(); closeDrop() }
}
