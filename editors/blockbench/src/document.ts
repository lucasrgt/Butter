import { GROUP_KINDS, PALETTE, type Widget } from '../../gui-builder/src/model/types.ts'
import { positionedBoxes } from './position.ts'
import { requireVersion } from './versions.ts'
import type { SemanticConfig } from './semantics-catalog.ts'
import { readComponentMaps, type ComponentConfig, type PropertyValues } from './component-properties.ts'
import { readSemantics } from './semantics-model.ts'

export interface ButterDocument {
  components?: Record<string, ComponentConfig>
  preview?: Record<string, PropertyValues>
  version: 1
  root: Widget
  hidden: string[]
  locked?: string[]
  target?: 'b1.7.3'
  positions?: Record<string, { x: number; y: number }>
  semantics?: Record<string, SemanticConfig>
}

export function readDocument(value: unknown): ButterDocument {
  if (!value || typeof value !== 'object') throw new Error('Expected a Butter document')
  const doc = value as ButterDocument
  if (doc.version !== 1) throw new Error('Unsupported Butter document version')
  const ids = new Set<string>()
  const leaves = new Set<string>()
  const names = new Set<string>()
  let players = 0
  function visit(node: Widget, depth: number): Widget {
    if (depth > 24 || ids.size >= 512) throw new Error('Document exceeds 512 nodes or 24 levels')
    if (!node || typeof node !== 'object') throw new Error('Invalid widget')
    for (const key of Object.keys(node)) {
      if (!['id', 'kind', 'name', 'children'].includes(key)) throw new Error(`Unsupported widget field: ${key}`)
    }
    if (typeof node.id !== 'string' || !/^[A-Za-z0-9_.-]{1,100}$/.test(node.id)) {
      throw new Error('Widget id must contain 1–100 letters, digits, dots, dashes or underscores')
    }
    if (ids.has(node.id)) throw new Error(`Duplicate widget id: ${node.id}`)
    if (typeof node.name !== 'string' || !node.name.trim() || node.name.length > 100 || /[\x00-\x1f]/.test(node.name)) {
      throw new Error('Widget name must contain 1–100 printable characters')
    }
    if (names.has(node.name)) throw new Error(`Duplicate semantic name: ${node.name}`)
    if (depth === 0 ? node.kind !== 'screen' : !PALETTE.includes(node.kind)) {
      throw new Error('Expected one screen root and supported child components')
    }
    if (!Array.isArray(node.children)) throw new Error('Widget children must be an array')
    if (!GROUP_KINDS.has(node.kind) && node.children.length) throw new Error('Leaf widgets cannot have children')
    if (node.kind === 'player') {
      if (depth !== 1 || ++players > 1 || node.name !== 'player') {
        throw new Error('PlayerInventory must be a single direct screen child named player')
      }
    }
    ids.add(node.id)
    if (!GROUP_KINDS.has(node.kind)) leaves.add(node.id)
    names.add(node.name)
    return { id: node.id, name: node.name, kind: node.kind, children: node.children.map(child => visit(child, depth + 1)) }
  }
  const root = visit(doc.root, 0)
  if (players && [...names].some(name => /^player\.\d+$/.test(name))) {
    throw new Error('Names player.N are reserved for PlayerInventory slots')
  }
  if (!Array.isArray(doc.hidden) || doc.hidden.some(id => typeof id !== 'string' || !ids.has(id))) {
    throw new Error('Hidden layers must reference existing widget ids')
  }
  if (doc.locked !== undefined && (!Array.isArray(doc.locked) || doc.locked.some(id => typeof id !== 'string' || !ids.has(id)))) {
    throw new Error('Locked layers must reference existing widget ids')
  }
  const target = requireVersion(doc.target ?? 'b1.7.3')
  const positions: Record<string, { x: number; y: number }> = {}
  if (doc.positions !== undefined && (!doc.positions || typeof doc.positions !== 'object' || Array.isArray(doc.positions))) {
    throw new Error('Positions must map component ids to integer x/y coordinates')
  }
  for (const [id, point] of Object.entries(doc.positions ?? {})) {
    if (!leaves.has(id) || !point || Object.keys(point).some(key => key !== 'x' && key !== 'y')
      || ![point.x, point.y].every(value => Number.isInteger(value) && Math.abs(value) <= 32768)) {
      throw new Error(`Invalid pixel position: ${id}`)
    }
    positions[id] = { x: point.x, y: point.y }
  }
  return { version: 1, root, hidden: [...new Set(doc.hidden)], locked: [...new Set(doc.locked ?? [])], target, positions,
    semantics: readSemantics(root, doc.semantics), ...readComponentMaps(root, doc.components, doc.preview) }
}

export function layoutWarnings(doc: ButterDocument): string[] {
  return positionedBoxes(doc).filter(box => box.x < 0 || box.y < 0 || box.x + box.w > 176 || box.y + box.h > 166)
    .map(box => `${box.name} exceeds the 176 × 166 preview`)
}

export function visibleBoxes(doc: ButterDocument) {
  const hidden = new Set<string>()
  function visit(node: Widget, inherited: boolean) {
    const invisible = inherited || doc.hidden.includes(node.id)
    if (invisible) hidden.add(node.id)
    node.children.forEach(child => visit(child, invisible))
  }
  visit(doc.root, false)
  return positionedBoxes(doc).filter(box => !hidden.has(box.id))
}
