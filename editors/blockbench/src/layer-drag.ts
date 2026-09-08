import { current } from './host.ts'
import { call } from './api.ts'
import { editableRoots } from './selection.ts'
import { LAYERS_MIME } from './canvas-drop.ts'
import { parentOf } from '../../gui-builder/src/model/tree.ts'
import { GROUP_KINDS, type Widget } from '../../gui-builder/src/model/types.ts'
import { attempt } from './dom.ts'

export function layerDrag(row: HTMLElement, node: Widget, root: HTMLElement, redraw: () => void) {
  row.draggable = node.kind !== 'screen'
  const clear = () => row.classList.remove('drop-before', 'drop-after', 'drop-inside')
  const end = () => { delete root.dataset.dragging; clear(); redraw() }
  row.ondragstart = event => attempt(() => {
    try {
      root.dataset.dragging = 'true'
      if (!current().selection.includes(node.id)) call('select', { id: node.id })
      const ids = editableRoots(current().snapshot(), current().selection)
      event.dataTransfer?.setData(LAYERS_MIME, JSON.stringify({ project: Project?.uuid, ids }))
      if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
    } catch (error) { event.preventDefault(); end(); throw error }
  })
  const zone = (event: DragEvent) => {
    if (node.kind === 'screen') return 'inside'
    const rect = row.getBoundingClientRect(), portion = (event.clientY - rect.top) / rect.height
    return portion < .25 ? 'before' : portion > .75 ? 'after' : GROUP_KINDS.has(node.kind) ? 'inside' : 'after'
  }
  row.ondragover = event => {
    if (!event.dataTransfer?.types.includes(LAYERS_MIME)) return
    event.preventDefault(); event.stopPropagation(); clear(); row.classList.add(`drop-${zone(event)}`); event.dataTransfer.dropEffect = 'move'
  }
  row.ondragleave = clear
  row.ondragend = end
  row.ondrop = event => {
    if (!event.dataTransfer?.types.includes(LAYERS_MIME)) return
    event.preventDefault(); event.stopPropagation()
    attempt(() => {
      try {
        const data = JSON.parse(event.dataTransfer!.getData(LAYERS_MIME))
        if (data.project !== Project?.uuid) throw new Error('Reorder layers within the current project')
        const where = zone(event), doc = current().snapshot()
        if (where === 'inside') { call('move', { ids: data.ids, parent_id: node.id }); call('tree', { action: 'expand', ids: [node.id] }) }
        else {
          const parent = parentOf(doc.root, node.id)
          if (!parent) throw new Error('The screen root cannot be reordered')
          const index = parent.children.findIndex(child => child.id === node.id) + (where === 'after' ? 1 : 0)
          call('move', { ids: data.ids, parent_id: parent.id, index })
        }
      } finally { end() }
    })
  }
}
