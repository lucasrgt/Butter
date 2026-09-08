import { test, expect } from 'bun:test'
import { unzipSync, strFromU8 } from 'fflate'
import { readDocument } from '../document.ts'
import { EditorStore } from '../store.ts'
import { addComponent, upgradeComponent, detachComponent } from './instances.ts'
import { techPack } from './templates.ts'
import { resolvedComponent, resolvedSemantics } from './document.ts'
import { positionedBoxes } from '../position.ts'
import { duplicate, remove } from '../operations.ts'
import { copyBundle, pasteBundle } from '../clipboard-model.ts'
import { ComponentLibrary } from './registry.ts'
import { exportPixels } from '../export-pixels.ts'
import { semanticTree } from '../semantics-export.ts'
import { exportBundle } from './bundle.ts'

const empty=()=>new EditorStore().snapshot()
test('custom variants own dimensions, property defaults and dynamic semantic contracts',()=>{
  const doc=empty(),id=addComponent(doc,techPack(),'fluid-port',doc.root.id,undefined,12,18)
  const first=readDocument(doc),node=positionedBoxes(first).find(b=>b.id===id)!
  expect([node.x,node.y,node.w,node.h]).toEqual([12,18,22,22])
  expect(resolvedSemantics(first)[id].capabilities).toEqual(['fluid.insert'])
  expect(resolvedComponent(first,id).props?.accent).toBe('#479cff')
  const identity=first.semantics![id].id,slot=first.semantics![id].slot
  first.components![id].variant='output'
  const next=readDocument(first)
  expect(resolvedSemantics(next)[id].capabilities).toEqual(['fluid.extract'])
  expect(resolvedSemantics(next)[id].attributes?.['tech.direction']).toBe('output')
  expect(resolvedComponent(next,id).props?.accent).toBe('#e6a64b')
  expect(next.semantics![id]).toMatchObject({id:identity,slot})
  expect(readDocument(JSON.parse(JSON.stringify(next)))).toEqual(next)
})
test('uninstall and installing a new version cannot mutate pinned instances; explicit upgrade is undoable',()=>{
  const registry=new ComponentLibrary(),pack=techPack(),doc=empty()
  registry.install(pack);const id=addComponent(doc,registry.get('butter-tech@1.0.0').pack,'fluid-port',doc.root.id)
  const store=new EditorStore(doc),before=store.snapshot(),changed=structuredClone(pack)
  changed.version='1.1.0';changed.components[0].variants[0].props!.accent='#123456'
  registry.install(changed);registry.remove('butter-tech@1.0.0')
  expect(store.snapshot()).toEqual(before)
  const edit=store.snapshot();upgradeComponent(edit,id,changed);store.commit(edit)
  expect(resolvedComponent(store.snapshot(),id).props?.accent).toBe('#123456')
  expect(store.snapshot().library!['butter-tech@1.0.0']).toBeUndefined()
  store.history('undo');expect(store.snapshot()).toEqual(before)
  store.history('redo');expect(store.snapshot().component_refs![id].pack).toBe('butter-tech@1.1.0')
})
test('copy, paste, duplicate and delete retain independent definitions, values and slot identities',()=>{
  let doc=empty();const id=addComponent(doc,techPack(),'fluid-port',doc.root.id)
  doc=readDocument(doc);doc.components![id].props={accent:'#124578'}
  const cloned=duplicate(doc,id);doc=readDocument(doc)
  expect(doc.component_refs![cloned]).toEqual(doc.component_refs![id])
  expect(doc.semantics![cloned].slot).not.toBe(doc.semantics![id].slot)
  const other=empty(),pasted=pasteBundle(other,copyBundle(doc,[id]),other.root.id)[0]
  const roundtrip=readDocument(other)
  expect(resolvedComponent(roundtrip,pasted).props?.accent).toBe('#124578')
  expect(Object.keys(roundtrip.library!)).toEqual(['butter-tech@1.0.0'])
  roundtrip.components![pasted].props!.accent='#abcdef'
  expect(doc.components![id].props!.accent).toBe('#124578')
  remove(roundtrip,pasted);expect(roundtrip.component_refs).toEqual({});expect(roundtrip.library).toEqual({})
})
test('unknown refs, incompatible bases, variant changes and typed field changes fail atomically',()=>{
  const doc=empty(),id=addComponent(doc,techPack(),'fluid-port',doc.root.id),store=new EditorStore(doc),before=store.inspect()
  for(const mutate of [
    (d:any)=>d.component_refs[id].pack='missing@1.0.0',
    (d:any)=>d.component_refs[id].component='gas-reservoir',
    (d:any)=>d.components[id].variant='missing',
      (d:any)=>d.components[id].props={accent:42},
    (d:any)=>d.root.id='__proto__',
    (d:any)=>d.library['butter-tech@1.0.0'].components[0].fields[0].default='javascript:bad',
  ]) {const d=store.snapshot();mutate(d);expect(()=>store.commit(d)).toThrow();expect(store.inspect()).toEqual(before)}
  const incompatible=techPack();incompatible.version='2.0.0';incompatible.components[0].variants.shift()
  expect(()=>upgradeComponent(store.snapshot(),id,incompatible)).toThrow('Selected variant')
})
test('source exports native base bounds and semantic capabilities; bundle preserves every PNG and definition',()=>{
  let doc=empty();const id=addComponent(doc,techPack(),'fluid-port',doc.root.id,'fluid.input',10,20)
  doc=readDocument(doc);doc.components![id].props={accent:'#abcdef'};doc.preview![id]={sample:'crystal',count:9}
  const source=exportPixels(doc)
  expect(source).toContain('x: 12, y: 22, class: "w-18 h-18"')
  expect(source).toContain('capabilities: "fluid.insert"')
  expect(source).toContain('"tech.resource": "fluid"')
  expect(source).not.toContain('accent:');expect(source).not.toContain('crystal');expect(source).not.toContain('fluidPortItem')
  const tree=semanticTree(doc);expect(tree.nodes.find(n=>n.widget_id===id)!.attributes.capabilities).toBe('fluid.insert')
  const files=unzipSync(exportBundle(doc)),manifest=JSON.parse(strFromU8(files['integration.json']))
  expect(strFromU8(files['interface.butter'])).toBe(source)
  expect(manifest.instances[0].props.accent).toBe('#abcdef')
  expect(Object.keys(files).filter(p=>p.endsWith('.png'))).toHaveLength(2)
  expect(readDocument(JSON.parse(strFromU8(files['document.buttergui.json'])))).toEqual(doc)
})
test('detach preserves integration metadata and native configuration, and removes custom data',()=>{
  let doc=empty();const id=addComponent(doc,techPack(),'fluid-port',doc.root.id)
  doc=readDocument(doc);doc.components![id].variant='output';detachComponent(doc,id)
  const result=readDocument(doc)
  expect(result.component_refs![id]).toBeUndefined();expect(result.library).toEqual({})
  expect(result.semantics![id].capabilities).toEqual(['fluid.extract'])
  expect(result.components![id].props).toEqual({})
  expect(positionedBoxes(result).find(b=>b.id===id)!.w).toBe(18)
})
