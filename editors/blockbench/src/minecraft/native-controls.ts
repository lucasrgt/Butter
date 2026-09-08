import type { Box } from '../../../gui-builder/src/model/types.ts'
import type { MinecraftAssets } from './assets.ts'

export function nativeButton(ctx: CanvasRenderingContext2D, assets: MinecraftAssets | null | undefined, box: Box, enabled: boolean, hovered: boolean) {
  if (!assets?.widgets) return false
  const { x, y, w, h } = box, v = !enabled ? 46 : hovered ? 86 : 66
  // Vanilla button texture, with fixed 2px corners and tiled center. No texture stretching.
  for (let py = 0; py < h; py++) {
    const sy = py < 2 ? py : py >= h - 2 ? 20 - (h - py) : 2 + (py - 2) % 16
    ctx.drawImage(assets.widgets, 0, v + sy, 2, 1, x, y + py, 2, 1)
    for (let px = 2; px < w - 2; px += 196) {
      const width = Math.min(196, w - 2 - px)
      ctx.drawImage(assets.widgets, 2, v + sy, width, 1, x + px, y + py, width, 1)
    }
    ctx.drawImage(assets.widgets, 198, v + sy, 2, 1, x + w - 2, y + py, 2, 1)
  }
  return true
}
export function nativeItem(ctx: CanvasRenderingContext2D, assets: MinecraftAssets | null | undefined, sample: string, box: Box) {
  if (!assets?.items || sample === 'empty') return false
  const tile = sample === 'ingot' ? 23 : sample === 'crystal' ? 55 : 56
  const x = box.x + Math.floor((box.w - 16) / 2), y = box.y + Math.floor((box.h - 16) / 2)
  ctx.drawImage(assets.items, tile % 16 * 16, Math.floor(tile / 16) * 16, 16, 16, x, y, 16, 16)
  return true
}
