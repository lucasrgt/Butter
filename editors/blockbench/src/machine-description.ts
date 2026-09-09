import type { ButterDocument } from './document.ts'
import { semanticTree } from './semantics-export.ts'
import { semanticWidgets } from './semantics-model.ts'
import { semanticCatalog } from './semantics-catalog.ts'
import type { MachineField } from './library/machine-types.ts'
import { machinePackSignature } from './library/machine-types.ts'

// This is an open description, not a dependency on Pixel Harness or its runtime.
export function machineDescription(doc:ButterDocument) {
  const tree=semanticTree(doc), widgets=new Map(semanticWidgets(doc.root).map(w=>[w.id,w]))
  const endpoints=tree.nodes.map(node=>{
    const widget=widgets.get(node.widget_id)!, kind=widget.kind==='player'&&node.role==='slot'?'slot':widget.kind, catalog=semanticCatalog(kind)
    const declared=node.attributes['machine.accepts']
    const resource=node.attributes['tech.resource']??({tank:'fluid',gas:'gas',energy:'energy',slot:'item'} as Record<string,string>)[kind]
    const accepts=declared!==undefined?declared.split(',').map(v=>v.trim()).filter(Boolean):resource?[resource==='item'?'inventory.items':`storage.${resource}`]:[]
    const fields:Record<string,MachineField>=Object.create(null)
    for(const field of catalog.bindings){
      const unit=node.attributes[`machine.unit.${field.field}`]
      fields[field.field]={type:field.type as MachineField['type'],access:'read',...(unit?{unit}:{})}
    }
    const events:Record<string,Record<string,MachineField>>={}
    if(['slider','scrollbar'].includes(kind))events.set_value={value:{type:'number',access:'read',...(fields.value.unit?{unit:fields.value.unit}:{})}}
    if(kind==='search')events.type={text:{type:'string',access:'read'}}
    return {screen:tree.screen,element:node.id,label:node.attributes.label??node.id,role:node.role,fields,
      capabilities:node.attributes.capabilities?.split(',').filter(Boolean)??[],accepts,actions:node.actions,events}
  })
  const packs=new Map<string,NonNullable<NonNullable<ButterDocument['library']>[string]['machine_types']>[number]>()
  for(const pack of Object.values(doc.library??{}))for(const types of pack.machine_types??[]){
    const previous=packs.get(types.id)
    if(previous&&machinePackSignature(previous)!==machinePackSignature(types))throw Error(`Conflicting pinned machine types: ${types.id}`)
    packs.set(types.id,types)
  }
  return {schema:'machine.gui.v1',endpoints,packs:[...packs.values()],compiler_validated:false,runtime_verified:false}
}
