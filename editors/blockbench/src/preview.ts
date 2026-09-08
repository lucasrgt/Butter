import { paintComponent } from './minecraft/component-preview.ts'
import { drawGui } from '../../gui-builder/src/canvas/draw.ts'
import { visibleBoxes, type ButterDocument } from './document.ts'
import { minecraftAssets } from './minecraft/assets.ts'
import { paintMinecraft, paintFurnaceReference } from './minecraft/painter.ts'
import { selectedBounds } from './position.ts'
import { paintCustom } from './library/render.ts'

export function paint(canvas: HTMLCanvasElement, doc: ButterDocument, scale: number, selected: string | null, time = 0) {
  canvas.width = 176 * scale
  canvas.height = 166 * scale
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D is unavailable')
  // Resizing a canvas resets this flag. Both the frame and every component pass
  // must inherit nearest-neighbor sampling before any save/restore boundary.
  context.imageSmoothingEnabled = false
  const assets = minecraftAssets()
  if (assets) {
    context.save()
    context.scale(scale, scale)
    paintMinecraft(context, assets, visibleBoxes(doc).filter(b=>!doc.component_refs?.[b.id]), doc.root.name)
    context.restore()
  } else drawGui(context, scale, visibleBoxes(doc).filter(b=>!doc.component_refs?.[b.id]), null, doc.root.name)
  context.save(); context.scale(scale, scale)
  for (const box of visibleBoxes(doc)) if(!paintCustom(context,box,doc,assets,time))paintComponent(context, box, doc, assets, time)
  context.restore()
  const bounds = selected && selected !== doc.root.id ? selectedBounds(doc, selected) : null
  if (bounds) {
    context.strokeStyle = '#4ea5ed'
    context.lineWidth = 1
    context.strokeRect(bounds.x * scale + .5, bounds.y * scale + .5, bounds.w * scale - 1, bounds.h * scale - 1)
  }
}

export function referencePng() {
  const assets = minecraftAssets()
  if (!assets) throw new Error('Load Minecraft assets first')
  const canvas = document.createElement('canvas')
  canvas.width = 176; canvas.height = 166
  paintFurnaceReference(canvas.getContext('2d')!, assets)
  return canvas.toDataURL('image/png')
}

export function previewPng(doc: ButterDocument, scale = 3) {
  if (!Number.isInteger(scale) || scale < 1 || scale > 6) throw new Error('Preview scale must be an integer from 1 to 6')
  const canvas = document.createElement('canvas')
  paint(canvas, doc, scale, null)
  return canvas.toDataURL('image/png')
}
