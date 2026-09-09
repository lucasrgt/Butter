import { test, expect } from 'bun:test'
import { readFileSync } from 'node:fs'
import { readDocument } from './document.ts'
import { crusher } from '../../gui-builder/src/model/presets.ts'
import { readPack, combinePacks } from './library/pack.ts'
import { importArchive, exportArchive } from './library/archive.ts'
import { readMachineTypes } from './library/machine-types.ts'
import { addComponent } from './library/instances.ts'
import { machineDescription } from './machine-description.ts'
import { machineProvider } from './machine-bridge.ts'

const fixture=()=>readPack(JSON.parse(readFileSync(new URL('../../../examples/machine-plasma.pack.json',import.meta.url),'utf8')))
test('plasma packs preserve open machine types through ZIP and pinned document round-trips',()=>{
  const pack=fixture();expect(importArchive(exportArchive(pack))).toEqual(pack)
  const doc=readDocument({version:1,root:crusher(),hidden:[]}),id=addComponent(doc,pack,'plasma-gauge',doc.root.id)
  const roundtrip=readDocument(JSON.parse(JSON.stringify(doc))),description=machineDescription(roundtrip)
  expect(description.packs).toEqual(pack.machine_types!)
  const endpoint=description.endpoints.find(e=>e.element===roundtrip.semantics![id].id)!
  expect(endpoint.accepts).toEqual(['storage.plasma'])
  expect(endpoint.fields.value).toEqual({type:'number',access:'read',unit:'mB'})
  expect(endpoint.capabilities).toEqual(['plasma.inspect'])
  expect(description.runtime_verified).toBe(false)
  expect(machineProvider()).toBeUndefined()
})
test('player inventory descriptors expose typed slot fields',()=>{
  const description=machineDescription(readDocument({version:1,root:crusher(),hidden:[]}))
  expect(description.endpoints.find(e=>e.element==='player.0')!.fields.item.type).toBe('integer')
})
test('conflicting pinned types and malformed field catalogs reject',()=>{
  const pack=fixture(),other=fixture();other.id='other';other.machine_types![0].version='2.0.0'
  expect(()=>combinePacks([pack,other],{id:'combined',title:'Combined',version:'1.0.0'})).toThrow('Conflicting machine')
  for(const mutate of [
    (p:any)=>p[0].types[0].properties.amount.type='function',
    (p:any)=>p[0].types[0].properties.amount.min=Infinity,
    (p:any)=>p[0].types[0].properties.amount.max=-1,
    (p:any)=>p[0].types.push(p[0].types[0]),
    (p:any)=>p[0].script='run()',
  ]) {const types=structuredClone(pack.machine_types);mutate(types);expect(()=>readMachineTypes(types)).toThrow()}
})
