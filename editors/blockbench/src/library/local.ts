import { filesystem, readLocal } from '../local-files.ts'
import { relativePath } from './checks.ts'
import { readPack } from './pack.ts'
import { importArchive } from './archive.ts'

export function loadPack(path:string) {
  const paths=requireNativeModule('path') as {resolve(path:string):string}
  const fs=filesystem(),absolute=paths.resolve(path).replaceAll('\\','/'),directory=fs.statSync(absolute).isDirectory()
  if(!directory && /\.zip$/i.test(absolute))return importArchive(readLocal(absolute,3*1024*1024))
  const root=directory?absolute:absolute.slice(0,absolute.lastIndexOf('/'))
  let total=0,count=0
  const read=(relative:string)=>{
    relativePath(relative)
    if(!/\.(json|png)$/i.test(relative))throw Error('Packs accept JSON and PNG only')
    let parent=root
    for(const part of relative.split('/')) {
      const entry=fs.readdirSync(parent,{withFileTypes:true}).find(e=>e.name===part)
      if(!entry)throw Error(`Missing package file: ${relative}`)
      if(entry.isSymbolicLink())throw Error('Package files cannot follow symbolic links or junctions')
      parent+=`/${part}`
    }
    const file=parent
    const size=fs.statSync(file).size;total+=size
    if(++count>160||total>4*1024*1024)throw Error('Folder package exceeds limits')
    return readLocal(file,2*1024*1024)
  }
  const manifest=directory?(fs.readdirSync(root,{withFileTypes:true}).some(e=>e.name==='pack.json')?'pack.json':'component.json'):absolute.slice(absolute.lastIndexOf('/')+1)
  return readPack(JSON.parse(new TextDecoder().decode(read(manifest))),read)
}
