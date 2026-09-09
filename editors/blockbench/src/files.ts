import { call } from './api.ts'
import { current } from './host.ts'
import { attempt } from './dom.ts'
import { readDocument } from './document.ts'
import { previewPng } from './preview.ts'
import { exportBundle, exportWarnings } from './library/bundle.ts'
import { prepareImages } from './library/images.ts'

export async function save(format: 'butter' | 'document' | 'spec' | 'semantics' | 'machine' | 'png' | 'bundle') {
  const doc=current().snapshot(),name = doc.root.name.replace(/[^A-Za-z0-9_-]/g, '_')
  if(format==='bundle') {
    Blockbench.export({type:'Butter integration bundle',extensions:['zip'],name:`${name}-integration`,savetype:'buffer',content:new Uint8Array(exportBundle(current().snapshot())).buffer})
    return
  }
  if (format === 'png') {
    await prepareImages(doc)
    Blockbench.export({ type: 'PNG preview', extensions: ['png'], name,
      savetype: 'image', content: previewPng(doc, 3) })
    return
  }
  const { text } = call('export', { format }) as { text: string }
  if(format==='butter')for(const warning of exportWarnings(current().snapshot()))Blockbench.showQuickMessage(warning,6000)
  const extension = format === 'butter' ? 'butter' : 'json'
  Blockbench.export({ type: 'Butter GUI', extensions: [extension],
    name: format === 'document' ? `${name}.buttergui` : format === 'machine' ? `${name}.machine.gui` : format === 'spec' || format === 'semantics' ? `${name}.${format}` : name,
    savetype: 'text', content: text })
}

export function openDocument() {
  Blockbench.import({ type: 'Butter GUI document', extensions: ['json'], readtype: 'text', multiple: false }, (files: Array<{ content: unknown }>) => {
    if (!files[0]) return
    attempt(() => {
      const text = String(files[0].content)
      if (text.length > 10*1024*1024) throw new Error('Document exceeds 10 MB')
      const doc = readDocument(JSON.parse(text))
      call('begin', { name: doc.root.name, preset: 'empty' })
      call('import', { text })
    })
  })
}
