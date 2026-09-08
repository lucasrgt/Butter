interface LocalFS {
  statSync(path: string): { size: number; isDirectory(): boolean }
  readdirSync(path:string,options:{withFileTypes:true}):Array<{name:string;isSymbolicLink():boolean}>
  readFileSync(path: string): Uint8Array
  writeFileSync(path: string, content: string | Uint8Array): void
}
let granted: LocalFS | undefined

export function filesystem(): LocalFS {
  if (granted) return granted
  const fs = requireNativeModule('fs', { message: 'Read your local Minecraft assets or save a Butter document.', optional: false })
  if (!fs) throw new Error('Local file access was not granted')
  granted = fs as unknown as LocalFS
  return granted
}

export function readLocal(path: string, maximum: number): Uint8Array {
  const fs = filesystem()
  if (fs.statSync(path).size > maximum) throw new Error('File exceeds the supported size')
  return new Uint8Array(fs.readFileSync(path))
}

export function writeLocal(path: string, content: string | Uint8Array) {
  filesystem().writeFileSync(path, content)
}
