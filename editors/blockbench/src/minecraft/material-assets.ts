import { readLocal } from '../local-files.ts'
import { refresh } from '../host.ts'

interface TextureStrip { canvas: HTMLCanvasElement; frames: number; frame_ms: number; sha256: string }
let strips = new Map<string, TextureStrip>(), source: string | undefined, error: string | undefined, generation = 0
const storageKey = 'blockbench_butter_material_pack'
export function materialStatus() {
  return { loaded: strips.size > 0, source: source ?? null, error: error ?? null,
    textures: [...strips].map(([id, value]) => ({ id, frames: value.frames, frame_ms: value.frame_ms, sha256: value.sha256 })) }
}
export async function loadMaterialPack(path: string, remember = true) {
  const ticket = ++generation
  try {
    const manifest = JSON.parse(new TextDecoder().decode(readLocal(path, 100000)))
    if (manifest.version !== 1 || !manifest.textures || typeof manifest.textures !== 'object') throw new Error('Expected a version 1 material pack')
    const next = new Map<string, TextureStrip>()
    for (const [id, value] of Object.entries(manifest.textures)) {
      if (!['water', 'lava', 'gas'].includes(id)) throw new Error(`Unknown material texture: ${id}`)
      const item = value as { path: string; frames: number; frame_ms: number }
      if (typeof item.path !== 'string' || !/^[A-Za-z]:[\\/]|^\//.test(item.path)
        || !Number.isInteger(item.frames) || item.frames < 1 || item.frames > 256
        || !Number.isInteger(item.frame_ms) || item.frame_ms < 20 || item.frame_ms > 1000) throw new Error(`Invalid texture strip: ${id}`)
      const bytes = readLocal(item.path, 4 * 1024 * 1024), url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'image/png' }))
      try {
        const image = new Image(); image.src = url; await image.decode()
        if (image.width !== 16 || image.height !== 16 * item.frames) throw new Error('Material strips must contain 16 × 16 frames stacked vertically')
        const canvas = document.createElement('canvas'); canvas.width = 16; canvas.height = image.height
        canvas.getContext('2d')!.drawImage(image, 0, 0)
        const hash = await crypto.subtle.digest('SHA-256', new Uint8Array(bytes))
        next.set(id, { canvas, frames: item.frames, frame_ms: item.frame_ms, sha256: [...new Uint8Array(hash)].map(n => n.toString(16).padStart(2, '0')).join('') })
      } finally { URL.revokeObjectURL(url) }
    }
    if (next.size !== 3) throw new Error('Material pack requires water, lava and gas textures')
    if (ticket !== generation) throw new Error('Material load was superseded')
    strips = next; source = path; error = undefined; tinted.clear()
    if (remember) localStorage.setItem(storageKey, path)
    refresh(); return materialStatus()
  } catch (cause) { if (ticket === generation) { error = String(cause); refresh() }; throw cause }
}
const tinted = new Map<string, HTMLCanvasElement>()
export function materialTexture(id: string, color?: string) {
  const strip = strips.get(id)
  if (!strip || !color) return strip
  const key = `${id}:${color}`
  let canvas = tinted.get(key)
  if (!canvas) {
    canvas = document.createElement('canvas'); canvas.width = strip.canvas.width; canvas.height = strip.canvas.height
    const ctx = canvas.getContext('2d')!, data = strip.canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height)
    const rgb = [1, 3, 5].map(start => parseInt(color.slice(start, start + 2), 16) / 255)
    for (let i = 0; i < data.data.length; i += 4) for (let c = 0; c < 3; c++) data.data[i + c] = Math.floor(data.data[i + c] * rgb[c])
    ctx.putImageData(data, 0, 0); if (tinted.size > 24) tinted.clear(); tinted.set(key, canvas)
  }
  return { ...strip, canvas }
}
export function paintMaterial(ctx: CanvasRenderingContext2D, id: string, x: number, y: number, w: number, h: number, time: number, color?: string) {
  const texture = materialTexture(id, color)
  if (!texture) return false
  const frame = Math.floor(time / texture.frame_ms) % texture.frames
  for (let px = 0; px < w; px += 16) for (let py = 0; py < h; py += 16) {
    const width = Math.min(16, w - px), height = Math.min(16, h - py)
    // The game repeats 16px atlas tiles and crops the last tile; it never stretches the liquid.
    ctx.drawImage(texture.canvas, 0, frame * 16, width, height, x + px, y + py, width, height)
  }
  return true
}
export function restoreMaterialPack() { const path = localStorage.getItem(storageKey); if (path) void loadMaterialPack(path, false).catch(() => {}) }
export function clearMaterialPack() { generation++; strips.clear(); tinted.clear(); source = error = undefined; localStorage.removeItem(storageKey); refresh(); return materialStatus() }
export function disposeMaterialPack() { generation++; strips.clear(); tinted.clear() }
