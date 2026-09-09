import { attempt } from '../dom.ts'
import { library } from './registry.ts'
import { libraryCall } from './api.ts'
import { nextVersion } from './versions.ts'

export function editPack(key:string,done:()=>void) {
  const pack=library().get(key).pack,revision=library().revision
  const form=new Dialog({id:'butter_pack_revise',title:`Add / update components — ${pack.title}`,width:760,form:{
    version:{label:'New version',type:'text',value:nextVersion(pack.version)},
    mod_id:{label:'Mod ID (optional for shared packs)',type:'text',value:pack.mod?.id??''},
    role:{label:'Pack role',type:'select',options:{primary:'Primary',addon:'Addon'},value:pack.mod?.role??'primary'},
    reason:{label:'Reason for a separate addon',type:'text',value:pack.mod?.reason??''},
    categories:{label:'Categories JSON (parent ID creates a subcategory)',type:'textarea',value:JSON.stringify(pack.categories,null,2)},
    components:{label:'Component definitions JSON (add or replace by ID)',type:'textarea',value:'[]'},
    note:{type:'info',text:'Untouched components, assets and machine types are preserved. Projects keep their pinned versions. Export the pack or use the schema command for component fields.'},
  },onConfirm(result){attempt(()=>{
    libraryCall({action:'revise',pack:key,version:result.version,expected_library_revision:revision,
      categories:JSON.parse(String(result.categories)),components:JSON.parse(String(result.components)),
      ...(result.mod_id?{mod:{id:result.mod_id,role:result.role,...(result.reason?{reason:result.reason}:{})}}:{}),
    });form.hide();done()
  })}})
  form.show()
}
