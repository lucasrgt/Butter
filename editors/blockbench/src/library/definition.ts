import { componentVariants, componentFields, previewFields, readValues, type Field } from '../component-properties.ts'
import { readSemanticConfig } from '../semantics-model.ts'
import { bindingFields } from '../semantics-catalog.ts'
import type { ComponentDefinition, PackSemantics } from './types.ts'
import { object, keys, id, string, integer, array, version } from './checks.ts'
import { readLayers } from './layers.ts'

export function readDefinition(raw: unknown, assets: Record<string, string>): ComponentDefinition {
  const v = object(raw, 'component')
  keys(v, ['$schema','schema','id','title','description','category','base','icon','tags','version','author','license','variants','fields','layers','draw_base','props','preview','semantics','binding_hints'], 'component')
  if (v.schema !== 'butter.component.v1' || !componentVariants(v.base).length || ['player','row','column','screen'].includes(v.base)) throw new Error('Component needs a supported leaf base and butter.component.v1 schema')
  const def: ComponentDefinition = { schema: v.schema, id: id(v.id), title: string(v.title,'component title',100), category: id(v.category), base: v.base, variants: [] }
  for (const key of ['description','icon','author','license'] as const) if (v[key] !== undefined) def[key] = string(v[key], key, key === 'description' ? 500 : 100)
  if (v.version !== undefined) def.version = version(v.version)
  if (v.tags !== undefined) def.tags = array(v.tags, 'tags', 20).map(s => string(s,'tag',40))
  const native = componentFields(def.base), preview = previewFields(def.base), used = new Set([...native,...preview].map(f => f.key))
  def.fields = array(v.fields ?? [], 'fields', 24).map(rawField => {
    const f = object(rawField,'field'); keys(f,['key','label','type','default','min','max','options'],'property')
    const key = id(f.key,'property key'); if (used.has(key)) throw new Error(`Duplicate/reserved property: ${key}`); used.add(key)
    if (!['number','text','boolean','color','select'].includes(f.type)) throw new Error('Unknown property type')
    if(f.type!=='number'&&(f.min!==undefined||f.max!==undefined))throw Error('Only number fields accept min/max')
    if(f.type!=='select'&&f.options!==undefined)throw Error('Only select fields accept options')
    const field: Field = { key, label: string(f.label,'property label',100), type: f.type, default: f.default }
    if (f.type === 'number') { field.min=integer(f.min ?? 0,'property min',-1000000,1000000); field.max=integer(f.max ?? 100,'property max',field.min,1000000) }
    if (f.type === 'select') { field.options=array(f.options,'property options',32).map(s=>string(s,'option',100)); if (!field.options.length||new Set(field.options).size!==field.options.length) throw new Error('Select requires unique options') }
    readValues([field],{[key]:f.default}); return field
  })
  const fields = [...native,...def.fields], all = [...fields,...preview]
  const semantics = (raw: unknown): PackSemantics => {
    const value=object(raw,'component semantics'); if (['id','slot','tab_index'].some(k=>k in value)) throw new Error('Instances allocate semantic IDs, slots and tab order')
    const result=readSemanticConfig({id:'template',kind:def.base,name:def.title,children:[]},{...value,id:'template'}); const {id:_,...rest}=result; return rest
  }
  if (v.props !== undefined) def.props=readValues(fields,v.props)
  if (v.preview !== undefined) def.preview=readValues(preview,v.preview)
  if (v.semantics !== undefined) def.semantics=semantics(v.semantics)
  if (v.draw_base !== undefined && typeof v.draw_base !== 'boolean') throw new Error('draw_base must be boolean')
  def.draw_base=v.draw_base !== false; def.layers=readLayers(v.layers,assets,all)
  const variants = new Set<string>()
  def.variants = array(v.variants,'variants',24).map(rawVariant => {
    const variant=object(rawVariant,'variant'); keys(variant,['id','title','w','h','layers','props','preview','semantics','base_bounds','base_variant'],'variant')
    const key=id(variant.id,'variant id'); if(variants.has(key)) throw new Error('Duplicate variant id'); variants.add(key)
    const result: ComponentDefinition['variants'][number] = { id:key,title:string(variant.title,'variant title',100),w:integer(variant.w,'width',1,176),h:integer(variant.h,'height',1,166) }
    result.base_variant=componentVariants(def.base)[0].id
    if(variant.layers!==undefined)result.layers=readLayers(variant.layers,assets,all)
    if(variant.props!==undefined)result.props=readValues(fields,variant.props)
    if(variant.preview!==undefined)result.preview=readValues(preview,variant.preview)
    if(variant.semantics!==undefined)result.semantics=semantics(variant.semantics)
    if(variant.base_variant!==undefined){ if(!componentVariants(def.base).some(v=>v.id===variant.base_variant))throw Error('Unknown native base variant');result.base_variant=variant.base_variant }
    if(variant.base_bounds!==undefined){ const b=array(variant.base_bounds,'base bounds',4);if(b.length!==4)throw Error('Base bounds need x/y/w/h');result.base_bounds=b.map((n,i)=>integer(n,'base bounds',i>1?1:0,512));if(b[0]+b[2]>result.w||b[1]+b[3]>result.h)throw Error('Base bounds exceed component') }
    return result
  })
  if (!def.variants.length) throw new Error('A component needs at least one variant')
  if (v.binding_hints !== undefined) {
    def.binding_hints={}; for(const [key,value] of Object.entries(object(v.binding_hints,'binding hints'))) {
      if(!bindingFields(def.base).includes(key as never))throw Error('Unsupported binding hint');def.binding_hints[key]=string(value,'binding hint',120)
    }
  }
  return def
}
