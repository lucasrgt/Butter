import { element } from './dom.ts'
import { current } from './host.ts'
import { semanticTree } from './semantics-export.ts'

let dialog: Dialog | undefined
export function showSemanticTree() {
  const tree = semanticTree(current().snapshot()), root = element('div', 'butter-ui butter-semantic-tree')
  root.append(element('p', 'butter-asset-status', 'Declared semantics · Runtime values come from the Java backing.'))
  const table = element('table'), header = element('tr')
  for (const title of ['Role', 'Semantic ID', 'Label', 'Slot']) header.append(element('th', '', title))
  table.append(header)
  for (const node of tree.nodes) {
    const row = element('tr'); row.title = node.parent_id ? `Parent: ${node.parent_id}` : 'Screen root'
    for (const text of [node.role, node.id, node.attributes.label, node.index < 0 ? '—' : String(node.index)]) row.append(element('td', '', text))
    table.append(row)
  }
  root.append(table); dialog?.delete()
  dialog = new Dialog({ id: 'butter_semantic_tree', title: 'Butter — Semantic tree', width: 800, lines: [root], buttons: ['Close'] })
  dialog.show(); return tree
}
export function disposeSemanticTree() { dialog?.delete(); dialog = undefined }
