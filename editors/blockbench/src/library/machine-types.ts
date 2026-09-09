import { object, keys, array, string, version } from './checks.ts'

export interface MachineField {
  type: 'number' | 'integer' | 'boolean' | 'string'
  access: 'read' | 'readwrite'
  unit?: string; min?: number; max?: number; description?: string
}
export interface MachineTypePack {
  schema: 'machine.types.v1'; id: string; version: string; title: string
  types: {id:string;label:string;capabilities:string[];properties:Record<string,MachineField>}[]
}
const name = (value:unknown, qualified=false) => {
  const s=string(value,'machine identifier',120)
  if (!(qualified?/^[a-z][a-z0-9_.-]*:[a-z][a-z0-9_.-]*$/:/^[a-zA-Z_][a-zA-Z0-9_.:-]*$/).test(s) || ['__proto__','constructor','prototype'].includes(s)) throw Error(`Invalid machine identifier: ${s}`)
  return s
}
export function readMachineTypes(raw:unknown):MachineTypePack[] {
  const ids=new Set<string>(),types=new Set<string>()
  return array(raw??[],'machine type packs',64).map(raw=>{
    const p=object(raw,'machine type pack');keys(p,['schema','id','version','title','types'],'machine type pack')
    if(p.schema!=='machine.types.v1')throw Error('Expected machine.types.v1')
    const id=name(p.id,true)
    if(ids.has(id))throw Error(`Duplicate machine pack: ${id}`);ids.add(id)
    const result:MachineTypePack={schema:p.schema,id,version:version(p.version),title:string(p.title,'machine pack title',120),types:[]}
    result.types=array(p.types,'machine types',128).map(raw=>{
      const t=object(raw,'machine type');keys(t,['id','label','capabilities','properties'],'machine type')
      const id=name(t.id,true), properties:Record<string,MachineField>=Object.create(null)
      if(types.has(id))throw Error(`Duplicate machine type: ${id}`);types.add(id)
      for(const [key,raw]of Object.entries(object(t.properties,'machine properties'))){
        name(key);const f=object(raw,'machine property');keys(f,['type','access','unit','min','max','description'],'machine property')
        if(!['number','integer','boolean','string'].includes(f.type)||!['read','readwrite'].includes(f.access??'read'))throw Error('Invalid machine property type/access')
        const field:MachineField={type:f.type,access:f.access??'read'}
        if(f.unit!==undefined)field.unit=string(f.unit,'machine unit',60)
        if(f.description!==undefined)field.description=string(f.description,'machine property description',500)
        for(const limit of ['min','max']as const)if(f[limit]!==undefined){
          if(!['number','integer'].includes(f.type)||typeof f[limit]!=='number'||!Number.isFinite(f[limit]))throw Error('Invalid machine property range')
          field[limit]=f[limit]
        }
        if(field.min!==undefined&&field.max!==undefined&&field.min>field.max)throw Error('Reversed machine property range')
        properties[key]=field
      }
      if(!Object.keys(properties).length||Object.keys(properties).length>128)throw Error('Expected 1–128 machine properties')
      return {id,label:string(t.label,'machine type label',120),capabilities:array(t.capabilities??[],'machine capabilities',32).map(v=>name(v)),properties}
    })
    if(!result.types.length)throw Error('Machine type pack is empty')
    return result
  })
}
export { MACHINE_TYPES_SCHEMA } from './machine-type-schema.ts'
export function machinePackSignature(value:unknown):string {
  if(Array.isArray(value))return `[${value.map(machinePackSignature).join(',')}]`
  if(value&&typeof value==='object')return '{'+Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,v])=>`${JSON.stringify(key)}:${machinePackSignature(v)}`).join(',')+'}'
  return JSON.stringify(value)
}
