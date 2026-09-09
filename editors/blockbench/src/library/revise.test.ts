import { test, expect } from 'bun:test'
import { ComponentLibrary, library } from './registry.ts'
import { revisePack } from './revise.ts'
import { techPack, starterPack } from './templates.ts'
import { readPack, combinePacks } from './pack.ts'
import { importArchive, exportArchive } from './archive.ts'
import { EditorStore } from '../store.ts'
import { readDocument } from '../document.ts'
import { addComponent } from './instances.ts'
import { allComponents, componentCategories, componentPage } from '../component-catalog.ts'

test('resolve adopts legacy packs, enforces mod ownership and preserves versions across reload',()=>{
  let saved='';const storage={getItem:()=>saved,setItem:(_:string,value:string)=>{saved=value}}
  const registry=new ComponentLibrary(storage),pack=techPack();registry.install(pack)
  expect(registry.resolve('example').primary).toBeUndefined()
  expect(registry.resolve('example').unassociated).toHaveLength(1)
  const result=revisePack(registry,{pack:'butter-tech@1.0.0',mod:{id:'example'}})
  expect(result.key).toBe('butter-tech@1.0.1')
  expect(registry.resolve('example').primary?.pack.mod).toEqual({id:'example',role:'primary'})
  expect(()=>registry.install({...pack,id:'another',mod:{id:'example'}})).toThrow('already has primary')
  expect(()=>registry.install({...pack,id:'another',mod:{id:'example',role:'addon'}})).toThrow('reason')
  registry.install({...pack,id:'another',mod:{id:'example',role:'addon',reason:'Optional compatibility module'}})
  expect(registry.resolve('example').addons).toHaveLength(1)
  expect(()=>revisePack(registry,{pack:result.key,mod:{id:'different'}})).toThrow('Preserve')
  expect(new ComponentLibrary(storage).list()).toEqual(registry.list())
  expect(registry.install(pack).status).toBe('unchanged')
})

test('revision upserts preserve existing definitions, assets, metadata and pinned projects',()=>{
  const registry=new ComponentLibrary(),pack=techPack(),doc=new EditorStore().snapshot()
  registry.install(pack);addComponent(doc,pack,pack.components[0]!.id,doc.root.id)
  const before=readDocument(doc),addition={...pack.components[0],id:'second-port',title:'Second port',category:'fluid'}
  const args={pack:'butter-tech@1.0.0',components:[addition],categories:[{id:'machine',title:'Machine'},{id:'fluid',title:'Fluid',parent:'machine'}]}
  const preview=revisePack(registry,{...args,dry_run:true})
  expect(preview.status).toBe('ready');expect(registry.list()).toHaveLength(1)
  const result=revisePack(registry,args)
  expect(result.pack.components).toHaveLength(9)
  expect(result.pack.components.slice(0,8)).toEqual(pack.components)
  expect(result.pack.assets).toEqual(pack.assets)
  expect(readDocument(JSON.parse(JSON.stringify(doc)))).toEqual(before)
  expect(importArchive(exportArchive(result.pack))).toEqual(result.pack)
  expect(registry.catalog('machine fluid')[0]?.id).toBe('second-port')
  const changed={...addition,title:'Updated port'}
  const updated=revisePack(registry,{pack:result.key,components:[changed],version:'1.10.0'})
  expect(updated.pack.components).toHaveLength(9)
  expect(updated.pack.components.at(-1)?.title).toBe('Updated port')
  expect(registry.get('butter-tech@1.0.1').pack.components.at(-1)?.title).toBe('Second port')
  expect(revisePack(registry,{pack:updated.key,components:[changed]}).status).toBe('unchanged')
  expect(()=>revisePack(registry,args)).toThrow('Stale base')
  expect(()=>revisePack(registry,{pack:updated.key,title:'New',version:'1.9.0'})).toThrow('newer')
})

test('invalid category trees and duplicate updates fail before changing the registry',()=>{
  const registry=new ComponentLibrary();registry.install(techPack());const before=registry.list()
  for(const categories of [
    [{id:'a',title:'A',parent:'missing'}],
    [{id:'a',title:'A',parent:'b'},{id:'b',title:'B',parent:'a'}],
    [{id:'a',title:'A'},{id:'a',title:'A'}],
    Array.from({length:9},(_,i)=>({id:`a${i}`,title:'A',...(i?{parent:`a${i-1}`}:{})})),
  ])expect(()=>revisePack(registry,{pack:'butter-tech@1.0.0',categories})).toThrow()
  expect(()=>revisePack(registry,{pack:'butter-tech@1.0.0',components:[techPack().components[0],techPack().components[0]]})).toThrow('Duplicate')
  expect(()=>revisePack(registry,{pack:'butter-tech@1.0.0',title:'New',expected_library_revision:0})).toThrow('revision conflict')
  expect(registry.list()).toEqual(before);expect(registry.revision).toBe(1)
})

test('grouped numeric versions show only latest enabled, with explicit historical access',()=>{
  const registry=new ComponentLibrary(),pack=techPack()
  for(const version of ['1.9.0','1.10.0','1.2.0'])registry.install({...pack,version})
  expect(registry.groups()[0]?.versions.map(e=>e.pack.version)).toEqual(['1.10.0','1.9.0','1.2.0'])
  expect(registry.catalog()).toHaveLength(8);expect(registry.catalog()[0]?.pack).toBe('butter-tech@1.10.0')
  expect(registry.catalog('','butter-tech@1.2.0')).toHaveLength(8)
  registry.enable('butter-tech@1.10.0',false)
  expect(registry.catalog()[0]?.pack).toBe('butter-tech@1.9.0')
})

test('parent filters include descendants and combined packs remap parent references',()=>{
  const pack=starterPack('hierarchy-proof','Hierarchy','child','slot')
  pack.categories=[{id:'parent',title:'Parent'},{id:'child',title:'Child',parent:'parent'}];pack.components[0]!.category='child'
  const parsed=readPack(pack),combined=combinePacks([parsed],{id:'combined',title:'Combined',version:'1.0.0'})
  expect(combined.categories[1]?.parent).toBe('hierarchy-proof.parent')
  const registry=library();registry.install(parsed)
  try{
    expect(componentCategories('hierarchy-proof@1.0.0').map(c=>c.title)).toEqual(['Hierarchy · Parent','Hierarchy · Parent / Child'])
    expect(componentPage('','hierarchy-proof@1.0.0/parent',1,allComponents()).items.map(c=>c.component)).toContain('child')
  }finally{registry.remove('hierarchy-proof@1.0.0')}
})

test('failed revision persistence retains old content and revision',()=>{
  let fail=false
  const registry=new ComponentLibrary({getItem:()=>null,setItem:()=>{if(fail)throw Error('quota')}})
  registry.install(techPack());fail=true
  expect(()=>revisePack(registry,{pack:'butter-tech@1.0.0',title:'New'})).toThrow('quota')
  expect(registry.list()).toHaveLength(1);expect(registry.revision).toBe(1)
})
