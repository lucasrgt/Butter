const identifier={type:'string',minLength:1,maxLength:120,pattern:'^[a-zA-Z_][a-zA-Z0-9_.:-]*$'}
const qualified={...identifier,pattern:'^[a-z][a-z0-9_.-]*:[a-z][a-z0-9_.-]*$'}
const field={type:'object',additionalProperties:false,required:['type'],properties:{
  type:{enum:['number','integer','boolean','string']},access:{enum:['read','readwrite'],default:'read'},
  unit:{type:'string',minLength:1,maxLength:60},min:{type:'number'},max:{type:'number'},description:{type:'string',minLength:1,maxLength:500},
}}
export const MACHINE_TYPES_SCHEMA={type:'array',maxItems:64,items:{type:'object',additionalProperties:false,
  required:['schema','id','version','title','types'],properties:{
    schema:{const:'machine.types.v1'},id:qualified,version:{type:'string',pattern:'^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$'},
    title:{type:'string',minLength:1,maxLength:120},types:{type:'array',minItems:1,maxItems:128,items:{
      type:'object',additionalProperties:false,required:['id','label','properties'],properties:{id:qualified,label:{type:'string',minLength:1,maxLength:120},
        capabilities:{type:'array',maxItems:32,items:identifier,default:[]},properties:{type:'object',minProperties:1,maxProperties:128,propertyNames:identifier,additionalProperties:field},
      },
    }},
  },description:'Portable resource types. Range order, numeric ranges and unique identities are also checked by readMachineTypes.'}}
