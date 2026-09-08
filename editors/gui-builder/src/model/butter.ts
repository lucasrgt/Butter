import type { Kind, Widget } from './types.ts'

const TYPE: Record<Exclude<Kind, 'screen'>, string> = {
  gas: 'GasTank',
  flame: 'Flame',
  button: 'Button',
  slider: 'Slider',
  checkbox: 'Checkbox',
  toggle: 'Toggle',
  radio: 'Radio',
  scrollbar: 'Scrollbar',
  tab: 'Tab',
  separator: 'Separator',
  row: 'Row',
  column: 'Column',
  slot: 'Slot',
  progress: 'ProgressBar',
  energy: 'EnergyBar',
  tank: 'FluidTank',
  search: 'SearchBar',
  player: 'PlayerInventory',
}

/** Emits a standalone Butter component while keeping GameUiSpec as an interoperability export. */
export function emitButter(root: Widget): string {
  if (root.kind !== 'screen') throw new Error('root must be a screen')
  const component = componentName(root.name)
  const body = emitRoot(root)
  return `public component ${component}() {\n${body}\n}`
}

function emitRoot(root: Widget): string {
  if (root.children.length === 1) return emitWidget(root.children[0], '  ')
  const children = root.children.map((child) => emitWidget(child, '      ')).join(',\n')
  return `  Column(\n    id: "${escape(root.name)}",\n    children: [${children ? `\n${children}\n    ` : ''}]\n  )`
}

function emitWidget(widget: Widget, indent: string): string {
  if (widget.kind === 'screen') throw new Error('nested screens are not supported')
  const type = TYPE[widget.kind]
  if (widget.kind === 'player') return `${indent}${type}()`
  if (widget.kind !== 'row' && widget.kind !== 'column') {
    return `${indent}${type}(id: "${escape(widget.name)}")`
  }
  if (widget.children.length === 0) return `${indent}${type}(id: "${escape(widget.name)}")`
  const inner = widget.children.map((child) => emitWidget(child, `${indent}    `)).join(',\n')
  return `${indent}${type}(\n${indent}  id: "${escape(widget.name)}",\n${indent}  children: [\n${inner}\n${indent}  ]\n${indent})`
}

function componentName(value: string): string {
  const words = value.trim().split(/[^A-Za-z0-9]+/).filter(Boolean)
  const joined = words.map((word) => word[0].toUpperCase() + word.slice(1)).join('') || 'Screen'
  return /^[0-9]/.test(joined) ? `Screen${joined}` : joined
}

function escape(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}
