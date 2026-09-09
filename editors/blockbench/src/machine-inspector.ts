import { element, label, attempt } from './dom.ts'
import { machineProvider } from './machine-bridge.ts'

type Choice={key:string;label:string;source:{resource:string;property:string};port?:string}
type Link={id:string;source:Choice['source'];port?:string;target:{screen:string;element:string;field:string}}
type Snapshot={revision:number;machine:{id:string;actions:{id:string;description:string}[];bindings:Link[];commands:{id:string;action:string;target:{screen:string;element:string;event:string}}[]}}
export function machineInspector(screen:string,id:string,fields:string[],events:string[],locked:boolean) {
  const root=element('details','butter-binding-details');root.append(element('summary','','Machine contract'))
  const provider=machineProvider()
  if(!provider){root.append(element('p','butter-asset-status','Optional Machine Creator is unavailable. Export GUI semantics to link externally.'));return root}
  const uuid=Project?.uuid
  const call=(command:string,args:Record<string,unknown>={})=>provider.call(command,{...args,expected_project_id:uuid})
  let snapshot:Snapshot
  try{snapshot=call('inspect') as Snapshot}catch(e){root.append(element('p','butter-asset-status',String(e)));return root}
  root.append(element('p','butter-asset-status',`Contract: ${snapshot.machine.id} · links are stored with the machine`))
  for(const field of fields){
    const target={screen,element:id,field}
    let choices:Choice[]
    try{choices=call('candidates',{target}) as Choice[]}catch(e){root.append(element('p','butter-asset-status',`Repair the machine catalog: ${String(e)}`));continue}
    const existing=snapshot.machine.bindings.find(b=>b.target.screen===screen&&b.target.element===id&&b.target.field===field)
    const select=element('select');select.disabled=locked;select.setAttribute('aria-label',`Machine source ${field}`)
    const empty=element('option','','Unlinked');empty.value='';select.append(empty)
    for(const choice of choices){const option=element('option','',choice.label);option.value=choice.key;select.append(option)}
    const key=existing?JSON.stringify([existing.source.resource,existing.source.property,existing.port??'']):''
    if(key&&!choices.some(c=>c.key===key)){const missing=element('option','','Missing or incompatible source — clear or replace');missing.value=key;select.append(missing)}
    select.value=key
    select.onchange=()=>attempt(()=>{
      const choice=choices.find(c=>c.key===select.value)
      if(choice)call('bind',{target,source:choice.source,port:choice.port,id:existing?.id,expected_revision:snapshot.revision})
      else if(existing)call('unbind',{id:existing.id,expected_revision:snapshot.revision})
    })
    root.append(label(`${field} ← machine`,select))
  }
  for(const event of events){
    const target={screen,element:id,event}, existing=snapshot.machine.commands.find(c=>c.target.screen===screen&&c.target.element===id&&c.target.event===event)
    const candidates=call('command_candidates',{target}) as {action:string;description:string;arguments:Record<string,unknown>}[]
    const select=element('select');select.disabled=locked;select.setAttribute('aria-label',`Machine command ${event}`)
    const empty=element('option','','No command');empty.value='';select.append(empty)
    for(const candidate of candidates){const option=element('option','',candidate.action);option.value=candidate.action;option.title=candidate.description;select.append(option)}
    if(existing&&!candidates.some(c=>c.action===existing.action)){const option=element('option','',`Manual or unavailable mapping: ${existing.action}`);option.value=existing.action;select.append(option)}
    select.value=existing?.action??''
    select.onchange=()=>attempt(()=>{
      const candidate=candidates.find(c=>c.action===select.value)
      if(candidate)call('command',{target,action:candidate.action,arguments:candidate.arguments,id:existing?.id,expected_revision:snapshot.revision})
      else if(!select.value&&existing)call('uncommand',{id:existing.id,expected_revision:snapshot.revision})
    })
    root.append(label(`${event} → machine`,select))
  }
  return root
}
