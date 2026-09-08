export function object(value: unknown, label: string): Record<string, any> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`)
  return value as Record<string, any>
}
export function keys(value: object, allowed: string[], label: string) {
  for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new Error(`Unknown ${label} field: ${key}`)
}
export function string(value: unknown, label: string, max = 200): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\x00-\x1f\x7f]/.test(value)) throw new Error(`Invalid ${label}`)
  return value
}
export function id(value: unknown, label = 'identifier'): string {
  const result = string(value, label, 80)
  if (!/^[a-z][a-z0-9_.-]*$/.test(result) || ['__proto__', 'constructor', 'prototype'].includes(result)) throw new Error(`Invalid ${label}: ${result}`)
  return result
}
export function version(value: unknown): string {
  const result = string(value, 'version', 40)
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(result)) throw new Error('Version must be major.minor.patch')
  return result
}
export function integer(value: unknown, label: string, min: number, max: number): number {
  if (!Number.isInteger(value) || Number(value) < min || Number(value) > max) throw new Error(`${label} must be an integer from ${min} to ${max}`)
  return Number(value)
}
export function array(value: unknown, label: string, max = 64): any[] {
  if (!Array.isArray(value) || value.length > max) throw new Error(`Invalid ${label} array (maximum ${max})`)
  return value
}
export function relativePath(value: unknown): string {
  const path = string(value, 'relative package path', 200)
  if (!/^[a-zA-Z0-9_./ -]+$/.test(path) || path.startsWith('/') || path.split('/').some(p => !p || p === '.' || p === '..')) throw new Error(`Unsafe package path: ${path}`)
  return path
}
export { readPng as pngInfo } from './png.ts'
