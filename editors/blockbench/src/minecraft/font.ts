export interface BitmapFont {
  atlas: HTMLCanvasElement
  charset: string
  widths: number[]
  tinted: Map<number, HTMLCanvasElement>
}

export function glyphWidths(data: Uint8ClampedArray) {
  return Array.from({ length: 256 }, (_, glyph) => {
    if (glyph === 32) return 4
    for (let x = 7; x >= 0; x--) {
      for (let y = 0; y < 8; y++) {
        const index = ((Math.floor(glyph / 16) * 8 + y) * 128 + (glyph % 16) * 8 + x) * 4
        if (data[index + 2] > 0) return x + 2
      }
    }
    return 1
  })
}

export function bitmapFont(atlas: HTMLCanvasElement, charset: string): BitmapFont {
  return { atlas, charset, widths: glyphWidths(atlas.getContext('2d')!.getImageData(0, 0, 128, 128).data), tinted: new Map() }
}

function tint(font: BitmapFont, color: number) {
  let canvas = font.tinted.get(color)
  if (canvas) return canvas
  canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const pixels = font.atlas.getContext('2d')!.getImageData(0, 0, 128, 128)
  for (let i = 0; i < pixels.data.length; i += 4) {
    pixels.data[i] = Math.round(pixels.data[i] * ((color >> 16) & 255) / 255)
    pixels.data[i + 1] = Math.round(pixels.data[i + 1] * ((color >> 8) & 255) / 255)
    pixels.data[i + 2] = Math.round(pixels.data[i + 2] * (color & 255) / 255)
  }
  ctx.putImageData(pixels, 0, 0)
  if (font.tinted.size >= 32) font.tinted.clear()
  font.tinted.set(color, canvas)
  return canvas
}

function codeColor(index: number) {
  const low = ((index >> 3) & 1) * 85
  const r = ((index >> 2) & 1) * 170 + low + (index === 6 ? 85 : 0)
  const g = ((index >> 1) & 1) * 170 + low
  const b = (index & 1) * 170 + low
  return (r << 16) | (g << 8) | b
}

export function drawText(ctx: CanvasRenderingContext2D, font: BitmapFont, text: string, x: number, y: number,
  color = 0x404040, shadow = false, shadowPass = false): number {
  if (shadow) drawText(ctx, font, text, x + 1, y + 1, (color & 0xfcfcfc) >> 2, false, true)
  let cursor = x
  for (let index = 0; index < text.length; index++) {
    if (text[index] === '§' && index + 1 < text.length) {
      const value = '0123456789abcdef'.indexOf(text[++index].toLowerCase())
      color = codeColor(value < 0 ? 15 : value)
      if (shadowPass) color = (color & 0xfcfcfc) >> 2
      continue
    }
    const code = font.charset.indexOf(text[index])
    if (code < 0) continue
    const glyph = code + 32
    ctx.drawImage(tint(font, color), glyph % 16 * 8, Math.floor(glyph / 16) * 8, 8, 8, cursor, y, 8, 8)
    cursor += font.widths[glyph]
  }
  return cursor - x
}

export function unsupportedGlyphs(font: BitmapFont, text: string): string[] {
  return [...new Set([...text.replace(/§./g, '')].filter(char => !font.charset.includes(char)))]
}
