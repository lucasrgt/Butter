import { current } from './host.ts'
import { machineDescription } from './machine-description.ts'

export interface MachineProvider { version:number;call(command:string,args:Record<string,unknown>):unknown }
export function machineProvider():MachineProvider|undefined {
  const provider=(globalThis as typeof globalThis&{BlockbenchMachine?:MachineProvider}).BlockbenchMachine
  return provider?.version===1&&typeof provider.call==='function'?provider:undefined
}
export function machineCall(args:Record<string,unknown>) {
  if(args.action==='describe')return machineDescription(current().snapshot())
  const provider=machineProvider()
  if(!provider)throw Error('Machine Creator integration is unavailable. Butter remains usable independently.')
  if(typeof args.action!=='string')throw Error('Machine action is required')
  const {action,...rest}=args
  return provider.call(action,{...rest,expected_project_id:Project?.uuid})
}
