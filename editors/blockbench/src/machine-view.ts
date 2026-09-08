let preview: Preview | undefined

export function camera(args: Record<string, unknown>) {
  const active = preview ?? Preview.all.find(item => item.id === 'main')
  if (!Project || !active) throw new Error('Open a model project first')
  if (Object.keys(args).length) {
    const vector = (value: unknown, fallback: ArrayVector3): ArrayVector3 => {
      if (value === undefined) return fallback
      if (!Array.isArray(value) || value.length !== 3 || !value.every(v => typeof v === 'number' && Number.isFinite(v))) throw new Error('Expected three finite coordinates')
      return value as ArrayVector3
    }
    const projection = args.projection ?? (active.isOrtho ? 'orthographic' : 'perspective')
    if (projection !== 'orthographic' && projection !== 'perspective') throw new Error('Invalid projection')
    if (args.zoom !== undefined && !(typeof args.zoom === 'number' && args.zoom > 0 && args.zoom <= 1000)) throw new Error('Invalid camera zoom')
    active.loadAnglePreset({ position: vector(args.position, active.camera.position.toArray() as ArrayVector3),
      target: vector(args.target, active.controls.target.toArray()), projection, zoom: args.zoom as number | undefined })
    active.render()
  }
  return { position: active.camera.position.toArray(), target: active.controls.target.toArray(),
    projection: active.isOrtho ? 'orthographic' : 'perspective', zoom: active.camOrtho.zoom }
}

/** Butter borrows the native main viewport. There is no second model or AI camera. */
export function mountMachine(root: HTMLElement) {
  if (!Project) throw new Error('Open a machine project first')
  const instance = Preview.all.find(item => item.id === 'main')
  if (!instance) throw new Error('Native main viewport is unavailable')
  const parent = instance.node.parentElement, next = instance.node.nextSibling
  preview = instance; root.append(instance.node)
  const resize = () => { if (instance.node.isConnected) { (instance as Preview & { resize(): void }).resize(); instance.render() } }
  const observer = new ResizeObserver(resize); observer.observe(root); resize()
  return () => {
    observer.disconnect()
    if (instance.node.parentElement === root && parent) {
      parent.insertBefore(instance.node, next?.parentNode === parent ? next : null)
      resize()
    }
    if (preview === instance) preview = undefined
  }
}
