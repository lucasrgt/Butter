import type { Widget } from '../../../gui-builder/src/model/types.ts'
import type { ButterDocument } from '../document.ts'
import { componentFields, previewFields, values } from '../component-properties.ts'
import { readSemantics } from '../semantics-model.ts'
import { readPack } from './pack.ts'
import { packKey, type LibraryDocument, type ComponentPack } from './types.ts'
import { object, keys } from './checks.ts'
import { contentIdentity } from './identity.ts'

export function definition(doc:LibraryDocument,id:string) {
  const ref=doc.component_refs?.[id]
  return ref ? doc.library?.[ref.pack]?.components.find(c=>c.id===ref.component) : undefined
}
export function resolvedComponent(doc:ButterDocument,id:string) {
  const def=definition(doc,id),config=doc.components?.[id]
  const variant=def?.variants.find(v=>v.id===config?.variant)??def?.variants[0]
  return {def,variant,props: def?values([...componentFields(def.base),...def.fields??[]],{...def.props,...variant?.props,...config?.props}):config?.props,
    preview:def?values(previewFields(def.base),{...def.preview,...variant?.preview,...doc.preview?.[id]}):doc.preview?.[id]}
}
export function resolvedSemantics(doc:ButterDocument) {
  const configs=readSemantics(doc.root,doc.semantics)
  for(const id of Object.keys(doc.component_refs??{})) {
    const {def,variant}=resolvedComponent(doc,id)
    configs[id]={...def?.semantics,...variant?.semantics,...configs[id]}
  }
  return readSemantics(doc.root,configs)
}
export function pinPack(doc:LibraryDocument,pack:ComponentPack) {
  const key=packKey(pack);doc.library??={}
  if(doc.library[key] && contentIdentity(doc.library[key])!==contentIdentity(pack))throw Error(`Pinned pack conflict: ${key}`)
  doc.library[key]=structuredClone(pack);return key
}
export function prunePacks(doc:LibraryDocument) {
  const used=new Set(Object.values(doc.component_refs??{}).map(r=>r.pack))
  for(const key of Object.keys(doc.library??{}))if(!used.has(key))delete doc.library![key]
}
export function readLibrary(root:Widget,raw:LibraryDocument):LibraryDocument {
  const result:LibraryDocument={library:{},component_refs:{}}
  const nodes=new Map<string,Widget>(),visit=(n:Widget)=>{nodes.set(n.id,n);n.children.forEach(visit)};visit(root)
  for(const [key,value] of Object.entries(object(raw.library??{},'document library'))) {
    const pack=readPack(value);if(key!==packKey(pack))throw Error('Pinned pack key mismatch');result.library![key]=pack
  }
  if(Object.keys(result.library!).length>32 || JSON.stringify(result.library).length>8*1024*1024)throw Error('Document library exceeds limits')
  for(const [id,value] of Object.entries(object(raw.component_refs??{},'component references'))) {
    const ref=object(value,'component reference');keys(ref,['pack','component'],'component reference')
    if(typeof ref.pack!=='string'||typeof ref.component!=='string')throw Error('Invalid component reference')
    result.component_refs![id]={pack:ref.pack,component:ref.component}
    const def=definition(result,id)
    if(!def||def.base!==nodes.get(id)?.kind)throw Error(`Missing or incompatible custom component: ${id}`)
  }
  return result
}
