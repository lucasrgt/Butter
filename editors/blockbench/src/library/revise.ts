import { ComponentLibrary } from './registry.ts'
import { readPack } from './pack.ts'
import { object, array, id, version } from './checks.ts'
import { compareVersions, nextVersion } from './versions.ts'
import { contentIdentity } from './identity.ts'
import { packKey } from './types.ts'

function upsert(existing:unknown[],raw:unknown,label:string,limit:number) {
  if(raw===undefined)return existing
  const additions=array(raw,label,limit).map(value=>object(value,label)),seen=new Set<string>()
  for(const value of additions){const key=id(value.id);if(seen.has(key))throw Error(`Duplicate ${label} ID: ${key}`);seen.add(key)}
  const replacements=new Map(additions.map(value=>[value.id,value]))
  return [...existing.map(value=>replacements.get(object(value,label).id)??value),...additions.filter(value=>!existing.some(old=>object(old,label).id===value.id))]
}
export function revisePack(registry:ComponentLibrary,args:Record<string,unknown>) {
  registry.check(args.expected_library_revision)
  if(typeof args.pack!=='string')throw Error('Expected exact base pack key')
  const base=registry.get(args.pack).pack,latest=registry.groups().find(g=>g.id===base.id)!.versions[0]!.pack
  if(packKey(base)!==packKey(latest))throw Error(`Stale base pack; revise ${packKey(latest)} to preserve newer components`)
  const draft={...base,
    components:upsert(base.components,args.components,'components',64),categories:upsert(base.categories,args.categories,'categories',32),
    assets:{...base.assets,...(args.assets===undefined?{}:object(args.assets,'assets'))},
    ...(args.mod===undefined?{}:{mod:args.mod}),...(args.title===undefined?{}:{title:args.title}),
  }
  const unchanged=readPack(draft)
  if(contentIdentity(unchanged)===contentIdentity(base))return {status:'unchanged',key:packKey(base),pack:base,revision:registry.revision}
  const target=version(args.version??nextVersion(latest.version))
  if(compareVersions(target,latest.version)<=0)throw Error(`Version must be newer than ${latest.version}`)
  const pack=readPack({...draft,version:target})
  return {...registry.install(pack,undefined,args.dry_run===true),pack}
}
