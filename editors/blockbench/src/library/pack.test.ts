import { describe, test, expect } from 'bun:test'
import { zipSync, strToU8 } from 'fflate'
import { techPack, starterPack } from './templates.ts'
import { readPack, combinePacks } from './pack.ts'
import { exportArchive, importArchive, packFiles } from './archive.ts'
import { ComponentLibrary } from './registry.ts'
import { readPng } from './png.ts'

describe('declarative package import',()=>{
  test('the original Tech Pack and all assets survive a portable ZIP round-trip',()=>{
    const pack=techPack(),roundtrip=importArchive(exportArchive(pack))
    expect(roundtrip).toEqual(pack)
    expect(pack.components).toHaveLength(8)
    expect(pack.components.find(c=>c.id==='fluid-port')!.variants.map(v=>v.id)).toEqual(['input','output','bidirectional'])
    const files=packFiles(pack)
    expect(importArchive(zipSync(Object.fromEntries(Object.entries(files).map(([p,b])=>[`Tech Pack/${p}`,b]))))).toEqual(pack)
    expect(Object.keys(files).filter(p=>p.endsWith('.png'))).toHaveLength(2)
  })
  test('standalone components declare categories and component-local images in a containing pack',()=>{
    const pack=techPack(),component={...pack.components[0],category:{id:'ports',title:'Ports'},assets:pack.assets}
    const standalone=readPack(component)
    expect(standalone.categories).toEqual([{id:'ports',title:'Ports'}])
    expect(standalone.components[0].layers![1].asset).toBe('port-mark.png')
    const nested=readPack({schema:'butter.pack.v1',id:'nested',version:'1.0.0',title:'Nested',targets:['b1.7.3'],components:[component]})
    expect(nested.components[0].layers![1].asset).toBe('fluid-port/port-mark.png')
    expect(nested.assets['fluid-port/port-mark.png']).toBe(pack.assets['port-mark.png'])
    expect(readPack({...component,category:'ports'}).categories[0].id).toBe('ports')
  })
  test('folder reader resolves component-local assets relative to that component file',()=>{
    const png=techPack().assets['port-mark.png'],bytes=Uint8Array.from(atob(png.slice(22)),c=>c.charCodeAt(0))
    const component={...techPack().components[0],category:{id:'ports',title:'Ports'},assets:{'port-mark.png':'images/mark.png'}}
    const files={'parts/port/component.json':strToU8(JSON.stringify(component)),'parts/port/images/mark.png':bytes}
    const pack=readPack({schema:'butter.pack.v1',id:'local',version:'1.0.0',title:'Local',targets:['b1.7.3'],components:['parts/port/component.json']},path=>{
      const bytes=files[path as keyof typeof files];if(!bytes)throw Error(`Missing ${path}`);return bytes
    })
    expect(pack.assets['fluid-port/port-mark.png']).toBe(png)
  })
  test('scripts, traversal, missing assets, incompatible fields and bad frames fail closed',()=>{
    for(const mutate of [
      (p:any)=>p.script='alert(1)',(p:any)=>p.targets=['1.21'],(p:any)=>p.version='latest',
      (p:any)=>p.components[0].base='constructor',(p:any)=>p.components[0].category='absent',
      (p:any)=>p.components[0].variants.push(p.components[0].variants[0]),
      (p:any)=>p.components[0].variants[0].base_bounds=[10,10,18,18],
      (p:any)=>p.components[0].fields.push({key:'sample',label:'Reserved',type:'text',default:''}),
      (p:any)=>p.components[0].layers[1].asset='../mark.png',
      (p:any)=>p.components[0].layers[1].frames=100,
      (p:any)=>p.components[0].layers[1].when={field:'marked',equals:'true'},
      (p:any)=>p.components[0].semantics={slot:99},
      (p:any)=>p.components[0].semantics={capabilities:['enabled']},
      (p:any)=>p.components[0].semantics={attributes:{enabled:'true'}},
    ]) {const pack=structuredClone(techPack());mutate(pack);expect(()=>readPack(pack)).toThrow()}
    expect(()=>importArchive(zipSync({'../pack.json':strToU8('{}')}))).toThrow('Unsafe')
    expect(()=>importArchive(zipSync({'plugin.js':strToU8('alert(1)')}))).toThrow('JSON and PNG')
    expect(()=>importArchive(zipSync({'pack.json':new Uint8Array(3*1024*1024)}))).toThrow('expanded size')
    expect(()=>importArchive(zipSync({'unrelated.json':strToU8('{}')}))).toThrow('needs one')
  })
  test('PNG verification rejects truncated chunks and checksum changes before installation',()=>{
    const data=techPack().assets['port-mark.png'],bytes=Uint8Array.from(atob(data.slice(22)),c=>c.charCodeAt(0))
    expect(readPng(data).w).toBe(6)
    const encode=(b:Uint8Array)=>'data:image/png;base64,'+btoa(Array.from(b,c=>String.fromCharCode(c)).join(''))
    expect(()=>readPng(encode(bytes.slice(0,bytes.length-4)))).toThrow('Truncated')
    const changed=bytes.slice();changed[40]^=1
    expect(()=>readPng(encode(changed))).toThrow('checksum')
  })
  test('combining preserves asset references and namespaces components and categories',()=>{
    const pack=techPack(),other=starterPack('other','Other','fluid-port','slot')
    const combined=combinePacks([pack,other],{id:'combined',title:'Combined',version:'2.0.0'})
    expect(combined.components).toHaveLength(9)
    expect(combined.components[0].id).toBe('butter-tech.fluid-port')
    expect(combined.components[0].layers![1].asset).toBe('butter-tech/1.0.0/port-mark.png')
    expect(importArchive(exportArchive(combined))).toEqual(combined)
  })
})
describe('persistent immutable library versions',()=>{
  test('dry runs, duplicate imports, conflicting versions, reload and enable controls',()=>{
    let saved='';const storage={getItem:()=>saved,setItem:(_:string,value:string)=>{saved=value}}
    const registry=new ComponentLibrary(storage),pack=techPack()
    expect(registry.install(pack,'pack.json',true).status).toBe('ready');expect(registry.revision).toBe(0)
    registry.install(pack,'pack.json');expect(registry.revision).toBe(1)
    expect(registry.install({...pack,assets:Object.fromEntries(Object.entries(pack.assets).reverse())}).status).toBe('unchanged')
    const changed=structuredClone(pack);changed.components[0].title='New port'
    expect(()=>registry.install(changed)).toThrow('increment');expect(registry.revision).toBe(1)
    changed.version='1.1.0';registry.install(changed)
    expect(registry.catalog()).toHaveLength(8)
    expect(registry.catalog('','butter-tech@1.0.0')).toHaveLength(8)
    registry.enable('butter-tech@1.0.0',false);expect(registry.catalog()).toHaveLength(8)
    expect(new ComponentLibrary(storage).list()).toEqual(registry.list())
    expect(()=>registry.check(0)).toThrow('revision conflict')
    registry.remove('butter-tech@1.0.0');expect(registry.list()).toHaveLength(1)
  })
  test('failed persistence never changes in-memory state or revision',()=>{
    const registry=new ComponentLibrary({getItem:()=>null,setItem:()=>{throw Error('quota')}})
    expect(()=>registry.install(techPack())).toThrow('quota')
    expect(registry.list()).toEqual([]);expect(registry.revision).toBe(0)
  })
})
