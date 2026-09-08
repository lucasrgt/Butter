import { readPack } from './pack.ts'
import { packKey, type InstalledPack, type ComponentPack } from './types.ts'
import { contentIdentity } from './identity.ts'

const STORAGE='butter.component-library.v1'
export class ComponentLibrary {
  private entries: InstalledPack[]=[]
  revision=0
  constructor(private storage?: Pick<Storage,'getItem'|'setItem'>) {
    const raw=storage?.getItem(STORAGE)
    if(raw) {
      if(raw.length>8*1024*1024)throw Error('Saved library exceeds 8 MB')
      const list=JSON.parse(raw)
      if(!Array.isArray(list)||list.length>32)throw Error('Invalid saved library')
      this.entries=list.map(v=>({pack:readPack(v.pack),enabled:v.enabled===true,source:typeof v.source==='string'?v.source:undefined}))
      if(new Set(this.entries.map(v=>packKey(v.pack))).size!==list.length)throw Error('Duplicate saved pack versions')
    }
  }
  list(){return structuredClone(this.entries)}
  get(key:string){const entry=this.entries.find(e=>packKey(e.pack)===key);if(!entry)throw Error(`Unknown pack: ${key}`);return structuredClone(entry)}
  check(expected?:unknown){if(expected!==undefined && expected!==this.revision)throw Error(`Library revision conflict: expected ${expected}, current ${this.revision}`)}
  private save(entries:InstalledPack[]) {
    const raw=JSON.stringify(entries)
    if(raw.length>8*1024*1024||entries.length>32)throw Error('Library exceeds 32 versions or 8 MB')
    this.storage?.setItem(STORAGE,raw);this.entries=entries;this.revision++
  }
  install(value:unknown,source?:string,dry=false) {
    const pack=readPack(value),key=packKey(pack),existing=this.entries.find(e=>packKey(e.pack)===key)
    if(existing && contentIdentity(existing.pack)!==contentIdentity(pack))throw Error(`Pack ${key} already has different content; increment its version`)
    if(!dry&&!existing)this.save([...this.entries,{pack,enabled:true,source}])
    return {key,status:existing?'unchanged':dry?'ready':'installed',components:pack.components.length,revision:this.revision}
  }
  enable(key:string,enabled:boolean){this.get(key);this.save(this.entries.map(e=>packKey(e.pack)===key?{...e,enabled}:e))}
  remove(key:string){this.get(key);this.save(this.entries.filter(e=>packKey(e.pack)!==key))}
  catalog(search='',pack?:string) {
    const query=search.toLowerCase().trim()
    return structuredClone(this.entries.filter(e=>e.enabled && (!pack||packKey(e.pack)===pack)).flatMap(e=>e.pack.components.map(def=>({
      pack:packKey(e.pack),pack_title:e.pack.title,category_title:e.pack.categories.find(c=>c.id===def.category)!.title,...def,
    }))).filter(d=>[d.title,d.id,d.description,d.pack_title,d.category_title,...d.tags??[]].join(' ').toLowerCase().includes(query)))
  }
}
let instance:ComponentLibrary|undefined
export const library=()=>instance??=new ComponentLibrary(typeof localStorage==='undefined'?undefined:localStorage)
