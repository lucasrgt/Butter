import { element, button, attempt } from '../dom.ts'
import { refresh } from '../host.ts'
import { library } from './registry.ts'
import { libraryCall } from './api.ts'
import { exportArchive, importArchive } from './archive.ts'
import { readPack } from './pack.ts'
import { techPack } from './templates.ts'
import { packRow } from './manager-row.ts'
import { componentVariants } from '../component-properties.ts'
import { PALETTE } from '../../../gui-builder/src/model/types.ts'

let dialog:Dialog|undefined
export function savePack(key:string) {
  const pack=library().get(key).pack
  Blockbench.export({type:'Butter component pack',extensions:['zip'],name:`${pack.id}-${pack.version}`,savetype:'buffer',content:new Uint8Array(exportArchive(pack)).buffer})
}
function createPack() {
  const kinds=PALETTE.filter(k=>componentVariants(k).length&&k!=='player')
  const form=new Dialog({id:'butter_pack_create',title:'New component pack',form:{
    mod_id:{label:'Mod ID (optional for shared packs)',type:'text',value:''},
    role:{label:'Pack role',type:'select',options:{primary:'Primary',addon:'Addon'},value:'primary'},
    reason:{label:'Reason for a separate addon',type:'text',value:''},
    id:{label:'Pack ID',type:'text',value:'my-pack'},title:{label:'Title',type:'text',value:'My Pack'},
    component:{label:'Component ID',type:'text',value:'my-component'},base:{label:'Base component',type:'select',options:Object.fromEntries(kinds.map(k=>[k,k])),value:'slot'},
  },onConfirm(result){attempt(()=>{
    const {pack}=libraryCall({action:'scaffold',pack_id:result.id,title:result.title,component:result.component,base:result.base,
      ...(result.mod_id?{mod:{id:result.mod_id,role:result.role,...(result.reason?{reason:result.reason}:{})}}:{})}) as {pack:unknown}
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
  const combineButton=button('Combine selected packs',()=>combine(selected))
  combineButton.disabled=true
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
  root.append(bar,element('p','butter-pack-note','JSON + PNG · Versions are pinned in saved projects. Use Add / update components to publish a new version in the same pack.'))
  root.append(element('p','butter-pack-note','One primary pack per mod. Categories may contain subcategories. The catalog shows the latest enabled version; choose older versions here.'))
  const list=element('div','butter-pack-list')
  const changed=()=>{
    combineButton.disabled=!selected.size
    combineButton.textContent=selected.size?`Combine selected packs (${selected.size})`:'Combine selected packs'
  }
  for(const group of library().groups())list.append(packRow(group.versions,selected,changed,showLibrary,savePack))
  if(!list.children.length)list.append(element('p','butter-pack-note','No custom packs installed. Import a pack or try the Tech Pack.'))
  root.append(list,combineButton)
  dialog?.delete();dialog=new Dialog({id:'butter_component_library',title:'Butter — Component packs',width:820,lines:[root],buttons:['Close']});dialog.show()
  return {packs:library().list().length,revision:library().revision}
}
export function disposeLibrary(){dialog?.delete();dialog=undefined}
