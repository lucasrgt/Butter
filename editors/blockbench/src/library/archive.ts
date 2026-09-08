import { unzipSync, zipSync, strToU8 } from 'fflate'
import { relativePath } from './checks.ts'
import { readPack } from './pack.ts'
import type { ComponentPack } from './types.ts'
import { PACK_SCHEMA, COMPONENT_SCHEMA } from './schema.ts'

export function importArchive(bytes: Uint8Array) {
  if(bytes.length>3*1024*1024)throw Error('Archive exceeds 3 MB')
  let total=0,count=0
  const seen=new Set<string>()
  const files=unzipSync(bytes,{filter: entry => {
    if(++count>192)throw Error('Archive has too many entries')
    if(entry.name.endsWith('/')){relativePath(entry.name.slice(0,-1));return false}
    relativePath(entry.name)
    if(seen.has(entry.name))throw Error('Duplicate archive entry');seen.add(entry.name)
    if(!/\.(json|png)$/i.test(entry.name))throw Error('Archives accept JSON and PNG files only')
    total+=entry.originalSize
    if(seen.size>160 || entry.originalSize>2*1024*1024 || total>4*1024*1024)throw Error('Archive expanded size exceeds limits')
    return true
  }})
  let manifest=files['pack.json']?'pack.json':files['component.json']?'component.json':undefined
  if(!manifest) {
    const candidates=Object.keys(files).filter(path=>/^[^/]+\/(pack|component)\.json$/.test(path))
    if(candidates.length!==1)throw Error('Archive needs one pack.json or component.json at its root or in one top folder')
    manifest=candidates[0]
  }
  const prefix=manifest.slice(0,manifest.lastIndexOf('/')+1)
  const read=(path:string)=>{relativePath(path);if(!files[prefix+path])throw Error(`Missing file: ${path}`);return files[prefix+path]}
  return readPack(JSON.parse(new TextDecoder().decode(files[manifest])),read)
}
export function packFiles(pack: ComponentPack): Record<string,Uint8Array> {
  const files: Record<string,Uint8Array>={}, assets:Record<string,string>={}
  let index=0
  for(const [key,data] of Object.entries(pack.assets)) {
    const path=`assets/image-${index++}.png`;assets[key]=path
    files[path]=Uint8Array.from(atob(data.slice(22)),c=>c.charCodeAt(0))
  }
  const components=pack.components.map((def,i)=>{
    const path=`components/${i}-${def.id}.json`;files[path]=strToU8(JSON.stringify({$schema:'../schemas/component.schema.json',...def},null,2));return path
  })
  files['pack.json']=strToU8(JSON.stringify({$schema:'schemas/pack.schema.json',...pack,components,assets},null,2))
  files['schemas/pack.schema.json']=strToU8(JSON.stringify(PACK_SCHEMA,null,2))
  files['schemas/component.schema.json']=strToU8(JSON.stringify(COMPONENT_SCHEMA,null,2))
  return files
}
export const exportArchive=(pack:ComponentPack)=>zipSync(packFiles(pack),{level:6})
