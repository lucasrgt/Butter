/** Keep native sidebar resizing on the panel whose divider was grabbed.
 * Blockbench otherwise delegates growable panels to the last non-growable
 * panel, even when that other plugin's panel is hidden by CSS.
 */
export function bindPanelResize(panel:Panel) {
  const handle=panel.sidebar_resize_handle
  if(!handle)return ()=>{}
  const start=(event:MouseEvent|TouchEvent)=>{
    if(event instanceof MouseEvent&&event.button!==0)return
    event.stopImmediatePropagation()
    panel.resize(event)
  }
  handle.addEventListener('mousedown',start,true)
  handle.addEventListener('touchstart',start,{capture:true,passive:false})
  return ()=>{
    handle.removeEventListener('mousedown',start,true)
    handle.removeEventListener('touchstart',start,true)
  }
}
