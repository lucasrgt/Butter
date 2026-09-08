import type { ButterDocument } from './document.ts'
import { selectedBounds } from './position.ts'
import { selectionBounds } from './selection.ts'
import type { Guide } from './drag-guides.ts'
import type { Rectangle } from './canvas-hit.ts'

export function paintSelection(overlay: HTMLCanvasElement, canvas: HTMLCanvasElement, doc: ButterDocument, ids: string[],
  visual: { marquee?: Rectangle; guides: Guide[]; moving: boolean }) {
  const viewport = overlay.parentElement!, width = viewport.clientWidth, height = viewport.clientHeight
  overlay.width = width; overlay.height = height
  const ctx = overlay.getContext('2d')!, scale = canvas.width / 176, left = canvas.offsetLeft, top = canvas.offsetTop
  const accent = getComputedStyle(viewport).getPropertyValue('--color-accent').trim() || '#4ea5ed'
  ctx.strokeStyle = accent; ctx.lineWidth = 1
  const outline = (b: Rectangle) => ctx.strokeRect(Math.round(left + b.x * scale) + .5, Math.round(top + b.y * scale) + .5,
    Math.round(b.w * scale) - 1, Math.round(b.h * scale) - 1)
  for (const id of ids) {
    if (id === doc.root.id) continue
    const bounds = selectedBounds(doc, id)
    if (bounds) outline(bounds)
  }
  const union = selectionBounds(doc, ids)
  if (union && ids.length > 1) { ctx.setLineDash([4, 3]); outline(union); ctx.setLineDash([]) }
  ctx.strokeStyle = '#e995ef'; ctx.setLineDash([3, 3])
  for (const guide of visual.guides) {
    const value = Math.round((guide.axis === 'x' ? left : top) + guide.value * scale) + .5
    ctx.beginPath(); ctx.moveTo(guide.axis === 'x' ? value : 0, guide.axis === 'y' ? value : 0)
    ctx.lineTo(guide.axis === 'x' ? value : width, guide.axis === 'y' ? value : height); ctx.stroke()
  }
  ctx.setLineDash([])
  if (visual.marquee) {
    const box = visual.marquee
    ctx.fillStyle = '#4ea5ed20'; ctx.fillRect(left + box.x * scale, top + box.y * scale, box.w * scale, box.h * scale)
    ctx.strokeStyle = accent; ctx.setLineDash([4, 2]); outline(box); ctx.setLineDash([])
  }
  if (visual.moving && union) {
    const text = `X ${union.x}   Y ${union.y}   ·   ${union.w} × ${union.h}`
    ctx.font = '11px sans-serif'; const tw = ctx.measureText(text).width
    const x = Math.max(4, Math.min(width - tw - 12, left + union.x * scale)), y = Math.max(20, Math.min(height - 4, top + union.y * scale - 6))
    ctx.fillStyle = '#202328'; ctx.fillRect(x, y - 16, tw + 12, 20); ctx.fillStyle = '#eeeeee'; ctx.fillText(text, x + 6, y - 2)
  }
}
