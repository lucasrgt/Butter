import { current } from './host.ts'
export function requestedIds(args: Record<string, unknown>) {
  if (args.id !== undefined && args.ids !== undefined) throw new Error('Use id or ids, not both')
  const value = args.ids ?? (args.id === undefined ? current().selection : [args.id])
  if (!Array.isArray(value) || value.length > 512 || !value.every(id => typeof id === 'string')) throw new Error('Expected up to 512 component ids')
  return [...value] as string[]
}
export function expectedRevision(args: Record<string, unknown>) {
  const value = args.expected_revision
  if (value !== undefined && !(typeof value === 'number' && Number.isInteger(value) && value >= 0)) throw new Error('Invalid revision')
  return value as number | undefined
}
