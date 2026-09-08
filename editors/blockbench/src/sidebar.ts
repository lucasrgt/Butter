import { materialStatus } from './minecraft/material-assets.ts'
import { renderInspector } from './inspector.ts'
import { call } from './api.ts'
import { current } from './host.ts'
import { VERSIONS } from './versions.ts'
import { assetStatus } from './minecraft/assets.ts'
import { element, iconButton, label, attempt } from './dom.ts'

export function renderSidebar(root: HTMLElement) {
  if (current().inspect().gesture === 'Adjust preview') return
  const target = element('select'); target.setAttribute('aria-label', 'Minecraft version')
  for (const version of VERSIONS) {
    const option = element('option', '', `${version.label}${version.available ? '' : ' · Planned'}`)
    option.value = version.id; option.disabled = !version.available; target.append(option)
  }
  target.value = current().snapshot().target ?? 'b1.7.3'
  target.onchange = () => attempt(() => call('versions', { target: target.value }))
  const assets = assetStatus(), settings = element('div', 'butter-project-settings')
  const load = iconButton('folder_open', assets.loaded ? `Replace Minecraft assets: ${assets.source}` : 'Load Beta 1.7.3 JAR for original font and textures', () => {
    Blockbench.import({ type: 'Minecraft Beta 1.7.3 JAR', extensions: ['jar'], readtype: 'binary', multiple: false }, (files: Array<{ path?: string }>) => {
      if (files[0]?.path) Promise.resolve(call('assets', { action: 'load', path: files[0].path })).catch(error => Blockbench.showQuickMessage(String(error), 6000))
    })
  })
  const clear = iconButton('close', 'Unload Minecraft assets', () => call('assets', { action: 'clear' }))
  clear.disabled = !assets.loaded
  const row = element('div', 'butter-assets-row'), status = element('span', 'butter-asset-status', assets.loaded ? 'Assets loaded' : 'Fallback assets')
  status.title = assets.error ?? assets.source ?? 'Load a local Minecraft Beta 1.7.3 JAR'
  row.append(status, load, clear)
  const materials = materialStatus(), pack = iconButton('water', 'Load animated game / mod material pack', () => {
    Blockbench.import({ type: 'Butter material pack', extensions: ['json'], readtype: 'text', multiple: false }, (files: Array<{ path?: string }>) => {
      if (files[0]?.path) Promise.resolve(call('assets', { action: 'materials_load', path: files[0].path })).catch(error => Blockbench.showQuickMessage(String(error), 6000))
    })
  })
  const materialRow = element('div', 'butter-assets-row'), materialLabel = element('span', 'butter-asset-status', materials.loaded ? 'Animated game textures' : 'Fluid textures not loaded')
  materialLabel.title = materials.error ?? materials.source ?? 'Load a local material pack captured from the game or provided by a mod'
  materialRow.append(materialLabel, pack)
  settings.append(label('Minecraft', target), row, materialRow)
  const inspector = element('div', 'butter-inspector-body')
  root.replaceChildren(settings, inspector)
  renderInspector(inspector)
}
