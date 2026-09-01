import { describe, expect, it } from 'vitest'
import { emitButter } from './butter.ts'
import { crusher, emptyScreen } from './presets.ts'
import { compileSpec, roleOf } from './spec.ts'
import { widget } from './tree.ts'

describe('compileSpec', () => {
  it('matches the Worldline crusher tree', () => {
    const spec = compileSpec(crusher())
    expect(spec.screen).toBe('crusher')
    expect(spec.nodes).toHaveLength(41)
    expect(spec.nodes[0]).toEqual({ role: 'screen', name: 'crusher', index: -1 })
    expect(spec.nodes[1]).toEqual({ role: 'slot', name: 'input', index: 0 })
    expect(spec.nodes[2]).toEqual({ role: 'progress', name: 'craft', index: -1 })
    expect(spec.nodes[3]).toEqual({ role: 'slot', name: 'output', index: 1 })
    expect(spec.nodes[4]).toEqual({ role: 'energy', name: 'energy', index: -1 })
    expect(spec.nodes[5]).toEqual({ role: 'slot', name: 'player.0', index: 2 })
    expect(spec.nodes[40]).toEqual({ role: 'slot', name: 'player.35', index: 37 })
  })

  it('omits player slots when playerInventory is absent', () => {
    const spec = compileSpec(widget('screen', 'bare', [widget('slot', 'input')]))
    expect(spec.nodes).toHaveLength(2)
    expect(spec.nodes[1]).toEqual({ role: 'slot', name: 'input', index: 0 })
  })

  it('rejects unknown builder types', () => {
    expect(() => roleOf('unknown')).toThrow(/unsupported/)
  })
})

describe('emitButter', () => {
  it('emits a Butter crusher component', () => {
    const template = emitButter(crusher())
    expect(template).toContain('public component Crusher()')
    expect(template).toContain('Row(\n        id: "process"')
    expect(template).toContain('Slot(id: "input")')
    expect(template).toContain('ProgressBar(id: "craft")')
    expect(template).toContain('EnergyBar(id: "energy")')
    expect(template).toContain('PlayerInventory()')
  })

  it('emits a player-only screen', () => {
    expect(emitButter(emptyScreen())).toBe(
      'public component Menu() {\n  PlayerInventory()\n}',
    )
  })
})
