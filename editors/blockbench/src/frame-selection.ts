import { current } from './host.ts'
import { selectionBounds } from './selection.ts'
import { setView } from './view-state.ts'

export function frameSelection(target: 'selection' | 'all' = 'selection') {
  if (target === 'all') return setView({ zoom: 'fit', pan_x: 0, pan_y: 0 })
  const bounds = selectionBounds(current().snapshot(), current().selection)
  if (!bounds) return setView({ zoom: 'fit', pan_x: 0, pan_y: 0 })
  const viewport = document.querySelector('.butter-viewport') as HTMLElement | null
  const zoom = Math.max(1, Math.min(8, Math.floor(Math.min(((viewport?.clientWidth ?? 600) - 48) / Math.max(1, bounds.w),
    ((viewport?.clientHeight ?? 600) - 48) / Math.max(1, bounds.h)))))
  return setView({ zoom, pan_x: Math.round((88 - bounds.x - bounds.w / 2) * zoom), pan_y: Math.round((83 - bounds.y - bounds.h / 2) * zoom) })
}
