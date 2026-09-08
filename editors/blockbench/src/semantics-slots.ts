import type { Widget } from '../../gui-builder/src/model/types.ts'
import type { SemanticConfig } from './semantics-catalog.ts'

export function allocateSlots(nodes: Widget[], values: Record<string, SemanticConfig>) {
  const occupied = new Set<number>(), slots = nodes.filter(node => node.kind === 'slot' || node.kind === 'player')
  const length = (node: Widget) => node.kind === 'player' ? 36 : 1
  function reserve(node: Widget, start: number) {
    if (!Number.isInteger(start) || start < 0 || start + length(node) > 4096) throw new Error('Container slots must fit within 0–4095')
    for (let offset = 0; offset < length(node); offset++) {
      const index = start + offset
      if (occupied.has(index)) throw new Error(`Duplicate container slot: ${index}`)
      occupied.add(index)
    }
  }
  slots.filter(node => values[node.id].slot !== undefined).forEach(node => reserve(node, values[node.id].slot!))
  const missing = slots.filter(node => values[node.id].slot === undefined).sort((a, b) => Number(a.kind === 'player') - Number(b.kind === 'player'))
  for (const node of missing) {
    let start = node.kind === 'player' && occupied.size ? Math.max(...occupied) + 1 : 0
    while (Array.from({ length: length(node) }, (_, offset) => start + offset).some(index => occupied.has(index))) start++
    reserve(node, start); values[node.id].slot = start
  }
}
export function freshSemanticId(preferred: string, used: Set<string>) {
  let id = preferred, suffix = 1
  while (used.has(id)) { const end = `.${suffix++}`; id = preferred.slice(0, 100 - end.length) + end }
  used.add(id); return id
}
