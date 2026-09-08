import { loadMaterialPack, materialStatus, clearMaterialPack } from './minecraft/material-assets.ts'
import { current, persist, refresh } from './host.ts'
import { viewState, setView } from './view-state.ts'
import { assetStatus, loadAssets, clearAssets } from './minecraft/assets.ts'
import { VERSIONS, requireVersion } from './versions.ts'
import { camera } from './machine-view.ts'
import { readLocal, writeLocal } from './local-files.ts'
import { call } from './api.ts'
import { previewPng } from './preview.ts'
import { prepareImages } from './library/images.ts'
import { exportBundle } from './library/bundle.ts'

export const extraCommands = ['view', 'assets', 'versions', 'camera', 'panels', 'attach', 'file']
export function extraCall(command: string, args: Record<string, unknown>): unknown {
  if (command === 'view') return Object.keys(args).length ? setView(args) : viewState()
  if (command === 'camera') return camera(args)
  if (command === 'assets') {
    if (args.action === 'materials_status') return materialStatus()
    if (args.action === 'materials_clear') return clearMaterialPack()
    if (args.action === 'materials_load') {
      if (typeof args.path !== 'string') throw new Error('Expected material pack path')
      return loadMaterialPack(args.path)
    }
    if (args.action === 'clear') return clearAssets()
    if (args.action === 'load') {
      if (typeof args.path !== 'string') throw new Error('Expected a local Minecraft JAR path')
      return loadAssets(args.path)
    }
    return assetStatus()
  }
  if (command === 'versions') {
    if (args.target !== undefined) {
      const doc = current().snapshot()
      doc.target = requireVersion(args.target)
      current().commit(doc)
      persist()
    }
    return { target: current().snapshot().target, profiles: VERSIONS, assets: assetStatus(),
      sourceIndependent: true, note: 'Target selects an adapter; .butter source is shared across targets.' }
  }
  if (command === 'panels') {
    const items = ['butter_components', 'butter_layers', 'butter_inspector'].map(id => Interface.Panels[id])
    if (args.id !== undefined) {
      const panel = items.find(item => item.id === args.id)
      if (!panel) throw new Error('Unknown Butter panel')
      if (args.side !== undefined) {
        if (args.side !== 'left_bar' && args.side !== 'right_bar') throw new Error('Invalid panel side')
        panel.moveTo(args.side)
      }
      if (typeof args.folded === 'boolean') panel.fold(args.folded)
    }
    return items.map(item => ({ id: item.id, folded: item.folded, side: item.slot }))
  }
  if (command === 'attach') {
    if (args.project_id === undefined) return ModelProject.all.map(p => ({ id: p.uuid, name: p.name }))
    const target = ModelProject.all.find(p => p.uuid === args.project_id)
    if (!target) throw new Error('Unknown model project')
    const saved = (target as ModelProject & { butter_gui?: { root?: unknown } }).butter_gui
    if (saved?.root && target !== Project && args.replace !== true) throw new Error('Target already has a GUI; set replace explicitly')
    const doc = current().snapshot()
    target.select()
    current().commit(doc)
    persist()
    Modes.options.butter_gui.select()
    setView({ layout: 'split' })
    return { project: target.uuid, ...current().inspect() }
  }
  if (command === 'file') {
    if (typeof args.path !== 'string') throw new Error('Expected absolute file path')
    if (!/^(?:[A-Za-z]:[\\/]|\/)/.test(args.path)) throw new Error('Use an absolute file path')
    if (args.action === 'open') return call('import', { text: new TextDecoder().decode(readLocal(args.path, 10*1024*1024)) })
    if (args.action !== 'save') throw new Error('Expected open or save')
    if (args.format === 'png') {
      const doc=current().snapshot(),path=args.path
      return prepareImages(doc).then(()=>{
        const data = previewPng(doc, Number(args.scale ?? 3)).split(',')[1]
        writeLocal(path, Uint8Array.from(atob(data), c => c.charCodeAt(0)));return {saved:path}
      })
    } else if(args.format==='bundle')writeLocal(args.path,exportBundle(current().snapshot()))
    else writeLocal(args.path, (call('export', { format: args.format ?? 'document' }) as { text: string }).text)
    return { saved: args.path }
  }
  refresh()
}
