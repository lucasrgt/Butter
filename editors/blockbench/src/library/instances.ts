import type { ButterDocument } from '../document.ts'
import { add, requireNode } from '../operations.ts'
import { freezePositions, setPosition } from '../position.ts'
import { inheritedFlag } from '../selection.ts'
import { readValues, componentFields, componentVariants } from '../component-properties.ts'
import { pinPack, definition, resolvedComponent, resolvedSemantics, prunePacks } from './document.ts'
import type { ComponentPack } from './types.ts'

export function addComponent(doc:ButterDocument,pack:ComponentPack,component:string,parent:string,name?:string,x?:number,y?:number) {
  const def=pack.components.find(d=>d.id===component);if(!def)throw Error('Unknown custom component')
  if(inheritedFlag(doc,parent,'locked'))throw Error('Unlock the target group first')
  freezePositions(doc)
  const key=pinPack(doc,pack),id=add(doc,def.base,parent,name)
  doc.component_refs??={};doc.component_refs[id]={pack:key,component}
  doc.components??={};doc.components[id]={variant:def.variants[0].id}
  if(x!==undefined || y!==undefined) {
    if(!Number.isInteger(x)||!Number.isInteger(y))throw Error('Expected both integer coordinates')
    setPosition(doc,id,x!,y!)
  }
  return id
}
export function upgradeComponent(doc:ButterDocument,id:string,pack:ComponentPack,component?:string) {
  const node=requireNode(doc,id),old=definition(doc,id),next=pack.components.find(c=>c.id===(component??old?.id))
  if(!old||!next||node.kind!==next.base)throw Error('Upgrade requires compatible component bases')
  if(inheritedFlag(doc,id,'locked'))throw Error('Unlock this layer first')
  const config=doc.components?.[id]
  if(config?.variant && !next.variants.some(v=>v.id===config.variant))throw Error('Selected variant is absent in the new version; choose a shared variant first')
  readValues(componentFields(node.kind,next),config?.props??{})
  freezePositions(doc);const key=pinPack(doc,pack);doc.component_refs![id]={pack:key,component:next.id};prunePacks(doc)
}
export function detachComponent(doc:ButterDocument,id:string) {
  const node=requireNode(doc,id),resolved=resolvedComponent(doc,id)
  if(!resolved.def)throw Error('Select a custom component')
  if(inheritedFlag(doc,id,'locked'))throw Error('Unlock this layer first')
  freezePositions(doc);doc.semantics![id]=resolvedSemantics(doc)[id]
  const bounds=resolved.variant?.base_bounds
  if(bounds&&doc.positions?.[id]){doc.positions[id].x+=bounds[0];doc.positions[id].y+=bounds[1]}
  doc.components![id]={variant:resolved.variant?.base_variant??componentVariants(node.kind)[0].id,
    props:Object.fromEntries(Object.entries(resolved.props??{}).filter(([key])=>componentFields(node.kind).some(f=>f.key===key)))}
  doc.preview??={};doc.preview[id]=resolved.preview??{}
  delete doc.component_refs![id];prunePacks(doc)
}
