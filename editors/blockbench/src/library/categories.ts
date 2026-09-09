import type { Category } from './types.ts'

export function categoryPath(categories:Category[],id:string):Category[] {
  const result:Category[]=[],seen=new Set<string>()
  let current:string|undefined=id
  while(current){
    if(seen.has(current))throw Error(`Category cycle: ${current}`)
    const category=categories.find(c=>c.id===current)
    if(!category)throw Error(`Missing category parent: ${current}`)
    seen.add(current);result.unshift(category);current=category.parent
    if(result.length>8)throw Error('Category hierarchy exceeds 8 levels')
  }
  return result
}
export function categoryTree(categories:Category[]):Category[] {
  categories.forEach(c=>categoryPath(categories,c.id))
  const children=(parent?:string):Category[]=>categories.filter(c=>c.parent===parent).flatMap(c=>[c,...children(c.id)])
  return children()
}
