import { unzipSync, strFromU8 } from 'fflate'
import { refresh } from '../host.ts'
import { readLocal } from '../local-files.ts'
import { bitmapFont, type BitmapFont } from './font.ts'

export interface MinecraftAssets {
  widgets?: HTMLCanvasElement
  items?: HTMLCanvasElement
  gui: HTMLCanvasElement
  font: BitmapFont
  path: string
  sha256: string
}
let assets: MinecraftAssets | undefined
let error: string | undefined
let generation = 0
const key = 'blockbench_butter_minecraft_jar'
const entries = ['gui/furnace.png', 'font/default.png', 'font.txt', 'gui/gui.png', 'gui/items.png']

async function canvasImage(bytes: Uint8Array, width: number, height: number) {
  const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'image/png' }))
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    if (image.width !== width || image.height !== height) throw new Error(`Expected a ${width} × ${height} vanilla texture`)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d')!.drawImage(image, 0, 0)
    return canvas
  } finally { URL.revokeObjectURL(url) }
}

export async function loadAssets(path: string, remember = true) {
  const ticket = ++generation
  try {
    const bytes = readLocal(path, 64 * 1024 * 1024)
    const archive = unzipSync(bytes, { filter: entry => entries.includes(entry.name) && entry.originalSize <= 1024 * 1024 })
    for (const entry of entries) if (!archive[entry]) throw new Error(`Missing vanilla asset: ${entry}`)
    const [gui, atlas, widgets, items] = await Promise.all([
      canvasImage(archive['gui/furnace.png'], 256, 256), canvasImage(archive['font/default.png'], 128, 128),
      canvasImage(archive['gui/gui.png'], 256, 256), canvasImage(archive['gui/items.png'], 256, 256),
    ])
    const charset = strFromU8(archive['font.txt']).split(/\r?\n/).filter(line => !line.startsWith('#')).join('')
    if (charset.length < 95 || charset.length > 224) throw new Error('Unsupported Minecraft font character map')
    const digest = await crypto.subtle.digest('SHA-256', new Uint8Array(bytes))
    const sha256 = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('')
    if (ticket !== generation) throw new Error('A newer asset request replaced this one')
    assets = { gui, widgets, items, font: bitmapFont(atlas, charset), path, sha256 }
    error = undefined
    if (remember) localStorage.setItem(key, path)
    refresh()
    return assetStatus()
  } catch (cause) {
    if (ticket === generation) { error = String(cause); refresh() }
    throw cause
  }
}

export function minecraftAssets() { return assets }
export function assetStatus() {
  return { loaded: !!assets, source: assets?.path ?? null, sha256: assets?.sha256 ?? null,
    font: assets ? 'Minecraft bitmap · 8 × 8 glyphs' : null, error: error ?? null }
}
export function restoreAssets() {
  const path = localStorage.getItem(key)
  if (path) void loadAssets(path, false).catch(() => {})
}
export function clearAssets() {
  generation++
  assets = undefined
  error = undefined
  localStorage.removeItem(key)
  refresh()
  return assetStatus()
}
export function disposeAssets() { generation++; assets = undefined }
