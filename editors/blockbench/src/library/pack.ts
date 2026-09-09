import { readDefinition } from './definition.ts'
import { object, keys, id, string, array, version, relativePath, pngInfo } from './checks.ts'
import { MAX_PACK_BYTES, type ComponentPack, type Category } from './types.ts'
import { readMachineTypes, machinePackSignature } from './machine-types.ts'

export type FileReader = (path: string) => Uint8Array
export function readPack(raw: unknown, read?: FileReader): ComponentPack {
  let v = object(raw, 'pack')
  const assets: Record<string, string> = Object.create(null)
  const addAssets=(raw:unknown,prefix='',folder='')=>{
    const names:Record<string,string>=Object.create(null)
    for (const [path, source] of Object.entries(object(raw ?? {}, 'assets'))) {
      relativePath(path)
      let data = source
      if (typeof data === 'string' && !data.startsWith('data:') && read) {
        const bytes = read(folder+relativePath(data)); data = 'data:image/png;base64,' + btoa(Array.from(bytes, b => String.fromCharCode(b)).join(''))
      }
      pngInfo(data)
      const target=prefix+path
      if(assets[target]!==undefined&&assets[target]!==data)throw Error(`Conflicting image asset: ${target}`)
      assets[target] = data as string;names[path]=target
    }
    return names
  }
  addAssets(v.assets)
  if (v.schema === 'butter.component.v1') {
    const { assets: _, ...component } = v
    v = { schema:'butter.pack.v1', id:v.id, title:v.title, version:v.version ?? '1.0.0', targets:['b1.7.3'], categories:typeof v.category==='string'?[{id:v.category,title:v.category.replaceAll('-',' ')}]:[], components:[component] }
  }
  keys(v,['$schema','schema','id','version','title','description','author','license','tags','targets','categories','components','assets','machine_types'],'pack')
  if (v.schema !== 'butter.pack.v1' || JSON.stringify(v.targets) !== '["b1.7.3"]') throw Error('Expected butter.pack.v1 targeting b1.7.3')
  const pack: ComponentPack = { schema:v.schema,id:id(v.id),version:version(v.version),title:string(v.title,'pack title',100),targets:['b1.7.3'],categories:[],components:[],assets }
  if(v.machine_types!==undefined)pack.machine_types=readMachineTypes(v.machine_types)
  for (const key of ['description','author','license'] as const) if(v[key]!==undefined)pack[key]=string(v[key],key,key==='description'?500:100)
  if(v.tags!==undefined)pack.tags=array(v.tags,'tags',20).map(s=>string(s,'tag',40))
  const category = (raw: unknown) => {
    const c=object(raw,'category');keys(c,['id','title','icon'],'category')
    const value: Category={id:id(c.id),title:string(c.title,'category title',100)}
    if(c.icon!==undefined)value.icon=string(c.icon,'category icon',100)
    const existing=pack.categories.find(c=>c.id===value.id)
    if(existing && JSON.stringify(existing)!==JSON.stringify(value))throw Error(`Conflicting category ${value.id}`)
    if(!existing)pack.categories.push(value)
    return value.id
  }
  array(v.categories ?? [],'categories',32).forEach(category)
  const ids=new Set<string>()
  pack.components=array(v.components,'components',64).map(raw => {
    const source=typeof raw==='string' && read ? JSON.parse(new TextDecoder().decode(read(relativePath(raw)))) : raw
    const {assets:localAssets,...item}=structuredClone(object(source,'component'))
    if(localAssets!==undefined) {
      const names=addAssets(localAssets,`${id(item.id)}/`,typeof raw==='string'?raw.slice(0,raw.lastIndexOf('/')+1):'')
      const remap=(layers:unknown)=>{if(Array.isArray(layers))for(const layer of layers)if(layer&&names[layer.asset])layer.asset=names[layer.asset]}
      remap(item.layers);if(Array.isArray(item.variants))item.variants.forEach(v=>remap(v?.layers))
    }
    if(typeof item.category==='object')item.category=category(item.category)
    if(!pack.categories.some(c=>c.id===item.category))throw Error(`Undeclared category: ${item.category}`)
    const def=readDefinition(item,assets)
    if(ids.has(def.id))throw Error(`Duplicate component ${def.id}`);ids.add(def.id);return def
  })
  if(!pack.components.length)throw Error('Pack must contain components')
  if (Object.keys(assets).length > 64) throw Error('Maximum 64 PNG assets per pack')
  if(new TextEncoder().encode(JSON.stringify(pack)).length>MAX_PACK_BYTES)throw Error('Pack exceeds 2 MB')
  return pack
}

export function combinePacks(packs: ComponentPack[], metadata: {id:string;version:string;title:string}) {
  const categories: Category[]=[], components: ComponentPack['components']=[], assets: Record<string,string>={}
  for(const pack of packs) {
    const prefix=`${pack.id}/${pack.version}/`
    for(const [path,data] of Object.entries(pack.assets))assets[prefix+path]=data
    for(const c of pack.categories)categories.push({...c,id:`${pack.id}.${c.id}`})
    for(const original of pack.components) {
      const def=structuredClone(original);def.id=`${pack.id}.${def.id}`;def.category=`${pack.id}.${def.category}`
      for(const layer of [...def.layers ?? [],...def.variants.flatMap(v=>v.layers ?? [])])if(layer.asset)layer.asset=prefix+layer.asset
      components.push(def)
    }
  }
  const machineTypes=new Map<string,NonNullable<ComponentPack['machine_types']>[number]>()
  for(const pack of packs)for(const typePack of pack.machine_types??[]){
    const previous=machineTypes.get(typePack.id)
    if(previous&&machinePackSignature(previous)!==machinePackSignature(typePack))throw Error(`Conflicting machine pack: ${typePack.id}`)
    machineTypes.set(typePack.id,typePack)
  }
  return readPack({schema:'butter.pack.v1',...metadata,targets:['b1.7.3'],categories,components,assets,...(machineTypes.size?{machine_types:[...machineTypes.values()]}:{})})
}
