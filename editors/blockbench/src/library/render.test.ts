import { test, expect } from 'bun:test'
import { paintCustom } from './render.ts'
import { readDocument } from '../document.ts'
import { addComponent } from './instances.ts'
import { readPack } from './pack.ts'
import { EditorStore } from '../store.ts'

test('declarative rendering honors typed fills, conditions, colors and clipping without native base paint',()=>{
  const pack=readPack({schema:'butter.pack.v1',id:'render',title:'Render',version:'1.0.0',targets:['b1.7.3'],categories:[{id:'test',title:'Test'}],components:[{
    schema:'butter.component.v1',id:'indicator',title:'Indicator',base:'energy',category:'test',draw_base:false,variants:[{id:'normal',title:'Normal',w:12,h:22}],
    fields:[{key:'tint',label:'Tint',type:'color',default:'#123456'},{key:'marker',label:'Marker',type:'boolean',default:false}],
    layers:[{type:'outline',x:0,y:0,w:12,h:22,color:'$tint'},
      {type:'fill',x:2,y:2,w:8,h:18,value:'level',direction:'up',color:'$tint'},
      {type:'rect',x:3,y:3,w:2,h:2,color:'#ffffff',when:{field:'marker',equals:true}}],
  }]})
  let doc=new EditorStore().snapshot();const id=addComponent(doc,pack,'indicator',doc.root.id)
  doc.preview![id]={level:50};doc=readDocument(doc)
  const calls:any[]=[],ctx={fillStyle:'',globalAlpha:1,save(){},restore(){},beginPath(){},rect(...p:any[]){calls.push(['clip',...p])},clip(){},fillRect(...p:any[]){calls.push([this.fillStyle,...p])}}
  const box={id,name:'Indicator',kind:'energy' as const,x:10,y:20,w:12,h:22}
  expect(paintCustom(ctx as any,box,doc)).toBeTrue()
  expect(calls[0]).toEqual(['clip',10,20,12,22])
  expect(calls).toContainEqual(['#123456',10,20,12,1])
  expect(calls).toContainEqual(['#123456',12,31,8,9])
  expect(calls.some(c=>c[0]==='#ffffff')).toBeFalse()
  doc.components![id].props={marker:true,tint:'#abcdef'};calls.length=0
  paintCustom(ctx as any,box,doc)
  expect(calls).toContainEqual(['#ffffff',13,23,2,2])
  expect(calls).toContainEqual(['#abcdef',12,31,8,9])
})
