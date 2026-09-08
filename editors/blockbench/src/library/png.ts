import { unzlibSync } from 'fflate'

const table=Uint32Array.from({length:256},(_,index)=>{
  let c=index;for(let bit=0;bit<8;bit++)c=(c>>>1)^((c&1)?0xedb88320:0);return c>>>0
})
function crc(bytes:Uint8Array) {
  let value=0xffffffff;for(const byte of bytes)value=table[(value^byte)&255]^(value>>>8);return (value^0xffffffff)>>>0
}
interface PngInfo {w:number;h:number;bytes:Uint8Array}
const cache=new Map<string,PngInfo>()
let cachedBytes=0
export function readPng(data:unknown):PngInfo {
  if(typeof data!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(data)||data.length>700000)throw Error('Assets must be embedded PNGs under 512 KB')
  const known=cache.get(data);if(known)return known
  const bytes=Uint8Array.from(atob(data.slice(22)),c=>c.charCodeAt(0)),view=new DataView(bytes.buffer)
  if(bytes.length<45||bytes.length>512*1024||[137,80,78,71,13,10,26,10].some((b,i)=>bytes[i]!==b))throw Error('Invalid PNG signature or size')
  const w=view.getUint32(16),h=view.getUint32(20),depth=bytes[24],color=bytes[25],interlace=bytes[28]
  if(!w||!h||w>1024||h>1024||w*h>262144)throw Error('PNG exceeds 1024px or 262144 pixels')
  const channels:Record<number,number>={0:1,2:3,3:1,4:2,6:4}
  if(!channels[color]||![1,2,4,8,16].includes(depth)||(color!==0&&color!==3&&depth<8)||(color===3&&depth===16)||bytes[26]||bytes[27]||interlace>1)throw Error('Unsupported PNG header')
  let offset=8,ended=false,palette=false;const chunks:Uint8Array[]=[]
  while(offset<bytes.length) {
    if(offset+12>bytes.length)throw Error('Truncated PNG chunk')
    const length=view.getUint32(offset),end=offset+12+length
    if(end>bytes.length)throw Error('PNG chunk exceeds file')
    const type=String.fromCharCode(...bytes.subarray(offset+4,offset+8))
    if(crc(bytes.subarray(offset+4,end-4))!==view.getUint32(end-4))throw Error('PNG checksum mismatch')
    if(offset===8?(type!=='IHDR'||length!==13):type==='IHDR')throw Error('Invalid PNG header order')
    if(['acTL','fcTL','fdAT'].includes(type))throw Error('Use a vertical sprite sheet instead of APNG animation')
    if(type==='PLTE'){if(!length||length%3||length>768)throw Error('Invalid PNG palette');palette=true}
    if(type==='IDAT')chunks.push(bytes.subarray(offset+8,end-4))
    if(type==='IEND'){if(length||end!==bytes.length)throw Error('Invalid PNG end');ended=true}
    offset=end
  }
  if(!ended||!chunks.length||(color===3&&!palette))throw Error('Incomplete PNG image')
  const passes=interlace?[[0,0,8,8],[4,0,8,8],[0,4,4,8],[2,0,4,4],[0,2,2,4],[1,0,2,2],[0,1,1,2]]:[[0,0,1,1]]
  const rows=passes.flatMap(([x,y,dx,dy])=>{
    const width=Math.ceil((w-x)/dx),height=Math.ceil((h-y)/dy)
    return width>0&&height>0?Array(height).fill(Math.ceil(width*channels[color]*depth/8)+1):[]
  })
  const expected=rows.reduce((sum,n)=>sum+n,0),compressed=new Uint8Array(chunks.reduce((sum,c)=>sum+c.length,0))
  offset=0;for(const chunk of chunks){compressed.set(chunk,offset);offset+=chunk.length}
  const raw=unzlibSync(compressed,{out:new Uint8Array(expected+1)})
  if(raw.length!==expected)throw Error('PNG decoded size mismatch')
  offset=0;for(const row of rows){if(raw[offset]>4)throw Error('Invalid PNG row filter');offset+=row}
  let a=1,b=0;for(const value of raw){a=(a+value)%65521;b=(b+a)%65521}
  if(compressed.length<6||new DataView(compressed.buffer).getUint32(compressed.length-4)!==((b<<16|a)>>>0))throw Error('PNG stream checksum mismatch')
  const result={w,h,bytes};cache.set(data,result);cachedBytes+=bytes.length
  while(cache.size>128||cachedBytes>4*1024*1024){const key=cache.keys().next().value!;cachedBytes-=cache.get(key)!.bytes.length;cache.delete(key)}
  return result
}
