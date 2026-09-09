import { object, keys, id, string } from './checks.ts'
import type { PackMod, InstalledPack, ComponentPack } from './types.ts'

export function readPackMod(raw:unknown):PackMod {
  const value=object(raw,'pack mod');keys(value,['id','role','reason'],'pack mod')
  const role=value.role??'primary'
  if(role!=='primary'&&role!=='addon')throw Error('Pack role must be primary or addon')
  const result:PackMod={id:id(value.id,'mod ID'),role}
  if(value.reason!==undefined)result.reason=string(value.reason,'separate pack reason',500)
  if(role==='addon'&&!result.reason)throw Error('An addon pack requires an explicit reason')
  return result
}
export function checkPackOwnership(entries:InstalledPack[],pack:ComponentPack) {
  const previous=entries.find(e=>e.pack.id===pack.id&&e.pack.mod)?.pack.mod
  if(previous&&(!pack.mod||previous.id!==pack.mod.id||previous.role!==pack.mod.role))throw Error('Preserve the existing pack mod and role when creating a new version')
  if(pack.mod?.role==='primary'){
    const other=entries.find(e=>e.pack.id!==pack.id&&e.pack.mod?.id===pack.mod!.id&&e.pack.mod.role==='primary')
    if(other)throw Error(`Mod ${pack.mod.id} already has primary pack ${other.pack.id}; revise that pack, or declare an addon with a reason`)
  }
}
