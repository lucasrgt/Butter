import { current } from '../host.ts'
import { element, button, label, attempt } from '../dom.ts'
import { inheritedFlag } from '../selection.ts'
import { library } from './registry.ts'
import { definition } from './document.ts'
import { customComponentCall } from './api.ts'

export function instanceInspector(id:string) {
  const doc=current().snapshot(),ref=doc.component_refs![id],def=definition(doc,id)!,root=element('div','butter-instance-origin')
  root.append(element('strong','',def.title),element('small','',`${ref.pack} / ${ref.component}`))
  const details=element('details'),summary=element('summary','','Definition and integration hints')
  details.append(summary)
  if(def.description)details.append(element('p','butter-pack-note',def.description))
  const pre=element('pre','',JSON.stringify({binding_hints:def.binding_hints,fields:def.fields,semantics:def.semantics},null,2));details.append(pre)
  const versions=library().list().filter(e=>e.enabled&&e.pack.components.some(c=>c.id===def.id&&c.base===def.base)&&`${e.pack.id}@${e.pack.version}`!==ref.pack)
  if(versions.length) {
    const select=element('select');select.setAttribute('aria-label','Replace component definition')
    for(const entry of versions){const key=`${entry.pack.id}@${entry.pack.version}`,option=element('option','',key);option.value=key;select.append(option)}
    const update=button('Apply version',()=>customComponentCall({action:'upgrade',id,pack:select.value}))
    update.disabled=inheritedFlag(doc,id,'locked');details.append(label('Available definition',select),update)
  }
  const detach=button('Convert to built-in',()=>customComponentCall({action:'detach',id}),'Remove custom layers and fields; keep resolved semantics and native properties. Undo available.')
  detach.disabled=inheritedFlag(doc,id,'locked');details.append(detach);root.append(details);return root
}
