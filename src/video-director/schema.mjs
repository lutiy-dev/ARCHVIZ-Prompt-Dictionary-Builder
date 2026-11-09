
export const STORAGE_KEY='archviz-video-director-v1';
export const SCHEMA_VERSION=1;
export const PROFILE_IDS=['generic','minimax_h3_fl2va','minimax_h3_ref2va','minimax_h3_hybrid','minimax_h3_video_ref_edit'];
export const PROFILE_LABELS={generic:'Generic Video',minimax_h3_fl2va:'MiniMax H3 · FL2VA',minimax_h3_ref2va:'MiniMax H3 · Ref2VA',minimax_h3_hybrid:'MiniMax H3 LongMedia · Hybrid',minimax_h3_video_ref_edit:'MiniMax H3 LongMedia · Video Ref Edit'};
export const REFERENCE_ROLES=['first_frame','last_frame','character_identity','motion_reference','camera_reference','architecture_reference','material_reference','lighting_reference','style_reference','audio_reference'];
export const MOVEMENTS=['static','dolly_in','dolly_out','truck_left','truck_right','pan','tilt','crane_up','crane_down','arc','aerial_push_in','aerial_pull_back','custom'];
export const LAYERS=['source','architecture','characters','blocking','camera','lighting','timing','audio','additional','qc'];
export const MAX_IMPORT_BYTES=2_000_000;
const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const only=(obj,keys)=>{if(Object.keys(obj).some(k=>!keys.includes(k)))fail('Unexpected field in project JSON')};
const txt=(x,max=4000)=>typeof x==='string'&&x.length<=max;
const identifier=x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(x);
const fail=msg=>{throw Error(msg)};
const unique=(values,label)=>{if(new Set(values).size!==values.length)fail('Duplicate '+label)};
const refRoleKind={first_frame:'image',last_frame:'image',character_identity:'image',motion_reference:'video',camera_reference:'video',architecture_reference:'image',material_reference:'image',lighting_reference:'image',style_reference:'image',audio_reference:'audio'};
export const blankLayer=(type,id)=>({id,type,enabled:true,scope:'shot',instruction:'',parameters:{},retention:[],priority:50,version:1});
export const shotTemplate=(id='shot_01',name='New shot',duration=5)=>({
 id,name,duration_seconds:duration,first_frame_ref:null,last_frame_ref:null,motion_ref:null,
 characters:[],camera:{movement:'static',lens_mm:null,speed:'slow',height_m:null,direction:'',easing:'',notes:''},
 actions:[],lighting:'',atmosphere:'',notes:'',layers:LAYERS.map((type,i)=>blankLayer(type,id+'_'+i)),profile:null
});
export const emptyProject=(id='video_project')=>({
 schema_version:1,project_type:'archviz_video_director',id,name:'Untitled Video',
 status:'LAB',target_profile:'generic',
 settings:{language:'en',default_fps:24,default_aspect_ratio:'16:9'},
 references:[],characters:[],camera_presets:[],global_layers:[],shots:[shotTemplate()],
 created_at:null,updated_at:null
});
const shotNames=[
 ['Aerial Establishing',8,'aerial_push_in'],['Approach to the Hotel',7,'dolly_in'],
 ['Yacht Bow View',7,'dolly_in'],['Yacht and Couple',7,'dolly_in'],
 ['Docking and Disembarkation',9,'truck_right'],['Waterfront Promenade',12,'dolly_in'],
 ['Garden',7,'truck_right'],['Dry Fountains',7,'arc'],
 ['Architectural Detail',6,'dolly_in'],['Facade Tracking',8,'truck_left'],
 ['Evening Lighting',5,'dolly_out'],['Final Sunset Hero',7,'aerial_pull_back']
];
export function demonstration(){
 const p=emptyProject('pr_naberejnaya_synthetic');p.name='PR NABEREJNAYA · Synthetic Demo';
 p.target_profile='minimax_h3_hybrid';p.settings.default_fps=24;
 p.references=[
  {id:'shot05_first',kind:'image',role:'first_frame',label:'Shot 05 first frame',description:'Placeholder only',asset:{display_name:'FIRST (unattached)',state:'DECLARED'}},
  {id:'shot05_last',kind:'image',role:'last_frame',label:'Shot 05 last frame',description:'Placeholder only',asset:{display_name:'LAST (unattached)',state:'DECLARED'}},
  {id:'male_ref',kind:'image',role:'character_identity',label:'Male actor identity',description:'Placeholder only',asset:{display_name:'Male actor (unattached)',state:'DECLARED'}},
  {id:'female_ref',kind:'image',role:'character_identity',label:'Female actor identity',description:'Placeholder only',asset:{display_name:'Female actor (unattached)',state:'DECLARED'}},
  {id:'shot05_animatic',kind:'video',role:'motion_reference',label:'Shot 05 animatic',description:'Placeholder only',asset:{display_name:'Animatic (unattached)',state:'DECLARED'}}
 ];
 p.characters=[
  {id:'actor_male',name:'Male actor',description:'Replacement identity',identity_ref:'male_ref',clothing:'',notes:''},
  {id:'actor_female',name:'Female actor',description:'Replacement identity',identity_ref:'female_ref',clothing:'',notes:''}
 ];
 p.shots=shotNames.map(([name,duration,movement],i)=>{
  const s=shotTemplate('shot_'+String(i+1).padStart(2,'0'),name,duration);s.camera.movement=movement;
  s.lighting='Warm Editorial / High-End Architectural Photography';
  s.layers.find(l=>l.type==='architecture').instruction='Preserve hotel architecture, facade layout, approved materials and waterfront geometry.';
  if(i===4){s.first_frame_ref='shot05_first';s.last_frame_ref='shot05_last';s.motion_ref='shot05_animatic';s.characters=['actor_male','actor_female'];s.actions=['The couple disembarks from the yacht onto the quay.'];}
  return s;
 });return p;
}
export function validateProject(p){
 if(!isObject(p)||p.schema_version!==1||p.project_type!=='archviz_video_director'||!identifier(p.id)||!txt(p.name,120)||!PROFILE_IDS.includes(p.target_profile)||!['LAB','BETA'].includes(p.status))fail('Invalid project envelope');
 only(p,['schema_version','project_type','id','name','status','target_profile','settings','references','characters','camera_presets','global_layers','shots','created_at','updated_at']);
 if(!isObject(p.settings)||!Number.isInteger(p.settings.default_fps)||p.settings.default_fps<1||p.settings.default_fps>120||!txt(p.settings.default_aspect_ratio,20)||p.settings.language!=='en')fail('Invalid settings');
 only(p.settings,['language','default_fps','default_aspect_ratio']);
 if(!Array.isArray(p.camera_presets)||p.camera_presets.length>40)fail('Invalid camera preset library');
 unique(p.camera_presets.map(c=>c.id),'camera preset ID');
 for(const cp of p.camera_presets){if(!isObject(cp)||!identifier(cp.id)||!txt(cp.name,120)||!isObject(cp.camera)||!MOVEMENTS.includes(cp.camera.movement))fail('Invalid camera preset');only(cp,['id','name','camera']);only(cp.camera,['movement','lens_mm','speed','height_m','direction','easing','notes']);}
 if(!Array.isArray(p.references)||p.references.length>100||!Array.isArray(p.characters)||p.characters.length>50||!Array.isArray(p.shots)||p.shots.length>100||!Array.isArray(p.global_layers)||p.global_layers.length>100)fail('Invalid collection size');
 for(const key of ['created_at','updated_at'])if(p[key]!==null&&(!txt(p[key],40)||!Number.isFinite(Date.parse(p[key]))))fail('Invalid timestamp');
 unique(p.references.map(r=>r.id),'reference ID');unique(p.characters.map(c=>c.id),'character ID');unique(p.shots.map(s=>s.id),'shot ID');
 const refs=new Map();
 for(const r of p.references){
  if(!isObject(r)||!identifier(r.id)||!['image','video','audio'].includes(r.kind)||!REFERENCE_ROLES.includes(r.role)||r.kind!==refRoleKind[r.role]||!txt(r.label,120)||!txt(r.description,2000)||!isObject(r.asset)||!txt(r.asset.display_name,150)||!['DECLARED','LOCALLY_ATTACHED','EXTERNALLY_CONNECTED_NOT_VERIFIED'].includes(r.asset.state))fail('Invalid reference '+String(r?.id));
  if(Object.keys(r.asset).some(key=>!['display_name','state'].includes(key)))fail('Unexpected asset field: media bytes, URLs and paths are not allowed');
  only(r,['id','kind','role','label','description','asset']);
  refs.set(r.id,r);
 }
 const charIds=new Set();
 for(const c of p.characters){if(!isObject(c)||!identifier(c.id)||!txt(c.name,120)||!txt(c.description,2000)||!txt(c.clothing,1000)||!txt(c.notes,2000)||!(c.identity_ref===null||identifier(c.identity_ref)))fail('Invalid character');if(c.identity_ref&&(!refs.has(c.identity_ref)||refs.get(c.identity_ref).role!=='character_identity'))fail('Invalid character identity reference');only(c,['id','name','description','identity_ref','clothing','notes']);charIds.add(c.id);}
 function layers(xs){unique(xs.map(l=>l.id),'layer ID');for(const l of xs){if(!isObject(l)||!identifier(l.id)||!LAYERS.includes(l.type)||typeof l.enabled!=='boolean'||!['shot','project'].includes(l.scope)||!txt(l.instruction,10000)||!isObject(l.parameters)||!Array.isArray(l.retention)||l.retention.length>30||!Number.isInteger(l.priority)||l.priority<0||l.priority>100||l.version!==1)fail('Invalid layer '+String(l?.id));only(l,['id','type','enabled','scope','instruction','parameters','retention','priority','version']);for(const v of Object.values(l.parameters))if(!txt(v,2000))fail('Invalid layer parameter');}}
 layers(p.global_layers);
 for(const s of p.shots){
  if(!isObject(s)||!identifier(s.id)||!txt(s.name,120)||!Number.isFinite(s.duration_seconds)||s.duration_seconds<=0||s.duration_seconds>150||!Array.isArray(s.characters)||!Array.isArray(s.actions)||s.actions.length>40||!Array.isArray(s.layers)||s.layers.length>100||!isObject(s.camera)||!MOVEMENTS.includes(s.camera.movement)||!txt(s.camera.speed,100)||!txt(s.camera.direction,500)||!txt(s.camera.easing,500)||!txt(s.camera.notes,2000)||!txt(s.lighting,4000)||!txt(s.atmosphere,4000)||!txt(s.notes,4000)||!(s.profile===null||PROFILE_IDS.includes(s.profile)))fail('Invalid shot '+String(s?.id));
  for(const key of ['lens_mm','height_m'])if(s.camera[key]!==null&&(!Number.isFinite(s.camera[key])||s.camera[key]<=0||s.camera[key]>10000))fail('Invalid camera '+key);
  only(s,['id','name','duration_seconds','first_frame_ref','last_frame_ref','motion_ref','characters','camera','actions','lighting','atmosphere','notes','layers','profile']);only(s.camera,['movement','lens_mm','speed','height_m','direction','easing','notes']);
  for(const a of s.actions)if(!txt(a,4000))fail('Invalid action');
  for(const key of ['first_frame_ref','last_frame_ref','motion_ref']){const id=s[key];if(id!==null&&(!identifier(id)||!refs.has(id)||refs.get(id).role!==(key==='motion_ref'?'motion_reference':key==='first_frame_ref'?'first_frame':'last_frame')))fail('Invalid '+key);}
  unique(s.characters,'shot character');for(const c of s.characters)if(!charIds.has(c))fail('Unknown character '+c);
  layers(s.layers);
 }
 return structuredClone(p);
}
