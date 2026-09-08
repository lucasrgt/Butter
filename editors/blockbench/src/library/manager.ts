import { element, button, label, attempt } from '../dom.ts'
import { refresh } from '../host.ts'
import { library } from './registry.ts'
import { libraryCall } from './api.ts'
import { exportArchive, importArchive } from './archive.ts'
import { readPack } from './pack.ts'
import { techPack, starterPack } from './templates.ts'
import { componentVariants } from '../component-properties.ts'
import { PALETTE, type Kind } from '../../../gui-builder/src/model/types.ts'

let dialog:Dialog|undefined
export function savePack(key:string) {
  const pack=library().get(key).pack
  Blockbench.export({type:'Butter component pack',extensions:['zip'],name:`${pack.id}-${pack.version}`,savetype:'buffer',content:new Uint8Array(exportArchive(pack)).buffer})
}
function createPack() {
  const kinds=PALETTE.filter(k=>componentVariants(k).length&&k!=='player')
  const form=new Dialog({id:'butter_pack_create',title:'New component pack',form:{
    id:{label:'Pack ID',type:'text',value:'my-pack'},title:{label:'Title',type:'text',value:'My Pack'},
    component:{label:'Component ID',type:'text',value:'my-component'},base:{label:'Base component',type:'select',options:Object.fromEntries(kinds.map(k=>[k,k])),value:'slot'},
  },onConfirm(result){attempt(()=>{
    const pack=starterPack(String(result.id),String(result.title),String(result.component),result.base as Kind)
    library().install(pack);form.hide();refresh();showLibrary()
  })}})
  form.show()
}
function combine(selected:Set<string>) {
  if(!selected.size)throw Error('Select packs to combine')
  const form=new Dialog({id:'butter_pack_combine',title:'Combine selected packs',form:{
    id:{label:'New pack ID',type:'text',value:'combined-pack'},title:{label:'Title',type:'text',value:'Combined Pack'},version:{label:'Version',type:'text',value:'1.0.0'},
  },onConfirm(result){attempt(()=>{
    libraryCall({action:'combine',packs:[...selected],pack_id:result.id,title:result.title,version:result.version});form.hide();showLibrary()
  })}})
  form.show()
}
export function showLibrary() {
  const root=element('div','butter-ui butter-pack-manager'),bar=element('div','butter-pack-actions'),selected=new Set<string>()
  bar.append(button('Import JSON / ZIP',()=>{
    Blockbench.import({type:'Butter component / pack',extensions:['json','zip'],readtype:'binary',multiple:false},(files:Filesystem.FileResult[])=>attempt(()=>{
      const file=files[0];if(!file)return
      if(file.path && typeof requireNativeModule!=='undefined')libraryCall({action:'import',path:file.path})
      else {
        const bytes=typeof file.content==='string'?new TextEncoder().encode(file.content):new Uint8Array(file.content as ArrayBuffer)
        library().install(file.name.endsWith('.zip')?importArchive(bytes):readPack(JSON.parse(new TextDecoder().decode(bytes))))
      }
      refresh();showLibrary()
    }))
  }),button('Import folder',()=>{
    const path=Blockbench.pickDirectory({title:'Choose a folder with pack.json or component.json'})
    if(path){libraryCall({action:'import',path});showLibrary()}
  }),button('New pack',createPack),button('Install Tech Pack',()=>{library().install(techPack());refresh();showLibrary()}))
  root.append(bar,element('p','butter-pack-note','JSON + PNG · Versions are pinned in saved projects. Export a pack to edit its files, then increment its version and import again.'))
  const list=element('div','butter-pack-list')
  for(const entry of library().list()) {
    const key=`${entry.pack.id}@${entry.pack.version}`,row=element('div','butter-pack-row'),check=element('input')
    check.type='checkbox';check.setAttribute('aria-label',`Select ${key} for combining`);check.onchange=()=>{if(check.checked)selected.add(key);else selected.delete(key)}
    const info=element('div','butter-pack-info'),heading=element('strong','',entry.pack.title)
    info.append(heading,element('small','',`${key} · ${entry.pack.components.length} components`),element('small','',entry.pack.description??entry.pack.categories.map(c=>c.title).join(' · ')))
    const controls=element('div','butter-pack-actions')
    controls.append(button(entry.enabled?'Disable':'Enable',()=>{libraryCall({action:'enable',pack:key,enabled:!entry.enabled});showLibrary()}),button('Export',()=>savePack(key)),
      button('Remove',()=>{libraryCall({action:'remove',pack:key});showLibrary()},'Remove installed version. Saved projects retain their definitions.'))
    if(entry.source)controls.append(button('Reload',()=>{libraryCall({action:'reload',pack:key});showLibrary()}))
    row.append(check,info,controls);list.append(row)
  }
  if(!list.children.length)list.append(element('p','butter-pack-note','No custom packs installed. Import a pack or try the Tech Pack.'))
  root.append(list,button('Combine selected packs',()=>combine(selected)))
  dialog?.delete();dialog=new Dialog({id:'butter_component_library',title:'Butter — Component packs',width:820,lines:[root],buttons:['Close']});dialog.show()
  return {packs:library().list().length,revision:library().revision}
}
export function disposeLibrary(){dialog?.delete();dialog=undefined}
