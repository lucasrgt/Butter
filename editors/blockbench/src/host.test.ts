import { test, expect } from 'bun:test'
import { crusher } from '../../gui-builder/src/model/presets.ts'
import { current, setupProjectState, teardownProjectState, persist } from './host.ts'

test('native project parsing replaces the temporary empty store and preserves later undo', () => {
  const host = globalThis as unknown as Record<string, unknown>
  const events = new Map<string, () => void>()
  const prior = new Map(['ModelProject', 'Property', 'Blockbench', 'Codecs', 'Project'].map(key => [key, host[key]]))
  host.ModelProject = class {}
  host.Property = class { delete() {} }
  host.Blockbench = { on() {}, removeListener() {} }
  host.Codecs = { project: {
    on(name: string, callback: () => void) { events.set(name, callback) },
    removeListener(name: string) { events.delete(name) },
  } }
  const project = { butter_gui: {} as unknown, saved: true }
  host.Project = project
  try {
    setupProjectState()
    expect(current().snapshot().root.name).toBe('menu')
    project.butter_gui = { version: 1, root: crusher(), hidden: [] }
    events.get('parsed')!()
    expect(current().snapshot().root.name).toBe('crusher')
    const doc = current().snapshot()
    doc.root.name = 'Renamed'
    current().commit(doc)
    persist()
    expect(project.saved).toBeFalse()
    expect(current().inspect().canUndo).toBeTrue()
    current().history('undo')
    expect(current().snapshot().root.name).toBe('crusher')
    teardownProjectState()
    expect(events.has('parsed')).toBeFalse()
  } finally {
    for (const [key, value] of prior) {
      if (value === undefined) delete host[key]
      else host[key] = value
    }
  }
})
