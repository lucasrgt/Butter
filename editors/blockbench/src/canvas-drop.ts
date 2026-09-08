import { call } from './api.ts'
import { current } from './host.ts'
import { viewState } from './view-state.ts'
import { PALETTE } from '../../gui-builder/src/model/types.ts'
import { targetParent } from '../../gui-builder/src/model/tree.ts'
import { attempt } from './dom.ts'

export const COMPONENT_MIME = 'application/x-butter-component'
export const LAYERS_MIME = 'application/x-butter-layers'
export const LIBRARY_MIME='application/x-butter-library-component'
export function canvasDrop(viewport: HTMLElement, canvas: HTMLCanvasElement) {
  const accepts = (event: DragEvent) => !viewState().source && [COMPONENT_MIME, LAYERS_MIME,LIBRARY_MIME].some(type => event.dataTransfer?.types.includes(type))
  const over = (event: DragEvent) => {
    if (!accepts(event)) return
    event.preventDefault(); event.stopPropagation(); viewport.classList.add('butter-drop-target')
    event.dataTransfer!.dropEffect = event.dataTransfer!.types.includes(LAYERS_MIME) ? 'move' : 'copy'
  }
  const leave = () => viewport.classList.remove('butter-drop-target')
  const drop = (event: DragEvent) => {
    if (!accepts(event)) return
    event.preventDefault(); event.stopPropagation(); leave()
    attempt(() => {
      const rect = canvas.getBoundingClientRect(), view = viewState(), snap = (n: number) => view.snap ? Math.round(n / view.grid_size) * view.grid_size : Math.round(n)
      const x = snap((event.clientX - rect.left) * 176 / rect.width), y = snap((event.clientY - rect.top) * 166 / rect.height)
      const kind = event.dataTransfer!.getData(COMPONENT_MIME)
      const custom=event.dataTransfer!.getData(LIBRARY_MIME)
      if(custom) {
        const data=JSON.parse(custom),store=current(),parent=targetParent(store.snapshot().root,store.selected)
        call('component',{action:'add',pack:data.pack,component:data.component,parent_id:parent.id,x,y})
      } else if (kind) {
        if (!PALETTE.includes(kind as typeof PALETTE[number])) throw new Error('Unknown component')
        const store = current(), doc = store.snapshot(), parent = kind === 'player' ? doc.root : targetParent(doc.root, store.selected)
        call('add', { kind, parent_id: parent.id, x, y })
      } else {
        const data = JSON.parse(event.dataTransfer!.getData(LAYERS_MIME))
        if (data.project !== Project?.uuid) throw new Error('Move layers within the current project')
        call('position', { ids: data.ids, x, y }); call('select', { ids: data.ids })
      }
      canvas.focus({ preventScroll: true })
    })
  }
  viewport.addEventListener('dragover', over); viewport.addEventListener('dragleave', leave); viewport.addEventListener('drop', drop)
  return () => { viewport.removeEventListener('dragover', over); viewport.removeEventListener('dragleave', leave); viewport.removeEventListener('drop', drop) }
}
