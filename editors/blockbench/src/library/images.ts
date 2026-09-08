import type { ButterDocument } from '../document.ts'
import { refresh } from '../host.ts'

interface CachedImage { image:HTMLImageElement; ready:Promise<void>; loaded:boolean; error?:string }
const cache=new Map<string,CachedImage>()
function entry(data:string) {
  let item=cache.get(data)
  if(item){cache.delete(data);cache.set(data,item);return item}
  const image=new Image()
  item={image,ready:Promise.resolve(),loaded:false}
  const current=item
  current.ready=new Promise<void>((resolve,reject)=>{
    image.onload=()=>{current.loaded=true;resolve();refresh()}
    image.onerror=()=>{current.error='Cannot decode component PNG';reject(Error(current.error));refresh()}
  })
  void current.ready.catch(()=>{})
  cache.set(data,current);image.src=data
  while(cache.size>128)cache.delete(cache.keys().next().value!)
  return current
}
export function componentImage(data:string) { const value=entry(data);return value.loaded?value.image:undefined }
export async function prepareImages(doc:ButterDocument) {
  const used=new Set(Object.values(doc.component_refs??{}).map(ref=>ref.pack))
  await Promise.all([...used].flatMap(key=>Object.values(doc.library![key].assets)).map(data=>entry(data).ready))
}
export function disposeImages(){for(const value of cache.values()){value.image.onload=null;value.image.onerror=null}cache.clear()}
