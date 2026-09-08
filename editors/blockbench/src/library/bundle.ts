import { zipSync, strToU8 } from 'fflate'
import type { ButterDocument } from '../document.ts'
import { exportPixels } from '../export-pixels.ts'
import { semanticTree } from '../semantics-export.ts'
import { positionedBoxes } from '../position.ts'
import { resolvedComponent } from './document.ts'
import { packFiles } from './archive.ts'

export function exportBundle(doc:ButterDocument) {
  const files:Record<string,Uint8Array>={
    'interface.butter':strToU8(exportPixels(doc)),
    'document.buttergui.json':strToU8(JSON.stringify(doc,null,2)),
    'semantics.json':strToU8(JSON.stringify(semanticTree(doc),null,2)),
  }
  const boxes=positionedBoxes(doc)
  const instances=Object.entries(doc.component_refs??{}).map(([id,ref])=>{
    const resolved=resolvedComponent(doc,id)
    return {widget_id:id,...ref,variant:resolved.variant?.id,props:resolved.props,bounds:boxes.find(b=>b.id===id),binding_hints:resolved.def?.binding_hints}
  })
  const used=new Set(instances.map(i=>i.pack))
  for(const key of used)for(const [path,data] of Object.entries(packFiles(doc.library![key])))files[`packs/${key}/${path}`]=data
  files['integration.json']=strToU8(JSON.stringify({schema:'butter.integration.v1',target:doc.target??'b1.7.3',instances,
    rendering:{native_bases:true,declarative_layers:'editor preview; requires a mod renderer consuming the included component definitions'},
    semantics:'Declared capabilities and attributes are compiled into the semantic tree. Implement transfer logic and backing bindings in the mod.'},null,2))
  files['README.txt']=strToU8('Butter integration bundle\n\nCompile interface.butter against the mod backing class. The source contains native widget bases and semantic contracts.\nCustom visual layers and PNGs are preserved under packs/ and described in integration.json; they require a mod renderer.\nDo not treat visual-test values as runtime state. No original Minecraft assets are included.\n')
  return zipSync(files,{level:6})
}
export const exportWarnings=(doc:ButterDocument)=>Object.keys(doc.component_refs??{}).length
  ? ['Custom visual layers and PNGs require a mod renderer. Export the integration bundle to include their definitions and assets.'] : []
