import type { ButterDocument } from '../document.ts'
import type { Box } from '../../../gui-builder/src/model/types.ts'
import type { MinecraftAssets } from '../minecraft/assets.ts'
import { paintComponent } from '../minecraft/component-preview.ts'
import { drawText } from '../minecraft/font.ts'
import { componentFields, previewFields } from '../component-properties.ts'
import { resolvedComponent } from './document.ts'
import { componentImage } from './images.ts'
import type { Layer } from './types.ts'

export function paintCustom(ctx:CanvasRenderingContext2D,box:Box,doc:ButterDocument,assets?:MinecraftAssets|null,time=0) {
  const {def,variant,props,preview}=resolvedComponent(doc,box.id)
  if(!def||!variant)return false
  const state={...props,...preview},fields=[...componentFields(def.base,def),...previewFields(def.base)]
  const bounds=variant.base_bounds??[0,0,box.w,box.h]
  ctx.save();ctx.beginPath();ctx.rect(box.x,box.y,box.w,box.h);ctx.clip()
  if(def.draw_base)paintComponent(ctx,{...box,x:box.x+bounds[0],y:box.y+bounds[1],w:bounds[2],h:bounds[3]},
    {...doc,components:{[box.id]:{variant:variant.base_variant,props}},preview:{[box.id]:preview??{}}},assets,time)
  const pack=doc.library![doc.component_refs![box.id].pack]
  const paint=(layer:Layer)=>{
    if(layer.when && state[layer.when.field]!==layer.when.equals)return
    const x=box.x+layer.x,y=box.y+layer.y,w=layer.w,h=layer.h
    const color=layer.color?.startsWith('$')?String(state[layer.color.slice(1)]):layer.color??'#ffffff'
    ctx.save();ctx.globalAlpha=layer.opacity??1;ctx.fillStyle=color
    if(layer.type==='rect')ctx.fillRect(x,y,w,h)
    else if(layer.type==='outline') {
      const t=Math.min(layer.thickness??1,w,h)
      ctx.fillRect(x,y,w,t);ctx.fillRect(x,y+h-t,w,t);ctx.fillRect(x,y,t,h);ctx.fillRect(x+w-t,y,t,h)
    } else if(layer.type==='fill') {
      const field=fields.find(f=>f.key===layer.value)!,min=field.min??0,max=field.max??100
      const ratio=max===min?0:Math.max(0,Math.min(1,(Number(state[layer.value!])-min)/(max-min)))
      const vertical=['up','down'].includes(layer.direction!),amount=Math.floor((vertical?h:w)*ratio)
      ctx.fillRect(x+(layer.direction==='left'?w-amount:0),y+(layer.direction==='up'?h-amount:0),vertical?w:amount,vertical?amount:h)
    } else if(layer.type==='text') {
      const text=layer.text!.startsWith('$')?String(state[layer.text!.slice(1)]):layer.text!
      ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip()
      if(assets)drawText(ctx,assets.font,text,x,y,parseInt(color.slice(1),16))
      else{ctx.font='9px monospace';ctx.textBaseline='top';ctx.fillText(text,x,y)}
    } else if(layer.type==='image') {
      const image=componentImage(pack.assets[layer.asset!]),crop=layer.crop!
      const frame=Math.floor(time/layer.frame_ms!)%layer.frames!
      if(image)ctx.drawImage(image,crop[0],crop[1]+crop[3]*frame,crop[2],crop[3],x,y,w,h)
    }
    ctx.restore()
  }
  for(const layer of [...def.layers??[],...variant.layers??[]])paint(layer)
  ctx.restore();return true
}
export function customAnimation(doc:ButterDocument,id:string) {
  const {def,variant,preview}=resolvedComponent(doc,id)
  return !!def && ([...def.layers??[],...variant?.layers??[]].some(l=>(l.frames??1)>1)
    || ['tank','gas'].includes(def.base)&&Number(preview?.level)>0&&preview?.animated!==false)
}
