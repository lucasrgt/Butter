import type { Box } from '../../../gui-builder/src/model/types.ts'
import type { ButterDocument } from '../document.ts'
import { componentFields, previewFields, values, SUBSTANCES } from '../component-properties.ts'
import type { MinecraftAssets } from './assets.ts'
import { nativeButton, nativeItem } from './native-controls.ts'
import { paintMaterial } from './material-assets.ts'
import { drawText } from './font.ts'

export function bevel(ctx: CanvasRenderingContext2D, box: Box, raised = false, color = '#8b8b8b') {
  ctx.fillStyle = raised ? '#ffffff' : '#373737'; ctx.fillRect(box.x, box.y, box.w, box.h)
  ctx.fillStyle = raised ? '#373737' : '#ffffff'; ctx.fillRect(box.x + 1, box.y + 1, box.w - 1, box.h - 1)
  ctx.fillStyle = color; ctx.fillRect(box.x + 1, box.y + 1, box.w - 2, box.h - 2)
  ctx.fillRect(box.x + box.w - 1, box.y, 1, 1); ctx.fillRect(box.x, box.y + box.h - 1, 1, 1)
}
export function paintComponent(ctx: CanvasRenderingContext2D, box: Box, doc: ButterDocument, assets?: MinecraftAssets | null, time = 0) {
  const config = doc.components?.[box.id], state = values(previewFields(box.kind), doc.preview?.[box.id])
  const props = values(componentFields(box.kind), config?.props), ratio = Number(props.max) === 0 ? 0 : Number(state.level ?? 0) / 100
  const { x, y, w, h, kind } = box
  const fill = (dx: number, dy: number, width: number, height: number, color: string) => {
    ctx.fillStyle = color; if (width > 0 && height > 0) ctx.fillRect(x + dx, y + dy, width, height)
  }
  const text = (value: string, dx: number, dy: number, color = 0x404040, shadow = false) => {
    if (assets) drawText(ctx, assets.font, value, x + dx, y + dy, color, shadow)
    else { ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`; ctx.font = '9px monospace'; ctx.textBaseline = 'top'; ctx.fillText(value, x + dx, y + dy) }
  }
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip()
  if (kind === 'slot') {
    if (assets && w === 18 && h === 18) ctx.drawImage(assets.gui, 7, 83, 18, 18, x, y, 18, 18)
    else if (assets && w === 26 && h === 26) ctx.drawImage(assets.gui, 111, 30, 26, 26, x, y, 26, 26)
    else bevel(ctx, box)
    if (state.sample !== 'empty') {
      const native = nativeItem(ctx, assets, String(state.sample), box)
      if (!native) {
      const ox = Math.floor((w - 12) / 2), oy = Math.floor((h - 10) / 2)
      const color = state.sample === 'crystal' ? '#57d8db' : state.sample === 'dust' ? '#bb5b39' : '#ded8c9'
      fill(ox + 2, oy + 1, 8, 8, '#373737'); fill(ox + 1, oy + 2, 10, 6, color); fill(ox + 2, oy + 1, 7, 2, '#f1e9d9')
      }
      if (Number(state.count) > 1) text(String(state.count), w - String(state.count).length * 6 - 1, h - 9, 0xffffff)
    }
  } else if (kind === 'tank' || kind === 'gas') {
    bevel(ctx, box)
    const color = state.substance === 'custom' ? String(state.color) : SUBSTANCES[state.substance as keyof typeof SUBSTANCES]
    const filled = Math.floor((h - 2) * ratio), top = h - 1 - filled
    if (filled) {
      const texture = kind === 'gas' ? 'gas' : state.substance === 'lava' ? 'lava' : 'water'
      const tint = kind === 'gas' || !['water', 'lava'].includes(String(state.substance)) ? color : undefined
      if (!paintMaterial(ctx, texture, x + 1, y + top, w - 2, filled, state.animated ? time : 0, tint)) fill(1, top, w - 2, filled, color)
    }
    if (state.graduations) {
      const inner = h - 2, lines = Math.floor(inner / 5) - 1
      for (let i = 1; i <= lines; i++) fill(1, 1 + Math.floor(inner * i / (lines + 1)), i % 5 === 0 ? w - 2 : Math.floor((w - 2) / 2), 1, '#560001')
    }
  } else if (kind === 'energy') {
    bevel(ctx, box); const filled = Math.floor((h - 2) * ratio)
    for (let py = h - 1 - filled; py < h - 1; py++) fill(1, py, w - 2, 1, (y + py) % 2 === 0 ? '#3bfb98' : '#36e38a')
  } else if (kind === 'progress' && config?.variant !== 'bar') {
    if (assets) {
      ctx.drawImage(assets.gui, 79, 34, 24, 17, x, y, 24, 17)
      const filled = ratio > 0 ? Math.min(24, Math.floor(24 * ratio) + 1) : 0
      if (filled) ctx.drawImage(assets.gui, 176, 14, filled, 16, x, y, filled, 16)
    } else {
      fill(1, 7, 14, 3, '#8b8b8b')
      for (let px = 0; px < 8; px++) fill(15 + px, 1 + px, 1, 15 - px * 2, '#8b8b8b')
      ctx.beginPath(); ctx.rect(x, y, Math.floor(w * ratio), h); ctx.clip()
      fill(1, 7, 14, 3, '#ffffff'); for (let px = 0; px < 8; px++) fill(15 + px, 1 + px, 1, 15 - px * 2, '#ffffff')
    }
  } else if (kind === 'progress') {
    bevel(ctx, box); fill(1, 1, Math.floor((w - 2) * ratio), h - 2, '#ededed')
  } else if (kind === 'flame') {
    if (assets) {
      ctx.drawImage(assets.gui, 56, 36, 14, 14, x, y, 14, 14)
      const filled = Math.floor(12 * ratio)
      if (ratio > 0) ctx.drawImage(assets.gui, 176, 12 - filled, 14, filled + 2, x, y + 12 - filled, 14, filled + 2)
    } else { fill(3, 2, 8, 12, '#666666'); fill(3, h - Math.floor(h * ratio), 8, Math.floor(h * ratio), '#f1ad38') }
  } else if (kind === 'search') {
    bevel(ctx, box); const value = String(state.text || props.placeholder)
    text(value, 2, 2, state.text ? 0x404040 : 0x606060)
    if (state.focused) fill(Math.min(w - 2, 2 + String(state.text).length * 6), 2, 1, h - 4, '#ffffff')
  } else if (kind === 'button' || kind === 'tab') {
    if (kind !== 'button' || !nativeButton(ctx, assets, box, !!state.enabled, !!state.hovered)) bevel(ctx, box, !state.pressed, state.checked ? '#b8b8b8' : '#9e9e9e')
    const label = String(props.text), width = assets ? [...label].reduce((sum, c) => sum + (assets.font.widths[assets.font.charset.indexOf(c) + 32] ?? 0), 0) : label.length * 6
    text(label, (kind === 'button' ? Math.floor((w - width) / 2) : 3) + Number(!!state.pressed), Math.floor((h - 8) / 2) + Number(!!state.pressed), kind === 'button' ? state.enabled ? state.hovered ? 0xffffa0 : 0xe0e0e0 : 0xa0a0a0 : 0x404040, kind === 'button')
    if (kind === 'tab' && state.checked) fill(1, h - 1, w - 2, 1, '#c6c6c6')
  } else if (kind === 'slider' || kind === 'scrollbar') {
    bevel(ctx, box); const vertical = kind === 'scrollbar', thumb = vertical ? Math.min(h - 2, 8) : 4
    const offset = Math.floor(((vertical ? h : w) - 2 - thumb) * ratio)
    if (!vertical) fill(1, Math.floor(h / 2), w - 2, 2, '#373737')
    bevel(ctx, { ...box, x: x + 1 + (vertical ? 0 : offset), y: y + 1 + (vertical ? offset : 0), w: vertical ? w - 2 : thumb, h: vertical ? thumb : h - 2 }, true, '#bbbbbb')
  } else if (kind === 'checkbox' || kind === 'radio') {
    bevel(ctx, box)
    if (state.checked) { fill(2, 2, w - 4, h - 4, '#ededed'); if (kind === 'checkbox') fill(2, 2, 2, 2, '#8b8b8b') }
    if (kind === 'radio') for (const [dx, dy] of [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]]) fill(dx, dy, 1, 1, '#c6c6c6')
  } else if (kind === 'toggle') {
    bevel(ctx, box); fill(state.checked ? w - 8 : 1, 1, 7, h - 2, state.checked ? '#36e38a' : '#bbbbbb')
  } else if (kind === 'separator') { fill(0, 0, w, 1, '#555555'); fill(0, 1, w, 1, '#ffffff') }
  ctx.restore()
  if (state.hovered && kind !== 'button') { ctx.save(); ctx.globalAlpha = .2; fill(0, 0, w, h, '#ffffff'); ctx.restore() }
  if (!state.enabled && kind !== 'button') { ctx.save(); ctx.globalAlpha = .55; fill(0, 0, w, h, '#777777'); ctx.restore() }
}
