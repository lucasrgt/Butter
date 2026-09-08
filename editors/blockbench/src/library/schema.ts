const text={type:'string',minLength:1,maxLength:100}
const identifier={type:'string',pattern:'^[a-z][a-z0-9_.-]*$',maxLength:80}
const version={type:'string',pattern:'^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$'}
const values={type:'object',additionalProperties:{type:['string','number','boolean']}}
const category={type:'object',additionalProperties:false,required:['id','title'],properties:{id:identifier,title:text,icon:text}}
const array=(items:object,maxItems:number)=>({type:'array',items,maxItems})
const semantics={type:'object',additionalProperties:false,properties:{
  role:text,label:{type:'string',maxLength:200},description:{type:'string',maxLength:500},region:{type:'boolean'},
  capabilities:array({type:'string',maxLength:100,pattern:'^[a-z][a-z0-9_-]*(\\.[a-z][a-z0-9_-]*)+$'},32),
  attributes:{type:'object',maxProperties:32,propertyNames:{pattern:'^[a-z][a-z0-9_-]*(\\.[a-z][a-z0-9_-]*)+$'},additionalProperties:{type:'string',maxLength:200}},
  bindings:{type:'object',propertyNames:{enum:['value','max','item','count','enabled','visible','readOnly']},additionalProperties:{type:'string',maxLength:120}},action:text,
}}
const field={type:'object',additionalProperties:false,required:['key','label','type','default'],properties:{
  key:identifier,label:text,type:{enum:['number','text','boolean','color','select']},default:{type:['string','number','boolean']},
  min:{type:'integer',minimum:-1000000,maximum:1000000},max:{type:'integer',minimum:-1000000,maximum:1000000},options:array(text,32),
}}
const position={type:'integer',minimum:-512,maximum:512},size={type:'integer',minimum:1,maximum:512}
const layer={type:'object',additionalProperties:false,required:['type','x','y','w','h'],properties:{
  type:{enum:['rect','outline','image','text','fill']},x:position,y:position,w:size,h:size,
  color:{type:'string',pattern:'^(#[a-fA-F0-9]{6}|\\$[a-z][a-z0-9_.-]*)$'},text:{type:'string',maxLength:200},asset:{type:'string',maxLength:200},
  crop:{type:'array',items:{type:'integer',minimum:0,maximum:1024},minItems:4,maxItems:4},thickness:{type:'integer',minimum:1,maximum:16},
  opacity:{type:'number',minimum:0,maximum:1},direction:{enum:['up','down','left','right']},value:identifier,
  frames:{type:'integer',minimum:1,maximum:128},frame_ms:{type:'integer',minimum:20,maximum:10000},
  when:{type:'object',additionalProperties:false,required:['field','equals'],properties:{field:identifier,equals:{type:['string','number','boolean']}}},
}}
const variant={type:'object',additionalProperties:false,required:['id','title','w','h'],properties:{
  id:identifier,title:text,w:{type:'integer',minimum:1,maximum:176},h:{type:'integer',minimum:1,maximum:166},
  layers:array(layer,64),props:values,preview:values,semantics,base_variant:identifier,
  base_bounds:{type:'array',minItems:4,maxItems:4,items:{type:'integer',minimum:0,maximum:512}},
}}
const assets={type:'object',maxProperties:64,additionalProperties:{type:'string',description:'Embedded data:image/png;base64,... or a relative PNG file path.'}}
const componentProperties={$schema:{type:'string'},schema:{const:'butter.component.v1'},id:identifier,title:text,description:{type:'string',maxLength:500},category:{oneOf:[identifier,category]},
  base:{enum:['slot','tank','gas','energy','progress','flame','button','search','slider','scrollbar','checkbox','toggle','radio','tab','separator']},
  icon:text,tags:array({type:'string',maxLength:40},20),version,author:text,license:text,variants:{...array(variant,24),minItems:1},fields:array(field,24),
  layers:array(layer,64),draw_base:{type:'boolean'},props:values,preview:values,semantics,binding_hints:{type:'object',additionalProperties:{type:'string',maxLength:120}},assets,
}
export const COMPONENT_SCHEMA={
  $schema:'https://json-schema.org/draft/2020-12/schema',title:'Butter declarative component v1',type:'object',additionalProperties:false,
  required:['schema','id','title','category','base','variants'],properties:componentProperties,
  description:'Runtime validation also checks references, base-specific fields/roles, image dimensions, conditions and unique IDs. Standalone components may declare assets.',
}
export const PACK_SCHEMA={
  $schema:'https://json-schema.org/draft/2020-12/schema',title:'Butter component pack v1',type:'object',additionalProperties:false,
  required:['schema','id','version','title','targets','components'],properties:{
    $schema:{type:'string'},schema:{const:'butter.pack.v1'},id:identifier,version,title:text,description:{type:'string',maxLength:500},author:text,license:text,tags:array({type:'string',maxLength:40},20),
    targets:{const:['b1.7.3']},categories:array(category,32),assets,
    components:{...array({oneOf:[{type:'string',description:'Relative component JSON path.'},{type:'object',additionalProperties:false,required:COMPONENT_SCHEMA.required,properties:componentProperties}]},64),minItems:1},
  },
}
