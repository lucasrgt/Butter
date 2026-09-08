import type { ButterDocument } from './document.ts'
import type { Widget } from '../../gui-builder/src/model/types.ts'
import { positionedBoxes } from './position.ts'
import { readSemantics } from './semantics-model.ts'
import { semanticProps } from './semantics-source.ts'

const types = {gas: 'GasTank', flame: 'Flame', button: 'Button', slider: 'Slider', checkbox: 'Checkbox', toggle: 'Toggle', radio: 'Radio', scrollbar: 'Scrollbar', tab: 'Tab', separator: 'Separator',  slot: 'Slot', progress: 'ProgressBar', energy: 'EnergyBar', tank: 'FluidTank', search: 'SearchBar' }
export function exportPixels(doc: ButterDocument) {
  let name = doc.root.name.split(/[^A-Za-z0-9]+/).filter(Boolean).map(word => word[0].toUpperCase() + word.slice(1)).join('') || 'Screen'
  if (/^\d/.test(name)) name = `Screen${name}`
  const boxes = new Map(positionedBoxes(doc).map(box => [box.id, box])), semantics = readSemantics(doc.root, doc.semantics)
  function emit(node: Widget, depth: number): string {
    const config = semantics[node.id], pad = '  '.repeat(depth), box = boxes.get(node.id)
    if (node.kind === 'screen' || node.kind === 'row' || node.kind === 'column' || node.kind === 'player') {
      const props = semanticProps(node, config, node.kind === 'screen' || config.region === true)
      props.push('class: "w-176 h-166"')
      const children = node.kind === 'player' ? Array.from({ length: 36 }, (_, index) => {
        const id = `${config.id}.${index}`, slot = config.slot! + index, x = box!.x + index % 9 * 18
        const y = box!.y + (index >= 27 ? 58 : Math.floor(index / 9) * 18)
        return `${pad}  Slot(${slot}, id: ${JSON.stringify(id)}, container_index: ${slot}, x: ${x}, y: ${y}, class: "w-18 h-18", semantics: (id: ${JSON.stringify(id)}, role: "slot", label: ${JSON.stringify(`${config.label ?? 'Player inventory'} ${index + 1}`)}))`
      }) : node.children.map(child => emit(child, depth + 1))
      return `${pad}Stack(${props.join(', ')}, children: [\n${children.join(',\n')}\n${pad}])`
    }
    const type = node.kind === 'progress' && doc.components?.[node.id]?.variant === 'arrow' ? 'RecipeProgress' : types[node.kind], props = semanticProps(node, config)
    for (const [key, value] of Object.entries(doc.components?.[node.id]?.props ?? {})) {
      if (key !== 'text' && !config.bindings?.[key as keyof typeof config.bindings]) props.push(`${key}: ${JSON.stringify(value)}`)
    }
    if (node.kind === 'button' || node.kind === 'tab') props.unshift(JSON.stringify(doc.components?.[node.id]?.props?.text ?? (node.kind === 'button' ? 'Button' : 'Tab')))
    props.push(`x: ${box!.x}`, `y: ${box!.y}`, `class: "w-${box!.w} h-${box!.h}"`)
    return `${pad}${type}(${node.kind === 'slot' ? `${config.slot}, ` : ''}${props.join(', ')})`
  }
  return `public component ${name}() {\n${emit(doc.root, 1)}\n}\n`
}
