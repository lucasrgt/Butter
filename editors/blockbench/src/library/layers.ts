import type { Field } from '../component-properties.ts'
import type { Layer } from './types.ts'
import { array, object, keys, string, integer, relativePath, pngInfo } from './checks.ts'

export function readLayers(raw: unknown, assets: Record<string, string>, fields: Field[]): Layer[] {
  const reference = (value: unknown, type?: string) => {
    const key = string(value, 'property reference', 80)
    const field = fields.find(f => f.key === key)
    if (!field || type && field.type !== type) throw new Error(`Unknown or incompatible layer property: ${key}`)
    return key
  }
  const color = (value: unknown) => {
    const c = string(value, 'layer color', 90)
    if (c.startsWith('$')) reference(c.slice(1), 'color')
    else if (!/^#[a-f0-9]{6}$/i.test(c)) throw new Error('Expected hex color or $color_property')
    return c
  }
  return array(raw ?? [], 'layers', 64).map(rawLayer => {
    const v = object(rawLayer, 'layer')
    keys(v, ['type','x','y','w','h','color','text','asset','crop','thickness','opacity','direction','value','frames','frame_ms','when'], 'layer')
    if (!['rect','outline','image','text','fill'].includes(v.type)) throw new Error('Unknown layer primitive')
    const layer: Layer = { type: v.type, x: integer(v.x, 'layer x', -512, 512), y: integer(v.y, 'layer y', -512, 512),
      w: integer(v.w, 'layer width', 1, 512), h: integer(v.h, 'layer height', 1, 512) }
    if (v.type !== 'image') layer.color = color(v.color ?? '#ffffff')
    if (v.opacity !== undefined) {
      if (typeof v.opacity !== 'number' || !Number.isFinite(v.opacity) || v.opacity < 0 || v.opacity > 1) throw new Error('Opacity must be 0–1')
      layer.opacity = v.opacity
    }
    if (v.type === 'outline') layer.thickness = integer(v.thickness ?? 1, 'outline thickness', 1, 16)
    if (v.type === 'text') {
      layer.text = string(v.text, 'layer text', 200)
      if (layer.text.startsWith('$')) reference(layer.text.slice(1))
    }
    if (v.type === 'fill') {
      layer.value = reference(v.value ?? 'level', 'number')
      if (!['up','down','left','right'].includes(v.direction ?? 'up')) throw new Error('Invalid fill direction')
      layer.direction = v.direction ?? 'up'
    }
    if (v.type === 'image') {
      layer.asset = relativePath(v.asset)
      if (!assets[layer.asset]) throw new Error(`Missing image asset: ${layer.asset}`)
      layer.frames = integer(v.frames ?? 1, 'animation frames', 1, 128)
      const size = pngInfo(assets[layer.asset]), crop = v.crop ?? [0,0,size.w,size.h/layer.frames]
      if (array(crop, 'image crop', 4).length !== 4) throw new Error('Image crop needs x/y/w/h')
      layer.crop = crop.map((n: unknown, i: number) => integer(n, 'image crop', i > 1 ? 1 : 0, 1024))
      layer.frame_ms = integer(v.frame_ms ?? 100, 'animation duration', 20, 10000)
      if (crop[0]+crop[2]>size.w || crop[1]+crop[3]*layer.frames>size.h) throw new Error('Image frames/crop exceed PNG bounds')
    }
    if (v.when !== undefined) {
      const when = object(v.when, 'layer condition'); keys(when, ['field','equals'], 'condition')
      const key = reference(when.field), field = fields.find(f => f.key === key)!
      if (typeof when.equals !== typeof field.default) throw new Error('Layer condition type mismatch')
      layer.when = { field: key, equals: when.equals }
    }
    return layer
  })
}
