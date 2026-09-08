import { call } from './api.ts'
import { viewState } from './view-state.ts'
import { element, iconButton, label } from './dom.ts'

export function alignmentControls(enabled: boolean, count: number) {
  const section = element('div', 'butter-alignment'), target = element('select')
  target.setAttribute('aria-label', 'Alignment reference')
  for (const [value, title] of [['auto', 'Auto'], ['selection', 'Selection'], ['canvas', 'Canvas'], ['parent', 'Parent group']]) {
    const option = element('option', '', title); option.value = value; target.append(option)
  }
  target.value = viewState().align_target
  target.title = 'Auto: one object aligns to the canvas; multiple objects align to their combined bounds'
  target.onchange = () => call('view', { align_target: target.value })
  section.append(label('Align to', target))
  const grid = element('div', 'butter-align-grid')
  for (const [mode, icon, title] of [
    ['left', 'align_horizontal_left', 'Align left'], ['center_x', 'align_horizontal_center', 'Center horizontally · Alt H'], ['right', 'align_horizontal_right', 'Align right'],
    ['top', 'align_vertical_top', 'Align top'], ['center_y', 'align_vertical_center', 'Center vertically · Alt V'], ['bottom', 'align_vertical_bottom', 'Align bottom'],
  ]) {
    const button = iconButton(icon, title, () => call('align', { mode })); button.disabled = !enabled; grid.append(button)
  }
  const distribution = element('div', 'butter-distribute-grid')
  for (const [axis, icon] of [['horizontal', 'horizontal_distribute'], ['vertical', 'vertical_distribute']]) {
    const button = iconButton(icon, `Equal ${axis} gaps`, () => call('distribute', { axis }))
    button.disabled = !enabled || count < 3; distribution.append(button)
  }
  section.append(grid, distribution); return section
}
