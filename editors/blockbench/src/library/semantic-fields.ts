import type { SemanticConfig } from '../semantics-catalog.ts'
import { element, label, attempt } from '../dom.ts'

export function semanticFields(config:SemanticConfig,locked:boolean,update:(patch:Record<string,unknown>)=>unknown) {
  const root=element('details','butter-binding-details');root.append(element('summary','','Capabilities and custom attributes'))
  const capabilities=element('input');capabilities.value=config.capabilities?.join(', ')??'';capabilities.placeholder='fluid.insert, fluid.extract';capabilities.disabled=locked
  capabilities.setAttribute('aria-label','Semantic capabilities')
  capabilities.onchange=()=>attempt(()=>update({capabilities:capabilities.value.split(',').map(c=>c.trim()).filter(Boolean)}))
  const attributes=element('textarea');attributes.value=JSON.stringify(config.attributes??{},null,2);attributes.rows=4;attributes.disabled=locked
  attributes.setAttribute('aria-label','Custom semantic attributes')
  attributes.onchange=()=>attempt(()=>update({attributes:JSON.parse(attributes.value)}))
  root.append(label('Capabilities',capabilities),label('Namespaced attributes · JSON',attributes),element('p','butter-pack-note','Declared integration contract. Java bindings and handlers provide the behavior.'))
  return root
}
