import { expect, test } from 'bun:test'
import { catalogTree } from './catalog-tree.ts'
import { componentPage, matchingComponents, type CatalogCategory, type ComponentEntry } from './component-catalog.ts'

const categories:CatalogCategory[]=[
  {id:'pack/root',title:'Pack · Root',label:'Root',pack:'pack',pack_title:'Pack',version:'1.0.0'},
  {id:'pack/child',title:'Pack · Root / Child',label:'Child',parent:'pack/root',pack:'pack',pack_title:'Pack'},
  {id:'pack/empty',title:'Pack · Empty',label:'Empty',pack:'pack',pack_title:'Pack'},
  {id:'other/root',title:'Other · Root',label:'Root',pack:'other',pack_title:'Other'},
]
const entry=(id:string,category='pack/child'):ComponentEntry=>({kind:'slot',title:id,icon:'crop_square',category,keywords:'slot',category_ancestors:category==='pack/child'?['pack/root','pack/child']:[category]})

test('catalog retains enclosing pack and category nodes, local names and descendant counts',()=>{
  const branches=catalogTree(categories,[entry('A'),entry('B','pack/root'),entry('C','other/root')])
  expect(branches.map(b=>[b.label,b.count])).toEqual([['Pack',2],['Other',1]])
  const parent=branches[0]!.children[0]!
  expect(parent.label).toBe('Root');expect(parent.count).toBe(2)
  expect(parent.entries.map(e=>e.title)).toEqual(['B'])
  expect(parent.children.map(c=>[c.label,c.count])).toEqual([['Child',1]])
  expect(parent.children[0]!.entries[0]!.title).toBe('A')
  expect(branches[0]!.children).toHaveLength(1)
})

test('search prunes unmatched siblings while retaining the full ancestor chain',()=>{
  const entries=[entry('Fluid port'),entry('Energy port','other/root')]
  const branches=catalogTree(categories,matchingComponents('fluid','all',entries))
  expect(branches).toHaveLength(1)
  expect(branches[0]!.children[0]!.children[0]!.entries.map(e=>e.title)).toEqual(['Fluid port'])
  expect(catalogTree(categories,matchingComponents('absent','all',entries))).toEqual([])
  expect(matchingComponents('','pack/root',entries)).toHaveLength(1)
})

test('UI grouping has every category entry, independent of the paginated API result',()=>{
  const entries=Array.from({length:15},(_,i)=>entry(`Slot ${i}`))
  const all=matchingComponents('','all',entries),tree=catalogTree(categories,all)
  expect(tree[0]!.count).toBe(15)
  expect(tree[0]!.children[0]!.children[0]!.entries).toHaveLength(15)
  expect(componentPage('','all',1,entries).items).toHaveLength(10)
  expect(componentPage('','all',2,entries).items).toHaveLength(5)
})
