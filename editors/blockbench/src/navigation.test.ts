import { test, expect } from 'bun:test'
import { componentPage, COMPONENTS } from './component-catalog.ts'
import { zoomAt } from './canvas-camera.ts'
import { PALETTE } from '../../gui-builder/src/model/types.ts'

test('catalog covers the supported palette and filters category plus search tokens', () => {
  expect(COMPONENTS.map(c => c.kind).sort()).toEqual([...PALETTE].sort())
  expect(componentPage(' fluid  gauge ', 'machine').items.map(c => c.kind)).toEqual(['tank'])
  expect(componentPage('PLAYER').items.map(c => c.kind)).toEqual(['player'])
  expect(componentPage('slot', 'layout').total).toBe(0)
})

test('pagination limits results globally to 10 and clamps empty or stale pages', () => {
  const many = Array.from({ length: 23 }, (_, i) => ({ ...COMPONENTS[i % COMPONENTS.length], title: `Widget ${i}` }))
  const first = componentPage('', 'all', 1, many), second = componentPage('', 'all', 2, many), last = componentPage('', 'all', 999, many)
  expect(first.items.length).toBe(10)
  expect(second.items.length).toBe(10)
  expect(last.items.length).toBe(3)
  expect(last.page).toBe(3)
  expect(new Set([...first.items, ...second.items, ...last.items].map(c => c.title)).size).toBe(23)
  expect(componentPage('no match', 'all', 999, many)).toMatchObject({ items: [], total: 0, page: 1, pages: 1 })
})

test('cursor anchored zoom preserves the same GUI point within half a screen pixel', () => {
  for (const before of [1, 3, 8]) for (const after of [1, 4, 8]) {
    const area = { width: 801, height: 617 }, cursor = { x: 317, y: 219 }
    const old = { left: -113, top: 42, scale: before }, pan = zoomAt(area, cursor, old, after)
    const left = (area.width - 176 * after) / 2 + pan.pan_x, top = (area.height - 166 * after) / 2 + pan.pan_y
    expect(Math.abs(left + (cursor.x - old.left) / before * after - cursor.x)).toBeLessThanOrEqual(.5)
    expect(Math.abs(top + (cursor.y - old.top) / before * after - cursor.y)).toBeLessThanOrEqual(.5)
  }
})
