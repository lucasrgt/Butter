import type { Box } from '../../../gui-builder/src/model/types.ts'
import type { MinecraftAssets } from './assets.ts'
import { drawText } from './font.ts'

export function frame(ctx: CanvasRenderingContext2D, texture: HTMLCanvasElement) {
  ctx.clearRect(0, 0, 176, 166)
  ctx.fillStyle = '#c6c6c6'
  ctx.fillRect(4, 4, 168, 158)
  ctx.drawImage(texture, 0, 0, 176, 4, 0, 0, 176, 4)
  ctx.drawImage(texture, 0, 162, 176, 4, 0, 162, 176, 4)
  ctx.drawImage(texture, 0, 4, 4, 158, 0, 4, 4, 158)
  ctx.drawImage(texture, 172, 4, 4, 158, 172, 4, 4, 158)
}

function slot(ctx: CanvasRenderingContext2D, assets: MinecraftAssets, x: number, y: number) {
  ctx.drawImage(assets.gui, 7, 83, 18, 18, x, y, 18, 18)
}

function recessed(ctx: CanvasRenderingContext2D, box: Box) {
  ctx.fillStyle = '#373737'
  ctx.fillRect(box.x, box.y, box.w, box.h)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(box.x + 1, box.y + 1, box.w - 1, box.h - 1)
  ctx.fillStyle = '#8b8b8b'
  ctx.fillRect(box.x + 1, box.y + 1, box.w - 2, box.h - 2)
  ctx.fillRect(box.x + box.w - 1, box.y, 1, 1)
  ctx.fillRect(box.x, box.y + box.h - 1, 1, 1)
}

export function paintMinecraft(ctx: CanvasRenderingContext2D, assets: MinecraftAssets, boxes: Box[], title: string) {
  ctx.imageSmoothingEnabled = false
  frame(ctx, assets.gui)
  drawText(ctx, assets.font, title, 8, 6)
  for (const box of boxes) {
    if (box.kind === 'slot') slot(ctx, assets, box.x, box.y)
    else if (box.kind === 'player') {
      drawText(ctx, assets.font, 'Inventory', box.x + 1, box.y - 11)
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 9; col++) slot(ctx, assets, box.x + col * 18, box.y + row * 18)
      }
      for (let col = 0; col < 9; col++) slot(ctx, assets, box.x + col * 18, box.y + 58)
    } else if (box.kind === 'progress') {
      ctx.drawImage(assets.gui, 79, 34, 24, 17, box.x, box.y, 24, 17)
    } else {
      recessed(ctx, box)
      if (box.kind === 'energy') {
        ctx.fillStyle = '#36e38a'
        const filled = Math.floor((box.h - 2) * .7)
        ctx.fillRect(box.x + 1, box.y + box.h - 1 - filled, box.w - 2, filled)
      } else if (box.kind === 'tank') {
        ctx.fillStyle = '#560001'
        for (let y = 5; y < box.h - 2; y += 5) ctx.fillRect(box.x + 1, box.y + y, y % 25 === 0 ? box.w - 2 : 7, 1)
      }
    }
  }
}

export function paintFurnaceReference(ctx: CanvasRenderingContext2D, assets: MinecraftAssets) {
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, 176, 166)
  ctx.drawImage(assets.gui, 0, 0, 176, 166, 0, 0, 176, 166)
  drawText(ctx, assets.font, 'Furnace', 60, 6)
  drawText(ctx, assets.font, 'Inventory', 8, 72)
}
