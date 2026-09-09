import css from './style.css'
import { restoreMaterialPack, disposeMaterialPack } from './minecraft/material-assets.ts'
import { api, call } from './api.ts'
import { setupProjectState, teardownProjectState, subscribe, refresh } from './host.ts'
import { renderPalette } from './palette.ts'
import { renderLayers } from './layers.ts'
import { renderSidebar } from './sidebar.ts'
import { mountViewer } from './stage.ts'
import { installKeyboard } from './keyboard.ts'
import { restoreAssets, disposeAssets } from './minecraft/assets.ts'
import { element, attempt } from './dom.ts'
import { disposeContextMenu } from './context-menu.ts'
import { disposeHelp } from './capabilities.ts'
import { disposeSemanticTree } from './semantics-dialog.ts'
import { disposeImages } from './library/images.ts'
import { disposeLibrary } from './library/manager.ts'

const panels: Panel[] = []
const cleanups: Array<() => void> = []
let mode: Mode | undefined
let action: Action | undefined
let style: { delete(): void } | undefined
const host = globalThis as typeof globalThis & { BlockbenchButter?: typeof api }

function panel(id: string, name: string, side: 'left' | 'right', render: (root: HTMLElement) => void) {
  const instance = new Panel(id, { name, icon: 'dashboard', default_side: side,
    default_position: { slot: side === 'right' ? 'right_bar' : 'left_bar' },
    mode_positions: { butter_gui: { slot: side === 'right' ? 'right_bar' : 'left_bar' } },
    condition: () => !!Project && Modes.selected === mode, resizable: true, growable: id !== 'butter_components' })
  const root = element('div', 'butter-ui butter-panel')
  instance.node.append(root)
  const update = () => { if (Project) attempt(() => render(root)) }
  cleanups.push(subscribe(update))
  panels.push(instance)
}

BBPlugin.register('blockbench_butter', {
  title: 'Blockbench Butter', author: 'lucasrgt', version: '0.9.0', min_version: '5.0.0',
  description: 'Butter GUI authoring for Minecraft Beta 1.7.3: components, layers, preview and MCP integration.',
  icon: 'dashboard_customize', variant: 'both', tags: ['GUI', 'Minecraft'],
  onload() {
    setupProjectState()
    style = Blockbench.addCSS(css)
    mode = new Mode('butter_gui', {
      name: 'Butter', icon: 'dashboard_customize', condition: () => !!Project,
      hide_toolbars: true, selectElements: false,
      component: {
        template: '<div></div>',
        mounted(this: { $el: HTMLElement; butterDispose?: () => void }) { this.butterDispose = mountViewer(this.$el) },
        beforeDestroy(this: { butterDispose?: () => void }) { this.butterDispose?.(); this.butterDispose = undefined },
      },
      onSelect: refresh,
    })
    panel('butter_components', 'Components', 'left', renderPalette)
    panel('butter_layers', 'Layers', 'left', renderLayers)
    panel('butter_inspector', 'Properties', 'right', renderSidebar)
    action = new Action('butter_new_gui', { name: 'New Butter GUI', icon: 'dashboard_customize',
      click: () => attempt(() => call('begin', { preset: 'crusher' })) })
    MenuBar.addAction(action, 'file.new')
    host.BlockbenchButter = api
    window.addEventListener('machine-contract-changed',refresh)
    cleanups.push(()=>window.removeEventListener('machine-contract-changed',refresh))
    cleanups.push(installKeyboard())
    Blockbench.on('select_project', disposeSemanticTree); Blockbench.on('select_mode', disposeSemanticTree)
    Blockbench.on('select_project', disposeContextMenu); Blockbench.on('select_mode', disposeContextMenu)
    cleanups.push(() => {
      Blockbench.removeListener('select_project', disposeSemanticTree); Blockbench.removeListener('select_mode', disposeSemanticTree)
      Blockbench.removeListener('select_project', disposeContextMenu); Blockbench.removeListener('select_mode', disposeContextMenu)
    })
    restoreAssets(); restoreMaterialPack()
  },
  onunload() {
    if (Modes.selected === mode && Project) Modes.options.edit.select()
    for (const project of ModelProject.all) if (project.mode === 'butter_gui') project.mode = 'edit'
    disposeHelp(); disposeContextMenu(); disposeSemanticTree()
    disposeAssets(); disposeMaterialPack();disposeImages();disposeLibrary()
    mode?.delete()
    mode?.vue?.$destroy()
    document.getElementById('mode_screen_butter_gui')?.remove()
    cleanups.splice(0).forEach(cleanup => cleanup())
    panels.splice(0).forEach(panel => panel.delete())
    action?.delete()
    style?.delete()
    teardownProjectState()
    if (host.BlockbenchButter === api) delete host.BlockbenchButter
  },
})


