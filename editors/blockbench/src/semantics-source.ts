import type { Widget } from '../../gui-builder/src/model/types.ts'
import type { SemanticConfig } from './semantics-catalog.ts'
import { SEMANTIC_ROLES } from './semantics-catalog.ts'

export function semanticProps(node: Widget, config: SemanticConfig, exposed = true): string[] {
  const result: string[] = []
  if (exposed) {
    result.push(`id: ${JSON.stringify(config.id)}`)
    const fields = [`id: ${JSON.stringify(config.id)}`, `role: ${JSON.stringify(config.role ?? SEMANTIC_ROLES[node.kind][0])}`,
      `label: ${JSON.stringify(config.label ?? node.name)}`]
    if (config.description) fields.push(`description: ${JSON.stringify(config.description)}`)
    result.push(`semantics: (${fields.join(', ')})`)
  }
  if (node.kind === 'slot') result.push(`container_index: ${config.slot}`)
  if (config.tab_index !== undefined) result.push(`tabIndex: ${config.tab_index}`)
  for (const [field, path] of Object.entries(config.bindings ?? {})) result.push(`${field}: ${path}`)
  if (config.action) result.push(`action: ${config.action}`)
  return result
}
