/** Stable content identity: JSON object key order does not constitute a new version. */
export function contentIdentity(value:unknown):string {
  return JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)
    ?Object.fromEntries(Object.keys(v).sort().map(key=>[key,v[key]])):v)
}
