import { element, iconButton } from './dom.ts'
import { PAGE_SIZE, type ComponentEntry } from './component-catalog.ts'
import type { CatalogBranch } from './catalog-tree.ts'

export interface CatalogExpansion {closed:Set<string>;pages:Map<string,number>}
export function renderCatalogTree(root:HTMLElement,branches:CatalogBranch[],state:CatalogExpansion,card:(entry:ComponentEntry)=>HTMLElement,changed=()=>{}) {
  const list=element('ul','butter-catalog-tree');list.setAttribute('aria-label','Component packs and categories')
  const render=(branch:CatalogBranch,depth:number)=>{
    const item=element('li'),details=element('details',`butter-catalog-branch${depth===0?' butter-catalog-pack':''}`)
    details.dataset.category=branch.id;details.open=!state.closed.has(branch.id)
    const summary=element('summary'),icon=element('i','material-icons',branch.icon),title=element('span','butter-catalog-label',branch.label)
    icon.setAttribute('aria-hidden','true');title.title=branch.label
    const count=element('span','butter-catalog-count',String(branch.count));count.setAttribute('aria-label',`${branch.count} components`)
    summary.append(icon,title)
    if(branch.version)summary.append(element('span','butter-catalog-version',branch.version))
    summary.append(count);details.append(summary)
    const body=element('div','butter-catalog-body')
    const fill=()=>{
      body.replaceChildren()
      if(branch.entries.length){
        const grid=element('div','butter-palette'),pages=Math.ceil(branch.entries.length/PAGE_SIZE)
        const page=Math.min(pages,state.pages.get(branch.id)??1)
        grid.setAttribute('role','group');grid.setAttribute('aria-label',branch.label)
        for(const entry of branch.entries.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE))grid.append(card(entry))
        body.append(grid)
        if(pages>1){
          const pager=element('div','butter-library-pages'),change=(value:number)=>{state.pages.set(branch.id,value);fill()}
          const previous=iconButton('chevron_left',`Previous components in ${branch.label}`,()=>change(page-1)),next=iconButton('chevron_right',`Next components in ${branch.label}`,()=>change(page+1))
          previous.disabled=page===1;next.disabled=page===pages
          pager.append(previous,element('span','butter-library-count',`${page} / ${pages}`),next);body.append(pager)
        }
      }
      if(branch.children.length){const children=element('ul');children.append(...branch.children.map(child=>render(child,depth+1)));body.append(children)}
    }
    if(details.open)fill()
    details.ontoggle=()=>{
      if(!details.isConnected)return
      if(details.open){state.closed.delete(branch.id);if(!body.childElementCount)fill()}
      else state.closed.add(branch.id)
      changed()
    }
    details.append(body);item.append(details);return item
  }
  list.append(...branches.map(branch=>render(branch,0)));root.replaceChildren(list)
}
