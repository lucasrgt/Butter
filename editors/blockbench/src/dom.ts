export function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = '') {
  const node = document.createElement(tag)
  node.className = className
  node.textContent = text
  return node
}

export function button(label: string, action: () => void, title = label) {
  const node = element('button', 'butter-button', label)
  node.type = 'button'
  node.title = title
  node.setAttribute('aria-label', title)
  node.onclick = () => attempt(action)
  return node
}

export function iconButton(icon: string, title: string, action: () => void, text = '') {
  const node = button('', action, title)
  node.classList.add(text ? 'butter-text-button' : 'butter-icon-button')
  const glyph = element('i', 'material-icons', icon)
  glyph.setAttribute('aria-hidden', 'true')
  node.append(glyph)
  if (text) node.append(element('span', '', text))
  return node
}

export function group(title: string, ...children: HTMLElement[]) {
  const node = element('div', 'butter-tool-group')
  node.setAttribute('role', 'group'); node.setAttribute('aria-label', title)
  node.append(...children)
  return node
}

export function attempt(action: () => unknown) {
  const report=(error:unknown)=>Blockbench.showQuickMessage(error instanceof Error ? error.message : String(error),4000)
  try { const result=action();if(result instanceof Promise)void result.catch(report) } catch (error) { report(error) }
}

export function label(text: string, input: HTMLElement) {
  const node = element('label', 'butter-field')
  node.append(element('span', '', text), input)
  return node
}

export function modalOpen() {
  return Array.from(document.querySelectorAll<HTMLElement>('.dialog, .contextMenu')).some(node => node.offsetParent !== null)
}
