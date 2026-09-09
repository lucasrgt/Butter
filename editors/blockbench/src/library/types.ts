import type { Kind } from '../../../gui-builder/src/model/types.ts'
import type { Field, PropertyValues, Variant } from '../component-properties.ts'
import type { SemanticConfig } from '../semantics-catalog.ts'

export type PackSemantics = Omit<SemanticConfig, 'id' | 'slot' | 'tab_index'>
export interface Category { id: string; title: string; icon?: string; parent?: string }
export interface PackMod { id: string; role: 'primary' | 'addon'; reason?: string }
export interface Layer {
  type: 'rect' | 'outline' | 'image' | 'text' | 'fill'
  x: number; y: number; w: number; h: number
  color?: string; text?: string; asset?: string; crop?: number[]
  thickness?: number; opacity?: number; direction?: 'up' | 'down' | 'left' | 'right'
  value?: string; frames?: number; frame_ms?: number
  when?: { field: string; equals: string | boolean | number }
}
export interface PackVariant extends Variant {
  layers?: Layer[]; props?: PropertyValues; preview?: PropertyValues; semantics?: PackSemantics
  base_bounds?: number[]; base_variant?: string
}
export interface ComponentDefinition {
  schema: 'butter.component.v1'; id: string; title: string; description?: string; category: string
  base: Kind; icon?: string; tags?: string[]; version?: string; author?: string; license?: string
  variants: PackVariant[]; fields?: Field[]; layers?: Layer[]; draw_base?: boolean
  props?: PropertyValues; preview?: PropertyValues; semantics?: PackSemantics
  binding_hints?: Record<string, string>
}
export interface ComponentPack {
  schema: 'butter.pack.v1'; id: string; version: string; title: string; description?: string
  author?: string; license?: string; tags?: string[]; targets: ['b1.7.3']
  categories: Category[]; components: ComponentDefinition[]; assets: Record<string, string>
  machine_types?: import('./machine-types.ts').MachineTypePack[]
  mod?: PackMod
}
export interface InstalledPack { pack: ComponentPack; enabled: boolean; source?: string }
export interface LibraryDocument {
  library?: Record<string, ComponentPack>
  component_refs?: Record<string, { pack: string; component: string }>
}
export const packKey = (pack: Pick<ComponentPack, 'id' | 'version'>) => `${pack.id}@${pack.version}`
export const MAX_PACK_BYTES = 2 * 1024 * 1024
