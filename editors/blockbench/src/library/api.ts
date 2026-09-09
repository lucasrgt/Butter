import { current, persist, refresh } from '../host.ts'
import { expectedRevision } from '../editor-args.ts'
import { readDocument } from '../document.ts'
import { writeLocal } from '../local-files.ts'
import { library } from './registry.ts'
import { loadPack } from './local.ts'
import { readPack, combinePacks } from './pack.ts'
import { exportArchive } from './archive.ts'
import { addComponent, upgradeComponent, detachComponent } from './instances.ts'
import { definition, resolvedComponent, resolvedSemantics } from './document.ts'
import { starterPack } from './templates.ts'
import { COMPONENT_SCHEMA, PACK_SCHEMA } from './schema.ts'
import type { Kind } from '../../../gui-builder/src/model/types.ts'
import { requireNode } from '../operations.ts'
import { revisePack } from './revise.ts'

const string=(value:unknown,label:string)=>{if(typeof value!=='string'||!value.trim())throw Error(`Expected ${label}`);return value}
export function libraryCall(args:Record<string,unknown>) {
  const registry=library(),action=args.action??'list'
  if(action==='schema')return {component:COMPONENT_SCHEMA,pack:PACK_SCHEMA,limits:{pack_bytes:2*1024*1024,library_bytes:8*1024*1024,versions:32},layers:['rect','outline','image','text','fill']}
  if(action==='resolve')return registry.resolve(string(args.mod_id,'mod_id'))
  if(action==='revise'){const result=revisePack(registry,args);if(args.dry_run!==true)refresh();return result}
  if(action==='scaffold') {
    const pack=starterPack(string(args.pack_id,'pack_id'),string(args.title,'title'),string(args.component??'my-component','component'),string(args.base??'slot','base') as Kind)
    if(args.version!==undefined)pack.version=string(args.version,'version')
    const valid=readPack({...pack,...(args.mod===undefined?{}:{mod:args.mod})})
    registry.install(valid,undefined,true)
    if(args.path)writeLocal(string(args.path,'path'),exportArchive(valid))
    return {pack:valid,path:args.path}
  }
  if(action==='catalog') {
    const entries=registry.catalog(typeof args.search==='string'?args.search:'',args.pack as string),size=Number(args.page_size??20),page=Number(args.page??1)
    if(!Number.isInteger(size)||size<1||size>50||!Number.isInteger(page)||page<1)throw Error('Catalog requires page >= 1 and page_size 1–50')
    return {components:entries.slice((page-1)*size,page*size),total:entries.length,page,page_size:size,revision:registry.revision}
  }
  if(action==='list')return {packs:registry.list().map(e=>({key:`${e.pack.id}@${e.pack.version}`,title:e.pack.title,mod:e.pack.mod,enabled:e.enabled,source:e.source,components:e.pack.components.length,categories:e.pack.categories})),groups:registry.groups().map(g=>({id:g.id,versions:g.versions.map(e=>e.pack.version)})),revision:registry.revision}
  registry.check(args.expected_library_revision)
  if(['import','validate','reload'].includes(String(action))) {
    const source=action==='reload'?registry.get(string(args.pack,'pack')).source:args.path
    const pack=source?loadPack(string(source,'path')):readPack(args.pack_data)
    const result=registry.install(pack,source as string|undefined,action==='validate')
    if(action!=='validate')refresh();return {...result,pack:action==='validate'?pack:undefined}
  }
  if(action==='combine') {
    if(!Array.isArray(args.packs)||args.packs.length<1||args.packs.length>16)throw Error('Choose 1–16 packs')
    const pack=combinePacks(args.packs.map(key=>registry.get(string(key,'pack key')).pack),{id:string(args.pack_id,'pack_id'),version:string(args.version,'version'),title:string(args.title,'title')})
    const result=registry.install(pack,undefined,args.dry_run===true);refresh();return result
  }
  const key=string(args.pack,'pack')
  if(action==='export') {
    const pack=registry.get(key).pack
    if(args.path){writeLocal(string(args.path,'output path'),exportArchive(pack));return {path:args.path}}
    return {pack}
  }
  if(action==='remove')registry.remove(key)
  else if(action==='enable'){if(typeof args.enabled!=='boolean')throw Error('Expected enabled boolean');registry.enable(key,args.enabled)}
  else throw Error('Unknown library action')
  refresh();return {revision:registry.revision}
}
export function customComponentCall(args:Record<string,unknown>) {
  const store=current(),doc=store.snapshot(),action=args.action??'inspect'
  let id=string(args.id??store.selected,'widget id')
  if(action!=='add')requireNode(doc,id)
  if(action!=='inspect') {
    store.assertIdle();store.checkRevision(expectedRevision(args))
    if(action==='detach')detachComponent(doc,id)
    else if(action==='add'||action==='upgrade') {
      const entry=library().get(string(args.pack,'pack'))
      if(!entry.enabled)throw Error('Enable this pack before using it')
      if(action==='add')id=addComponent(doc,entry.pack,string(args.component,'component'),string(args.parent_id??doc.root.id,'parent id'),args.name as string,args.x as number,args.y as number)
      else upgradeComponent(doc,id,entry.pack,args.component as string)
    } else throw Error('Unknown component action')
    const valid=readDocument(doc)
    if(args.dry_run===true)return {valid:true,widget_id:id,definition:definition(valid,id),document:valid}
    store.commit(valid,undefined,[id],`${action} custom component`);persist()
  }
  const result=store.snapshot()
  return {widget_id:id,reference:result.component_refs?.[id],...resolvedComponent(result,id),semantics:resolvedSemantics(result)[id],revision:store.revision}
}
