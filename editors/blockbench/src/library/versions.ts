import type { InstalledPack } from './types.ts'

export function compareVersions(a:string,b:string) {
  const left=a.split('.').map(BigInt),right=b.split('.').map(BigInt)
  for(let i=0;i<3;i++)if(left[i]!==right[i])return left[i]!>right[i]!?1:-1
  return 0
}
export function nextVersion(version:string) {
  const parts=version.split('.');parts[2]=String(BigInt(parts[2]!)+1n);return parts.join('.')
}
export function groupVersions(entries:InstalledPack[]) {
  const groups=new Map<string,InstalledPack[]>()
  for(const entry of entries)groups.set(entry.pack.id,[...groups.get(entry.pack.id)??[],entry])
  return [...groups].map(([id,versions])=>({id,versions:versions.sort((a,b)=>compareVersions(b.pack.version,a.pack.version))}))
}
