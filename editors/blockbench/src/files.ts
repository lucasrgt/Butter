import { call } from './api.ts'
import { current } from './host.ts'
import { attempt } from './dom.ts'
import { readDocument } from './document.ts'
import { previewPng } from './preview.ts'

export function save(format: 'butter' | 'document' | 'spec' | 'semantics' | 'png') {
  const name = current().snapshot().root.name.replace(/[^A-Za-z0-9_-]/g, '_')
  if (format === 'png') {
    Blockbench.export({ type: 'PNG preview', extensions: ['png'], name,
      savetype: 'image', content: previewPng(current().snapshot(), 3) })
    return
  }
  const { text } = call('export', { format }) as { text: string }
  const extension = format === 'butter' ? 'butter' : 'json'
  Blockbench.export({ type: 'Butter GUI', extensions: [extension],
    name: format === 'document' ? `${name}.buttergui` : format === 'spec' || format === 'semantics' ? `${name}.${format}` : name,
    savetype: 'text', content: text })
}

export function openDocument() {
  Blockbench.import({ type: 'Butter GUI document', extensions: ['json'], readtype: 'text', multiple: false }, (files: Array<{ content: unknown }>) => {
    if (!files[0]) return
    attempt(() => {
      const text = String(files[0].content)
      if (text.length > 1_000_000) throw new Error('Document exceeds 1 MB')
      const doc = readDocument(JSON.parse(text))
      call('begin', { name: doc.root.name, preset: 'empty' })
      call('import', { text })
    })
  })
}
