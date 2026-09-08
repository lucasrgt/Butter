export const VERSIONS = [
  { id: 'b1.7.3', label: 'Beta 1.7.3', available: true, adapter: 'minecraft-beta' },
  { id: '1.7.10', label: 'Minecraft 1.7.10', available: false, adapter: null },
  { id: '1.12.2', label: 'Minecraft 1.12.2', available: false, adapter: null },
  { id: 'modern', label: 'Modern Minecraft', available: false, adapter: null },
] as const

export function requireVersion(value: unknown): 'b1.7.3' {
  const profile = VERSIONS.find(profile => profile.id === value)
  if (!profile?.available) throw new Error(`Minecraft adapter not available: ${String(value)}`)
  return 'b1.7.3'
}
