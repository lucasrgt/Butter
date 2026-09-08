import type { ComponentEntry } from '../component-catalog.ts'
import { element } from '../dom.ts'
import { library } from './registry.ts'
import { paintCustom } from './render.ts'
import { minecraftAssets } from '../minecraft/assets.ts'
import type { ButterDocument } from '../document.ts'

export function thumbnail(entry:ComponentEntry) {
  const pack=library().get(entry.pack!).pack,def=pack.components.find(c=>c.id===entry.component)!,size=def.variants[0]
  const canvas=element('canvas','butter-component-thumbnail');canvas.width=48;canvas.height=48;canvas.setAttribute('aria-hidden','true')
  const doc:ButterDocument={version:1,root:{id:'root',kind:'screen',name:'Preview',children:[]},hidden:[],
    library:{[entry.pack!]:pack},component_refs:{sample:{pack:entry.pack!,component:def.id}}}
  const ctx=canvas.getContext('2d')!,scale=Math.max(.25,Math.min(2,40/Math.max(size.w,size.h)))
  ctx.imageSmoothingEnabled=false;ctx.translate(Math.floor((48-size.w*scale)/2),Math.floor((48-size.h*scale)/2));ctx.scale(scale,scale)
  paintCustom(ctx,{id:'sample',name:def.title,kind:def.base,x:0,y:0,w:size.w,h:size.h},doc,minecraftAssets())
  return canvas
}
