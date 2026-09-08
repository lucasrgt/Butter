export function zoomAt(viewport: { width: number; height: number },
  cursor: { x: number; y: number }, old: { left: number; top: number; scale: number }, scale: number) {
  const x = (cursor.x - old.left) / old.scale, y = (cursor.y - old.top) / old.scale
  return { pan_x: Math.round(cursor.x - x * scale - (viewport.width - 176 * scale) / 2),
    pan_y: Math.round(cursor.y - y * scale - (viewport.height - 166 * scale) / 2) }
}
