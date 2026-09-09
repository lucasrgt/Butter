import { element, button } from '../dom.ts'
import { libraryCall } from './api.ts'
import { editPack } from './manager-edit.ts'
import { packKey, type InstalledPack } from './types.ts'

export function packRow(versions:InstalledPack[],selected:Set<string>,changed:()=>void,redraw:()=>void,save:(key:string)=>void) {
  const row=element('div','butter-pack-row'),check=element('input'),info=element('span','butter-pack-info'),controls=element('div','butter-pack-actions')
  let entry=versions[0]!,key=packKey(entry.pack)
  check.type='checkbox'
  const selector=element('select');selector.setAttribute('aria-label',`Version of ${entry.pack.title}`)
  for(const version of versions){const option=element('option','',`${version.pack.version}${version.enabled?'':' (disabled)'}`);option.value=packKey(version.pack);selector.append(option)}
  const update=()=>{
    check.setAttribute('aria-label',`Select ${key} for combining`)
    info.replaceChildren(element('strong','',entry.pack.title),element('small','',`${entry.pack.id} · ${entry.pack.components.length} components · ${versions.length} version(s)`),
      element('small','',entry.pack.mod?`${entry.pack.mod.id} · ${entry.pack.mod.role}${entry.pack.mod.reason?` · ${entry.pack.mod.reason}`:''}`:'Shared / unassociated pack'))
    controls.replaceChildren(selector,button(entry.enabled?'Disable':'Enable',()=>{libraryCall({action:'enable',pack:key,enabled:!entry.enabled});redraw()}),button('Export',()=>save(key)),
      button('Remove',()=>{libraryCall({action:'remove',pack:key});redraw()},'Remove installed version. Saved projects retain their definitions.'),
      button('Add / update components',()=>editPack(packKey(versions[0]!.pack),redraw),'Publish a new version of this pack from its latest version'))
    if(entry.source)controls.append(button('Reload',()=>{libraryCall({action:'reload',pack:key});redraw()}))
  }
  check.onchange=()=>{if(check.checked)selected.add(key);else selected.delete(key);changed()}
  selector.onchange=()=>{selected.delete(key);key=selector.value;entry=versions.find(v=>packKey(v.pack)===key)!;if(check.checked)selected.add(key);update();changed()}
  const choice=element('label','butter-pack-choice');choice.append(check,info);row.append(choice,controls);update();return row
}
