import type { CatalogCategory, ComponentEntry } from './component-catalog.ts'

export interface CatalogBranch {
  id:string;label:string;icon:string;version?:string;count:number
  entries:ComponentEntry[];children:CatalogBranch[]
}
export function catalogTree(categories:CatalogCategory[],entries:ComponentEntry[]):CatalogBranch[] {
  const branch=(category:CatalogCategory):CatalogBranch=>{
    const direct=entries.filter(e=>e.category===category.id)
    const children=categories.filter(c=>c.parent===category.id).map(branch).filter(c=>c.count)
    return {id:category.id,label:category.label,icon:category.icon??'folder',entries:direct,children,count:direct.length+children.reduce((n,c)=>n+c.count,0)}
  }
  return [...new Set(categories.map(c=>c.pack))].map(pack=>{
    const first=categories.find(c=>c.pack===pack)!,children=categories.filter(c=>c.pack===pack&&!c.parent).map(branch).filter(c=>c.count)
    return {id:pack,label:first.pack_title,icon:'inventory_2',version:first.version,entries:[],children,count:children.reduce((n,c)=>n+c.count,0)}
  }).filter(c=>c.count)
}
