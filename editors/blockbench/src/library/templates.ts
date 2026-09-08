import { componentVariants } from '../component-properties.ts'
import type { Kind } from '../../../gui-builder/src/model/types.ts'
import { readPack } from './pack.ts'
import type { ComponentDefinition, PackSemantics, PackVariant } from './types.ts'
import { TECH_ASSETS } from './tech-assets.ts'

export function starterPack(id:string,title:string,component:string,base:Kind) {
  return readPack({schema:'butter.pack.v1',id,version:'1.0.0',title,targets:['b1.7.3'],categories:[{id:'custom',title:'Custom'}],assets:{},components:[{
    schema:'butter.component.v1',id:component,title:component.replaceAll('-',' '),category:'custom',base,variants:componentVariants(base).map(v=>({...v,base_variant:v.id})),
    description:'Edit this declarative component and increment the pack version before importing changes.',
  }]})
}
function semantics(resource:string,direction:string,capabilities:string[]):PackSemantics {
  return {capabilities,attributes:{'tech.resource':resource,'tech.direction':direction,'tech.contract':'v1'}}
}
const outline=(w:number,h:number,color:string)=>({type:'outline' as const,x:0,y:0,w,h,color})
function port(id:string,title:string,resource:string,color:string,icon:string):ComponentDefinition {
  const variants:PackVariant[]=['input','output','bidirectional'].map(direction=>({id:direction,title:direction[0].toUpperCase()+direction.slice(1),w:22,h:22,base_bounds:[2,2,18,18],base_variant:'normal',
    props:{accent:direction==='output'?'#e6a64b':color},semantics:semantics(resource,direction,[...(direction!=='output'?[`${resource}.insert`]:[]),...(direction!=='input'?[`${resource}.extract`]:[])])}))
  return {schema:'butter.component.v1',id,title,category:'ports',base:'slot',icon,description:`Container slot with a ${resource} transfer contract and an outer port outline.`,tags:[resource,'port','input','output'],variants,
    fields:[{key:'accent',label:'Outline color',type:'color',default:color},{key:'marked',label:'Show port marker',type:'boolean',default:true}],
    layers:[outline(22,22,'$accent'),{type:'image',asset:'port-mark.png',x:16,y:16,w:6,h:6,when:{field:'marked',equals:true}}],
    binding_hints:{item:`${resource}PortItem`,count:`${resource}PortCount`,enabled:`${resource}PortEnabled`}}
}
function gauge(id:string,title:string,base:'tank'|'gas'|'energy',resource:string,color:string):ComponentDefinition {
  const native=componentVariants(base)
  return {schema:'butter.component.v1',id,title,category:'storage',base,icon:base==='energy'?'bolt':base==='gas'?'cloud':'opacity',
    description:`${title} with capacity bindings and declared storage capabilities.`,tags:[resource,'storage','gauge'],
    fields:[{key:'accent',label:'Frame color',type:'color',default:color}],props:{max:base==='energy'?100000:16000},preview:{level:65},
    semantics:semantics(resource,'storage',[`${resource}.store`,`${resource}.inspect`]),binding_hints:{value:`${resource}Stored`,max:`${resource}Capacity`},
    variants:native.map(v=>({...v,w:v.w+4,h:v.h+4,base_bounds:[2,2,v.w,v.h],base_variant:v.id,layers:[outline(v.w+4,v.h+4,'$accent')]}))}
}
export function techPack() {
  return readPack({schema:'butter.pack.v1',id:'butter-tech',version:'1.0.0',title:'Tech Pack',author:'Butter contributors',license:'MIT',
    description:'Original machine controls, storage gauges and semantic ports for Minecraft Beta 1.7.3.',targets:['b1.7.3'],tags:['technology','machine','energy','fluid'],
    categories:[{id:'ports',title:'Ports',icon:'input'},{id:'storage',title:'Storage',icon:'storage'},{id:'controls',title:'Controls',icon:'tune'}],assets:TECH_ASSETS,
    components:[port('fluid-port','Fluid port','fluid','#479cff','opacity'),port('gas-port','Gas port','gas','#b485eb','cloud'),port('item-port','Item port','item','#d7b96b','inventory_2'),
      gauge('energy-cell','Energy cell','energy','energy','#54d895'),gauge('fluid-reservoir','Fluid reservoir','tank','fluid','#479cff'),gauge('gas-reservoir','Gas reservoir','gas','gas','#b485eb'),
      {schema:'butter.component.v1',id:'machine-switch',title:'Machine switch',category:'controls',base:'toggle',icon:'power_settings_new',tags:['power','control'],
        variants:[{id:'normal',title:'Normal',w:20,h:12}],semantics:{capabilities:['machine.enable'],attributes:{'tech.control':'power'}},binding_hints:{value:'machineEnabled'}},
      {schema:'butter.component.v1',id:'status-lamp',title:'Status lamp',category:'controls',base:'checkbox',icon:'lightbulb',draw_base:false,
        variants:[{id:'green',title:'Running',w:12,h:12,props:{accent:'#54d895'}},{id:'amber',title:'Warning',w:12,h:12,props:{accent:'#edb44a'}},{id:'red',title:'Fault',w:12,h:12,props:{accent:'#e66058'}}],
        fields:[{key:'accent',label:'Light color',type:'color',default:'#54d895'}],preview:{checked:true},
        layers:[{type:'rect',x:0,y:0,w:12,h:12,color:'#343b3e'},{type:'rect',x:2,y:2,w:8,h:8,color:'#555d60'},
          {type:'rect',x:2,y:2,w:8,h:8,color:'$accent',when:{field:'checked',equals:true}},
          {type:'image',asset:'lamp-sheen.png',x:2,y:2,w:8,h:8,frames:2,frame_ms:500,when:{field:'checked',equals:true}}],
        semantics:{capabilities:['machine.status'],attributes:{'tech.control':'status'}},binding_hints:{value:'machineRunning'}},
    ]})
}
