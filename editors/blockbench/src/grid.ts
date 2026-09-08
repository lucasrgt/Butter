import type { ViewState } from './view-state.ts'

export function paintGrid(ctx: CanvasRenderingContext2D, scale: number, view: ViewState) {
  if (!view.grid) return
  ctx.save()
  ctx.fillStyle = `rgba(25, 110, 195, ${view.grid_opacity})`
  for (let x = 0; x < 176; x += view.grid_size) ctx.fillRect(x * scale, 0, 1, 166 * scale)
  for (let y = 0; y < 166; y += view.grid_size) ctx.fillRect(0, y * scale, 176 * scale, 1)
  ctx.restore()
}
