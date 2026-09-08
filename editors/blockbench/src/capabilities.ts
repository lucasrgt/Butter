import { element } from './dom.ts'

export type Capability = { category: string; feature: string; control: string; api: string }
const row = (category: string, feature: string, control: string, api: string): Capability => ({ category, feature, control, api })
export const CAPABILITIES: Capability[] = [
  row('Components', 'Choose size and shape variants per instance', 'Properties > Component > Variant', 'properties section components'),
  row('Components', 'Set capacity, labels and placeholders', 'Properties > Component', 'properties section components patch props'),
  row('Visual test', 'Select fluid or gas and custom color per instance', 'Properties > Visual test', 'properties section preview'),
  row('Visual test', 'Adjust fill, progress and slider positions', 'Percentage slider; 0 / 25 / 50 / 75 / 100 presets', 'properties section preview patch level'),
  row('Visual test', 'Test checked, focused, hovered, disabled and sample item states', 'Properties > Visual test', 'properties section preview'),
  row('Visual test', 'Reset simulation; undo a whole slider gesture', 'Reset visual test; Ctrl+Z; Escape during slider adjustment', 'properties action reset; history'),
  row('Selection', 'Select components or whole groups', 'Canvas click; Groups / Components selector', 'select, view.selection_mode'),
  row('Selection', 'Add or remove selection', 'Shift + click; Shift + marquee', 'select mode add / toggle / remove'),
  row('Selection', 'Rectangle selection', 'Drag empty canvas space', 'select ids'),
  row('Selection', 'Select a child directly', 'Ctrl + click or double click', 'select id'),
  row('Selection', 'Select all / none / invert', 'Ctrl+A / Esc or Ctrl+Shift+A / Ctrl+I', 'select mode all / none / invert'),
  row('Selection', 'Select parent / cycle components', 'Enter / Tab or Shift+Tab on canvas', 'select mode parent / id'),
  row('Movement', 'Move components, groups or multiple selections', 'Drag canvas; X / Y fields', 'position, nudge'),
  row('Movement', 'Move in integer pixel steps', 'Arrows: 1 px; Shift+arrows: 10 px; hold to repeat', 'nudge'),
  row('Movement', 'Constrain drag to one axis', 'Shift + drag', 'position, nudge'),
  row('Movement', 'Duplicate while dragging', 'Alt + drag', 'duplicate, position'),
  row('Movement', 'Snap to grid', 'Snap button and grid size', 'view.snap, view.grid_size'),
  row('Movement', 'Align to nearby edges and centers while dragging', 'Smart guides toggle', 'view.smart_guides'),
  row('History', 'Undo / redo document edits and restore selection', 'Ctrl+Z / Ctrl+Y or Ctrl+Shift+Z', 'history'),
  row('History', 'One undo for each drag or held-arrow movement', 'Release pointer / arrow to commit', 'inspect.gesture, history'),
  row('History', 'Cancel an active movement', 'Esc or Ctrl+Z during pointer drag; Esc during arrow move', 'inspect.gesture'),
  row('Clipboard', 'Copy / cut / paste components and groups', 'Ctrl+C / Ctrl+X / Ctrl+V; internal Butter clipboard', 'clipboard'),
  row('Clipboard', 'Paste at original coordinates', 'Ctrl+Shift+V', 'clipboard paste_in_place'),
  row('Clipboard', 'Duplicate / delete selection', 'Ctrl+D / Delete or Backspace', 'duplicate, remove, edit'),
  row('Layers', 'Create row or column groups; ungroup', 'Ctrl+G / Ctrl+Shift+G; palette and Edit menu', 'edit group / ungroup'),
  row('Layers', 'Expand / collapse groups individually or all at once', 'Folder chevrons; layer toolbar', 'tree'),
  row('Layers', 'Search hierarchy', 'Find layers; Ctrl+Shift+F', 'view.layer_search'),
  row('Layers', 'Reparent and reorder without changing coordinates', 'Drag layers before, after or inside a group; Parent field', 'move'),
  row('Layers', 'Change stacking order', 'Ctrl+[ / Ctrl+]; Shift sends to back / front', 'edit send_backward / bring_forward / send_back / bring_front'),
  row('Layers', 'Rename selected layer', 'Name field; F2', 'update name'),
  row('Layers', 'Hide / show layers', 'Eye buttons; Ctrl+H hides; Ctrl+Shift+H shows all', 'update hidden, edit hide / show / show_all'),
  row('Layers', 'Lock / unlock layers and groups', 'Lock buttons; Ctrl+L toggles; Ctrl+Shift+L unlocks all', 'update locked, edit lock / unlock / unlock_all'),
  row('Layers', 'Reset selected positions to automatic layout', 'Edit menu', 'edit reset_layout'),
  row('Alignment', 'Align left / center / right / top / middle / bottom', 'Properties alignment buttons; Alt+H / Alt+V center', 'align'),
  row('Alignment', 'Choose alignment reference', 'Auto / Selection / Canvas / Parent', 'view.align_target, align.relative_to'),
  row('Alignment', 'Distribute horizontal or vertical gaps', 'Properties buttons; requires three selections', 'distribute'),
  row('Library', 'Add components by click or drag onto canvas', 'Components palette', 'add with optional x / y'),
  row('Library', 'Search and filter component categories', 'Search; category selector; Ctrl+F', 'components, view.component_search / component_category'),
  row('Library', 'Browse grouped results, at most ten per page', 'Page buttons when results exceed ten', 'view.component_page'),
  row('Navigation', 'Zoom around cursor without zooming the app', 'Ctrl + mouse wheel; 1x through 8x', 'view.zoom / pan_x / pan_y'),
  row('Navigation', 'Pan canvas', 'Space + drag; Center button', 'view.pan_x / pan_y'),
  row('Navigation', 'Frame selection / fit canvas / actual pixels', 'F / Shift+F or Ctrl+0 / Ctrl+1', 'frame, view.zoom'),
  row('Navigation', 'Show pixel grid and adjust spacing / opacity', 'Canvas toolbar', 'view.grid / grid_size / grid_opacity'),
  row('Workspace', 'Edit GUI beside current machine', 'GUI / Split; draggable separator; double click to center', 'view.layout / split_ratio, attach'),
  row('Workspace', 'Navigate native 3D preview', 'Orbit, pan and zoom in machine pane', 'camera'),
  row('Workspace', 'Arrange native editor panels', 'Blockbench panel controls', 'panels'),
  row('Files', 'Start a preset in current machine or a new project', 'New GUI; current project by default', 'begin, begin.new_project'),
  row('Files', 'Save GUI with machine in a Blockbench project', 'Native .bbmodel save / open', 'export format document, import'),
  row('Files', 'Import authoring JSON; export JSON / spec / Butter source / PNG', 'Document toolbar; Source toggle', 'import, export, preview'),
  row('Minecraft', 'Select compilation / preview version outside source', 'Version selector: Beta 1.7.3 available; others planned', 'versions target'),
  row('Minecraft', 'Load original local Beta font and GUI textures', 'JAR folder button; clear button', 'assets'),
  row('Validation', 'Inspect document, geometry, selection and history', 'Properties and status strip', 'inspect, tree'),
  row('Validation', 'Validate structure and detect canvas overflow', 'Status warning count; MCP validation', 'validate'),
  row('Semantics', 'Configure stable IDs, compatible roles, labels and descriptions', 'Properties / Semantics', 'semantics update'),
  row('Semantics', 'Expose groups and inventory regions; inspect the semantic tree', 'Semantics / Tree; Expose region', 'semantics tree / show_tree'),
  row('Semantics', 'Bind persistent container indices and search tab order', 'Semantics / Container slot / Tab order', 'semantics slot / tab_index'),
  row('Semantics', 'Declare typed backing state and click handlers', 'Semantics / Bindings and actions', 'semantics bindings / action'),
  row('Semantics', 'Export semantic declarations and validate structural contracts', 'Export / Semantic tree JSON', 'semantics validate, export semantics'),
  row('Help', 'Open complete command reference', '? key or toolbar help button; Edit / context menus', 'capabilities show_help'),
]
let dialog: Dialog | undefined
export function showHelp() {
  const content = element('div', 'butter-ui butter-help')
  let category = ''
  for (const entry of CAPABILITIES) {
    if (entry.category !== category) { category = entry.category; content.append(element('h3', '', category)) }
    const item = element('div', 'butter-help-row')
    item.append(element('span', '', entry.feature), element('span', 'butter-help-control', entry.control)); content.append(item)
  }
  dialog?.delete()
  dialog = new Dialog({ id: 'butter_help', title: 'Butter — Commands and shortcuts', width: 760, lines: [content], buttons: ['Close'] })
  dialog.show()
  return capabilities()
}
export function capabilities() { return { version: '0.6.0', capabilities: CAPABILITIES, clipboard: 'Internal Butter clipboard shared across project tabs',
  limits: ['Fixed 176 × 166 canvas and intrinsic Beta component dimensions', 'Only Beta 1.7.3 is implemented', 'Preview and Java runtime parity are not complete; see component audit'] } }
export function disposeHelp() { dialog?.delete(); dialog = undefined }
