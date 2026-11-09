
import {validateProject,PROFILE_LABELS} from './schema.mjs';
export const profileCaps={
 generic:{name:'Generic Video',mode:'generic',first:true,last:true,ref:true,motion:true,verified:false},
 minimax_h3_fl2va:{name:'MiniMax H3 FL2VA',mode:'fl2va',first:true,last:true,ref:false,motion:false,verified:true},
 minimax_h3_ref2va:{name:'MiniMax H3 Ref2VA',mode:'ref2va',first:false,last:false,ref:true,motion:true,verified:true},
 minimax_h3_hybrid:{name:'LongMedia Hybrid',mode:'hybrid',first:true,last:true,ref:true,motion:true,verified:true},
 minimax_h3_video_ref_edit:{name:'LongMedia Video Ref Edit',mode:'video_ref_edit',first:false,last:false,ref:true,motion:true,verified:true}
};
const diagnostic=(code,severity,shot_id,field,message,action)=>({code,severity,shot_id,field,message,action});
export function compileShot(input,shotId){
 const project=validateProject(input),shot=project.shots.find(s=>s.id===shotId);if(!shot)throw Error('Unknown shot');
 const profile=shot.profile||project.target_profile,caps=profileCaps[profile], refs=new Map(project.references.map(r=>[r.id,r])),charMap=new Map(project.characters.map(c=>[c.id,c])),issues=[];
 const push=(code,severity,field,message,action)=>issues.push(diagnostic(code,severity,shot.id,field,message,action));
 const ids=[];
 const register=id=>{if(id&&!ids.includes(id))ids.push(id)};
 register(shot.first_frame_ref);register(shot.last_frame_ref);register(shot.motion_ref);
 for(const c of shot.characters){const ch=charMap.get(c);if(ch?.identity_ref)register(ch.identity_ref);else push('MISSING_ACTOR_IDENTITY','ERROR','characters',c+' has no identity reference','Assign an identity reference');}
 const extra=shot.layers.concat(project.global_layers).filter(l=>l.enabled);
 for(const l of extra){for(const a of l.retention||[])if(a?.ref_id)register(a.ref_id);}
 const active=ids.map(id=>refs.get(id)).filter(Boolean);
 const retentionRules=extra.flatMap(l=>l.retention.map(rule=>({...rule,source_layer:l.id,scope:l.scope})));
 const first=!!shot.first_frame_ref,last=!!shot.last_frame_ref,motion=!!shot.motion_ref,people=shot.characters.length>0;
 if((first||last)&&!caps.first)push('MODE_ENDPOINT_UNSUPPORTED','ERROR','target_profile','Selected mode does not accept FIRST/LAST anchors','Select FL2VA or Hybrid');
 if(people&&!caps.ref)push('MODE_ACTOR_REF_UNSUPPORTED','ERROR','target_profile','Actor identity references are not supported as native REF in this mode','Use Hybrid or prepare actor-replaced endpoints');
 if(motion&&!caps.motion)push('MODE_MOTION_REF_UNSUPPORTED','ERROR','target_profile','Motion reference is not supported in this mode','Use Hybrid, Ref2VA or Video Ref Edit');
 if(profile==='minimax_h3_fl2va'&&active.some(r=>r.id!==shot.first_frame_ref&&r.id!==shot.last_frame_ref))push('FL2VA_ADDITIONAL_REF','ERROR','target_profile','FL2VA cannot bind additional reference assets','Use Hybrid or remove additional reference rules');
 if(profile==='minimax_h3_fl2va'&&(people||motion))push('FL2VA_EXTRA_REF','ERROR','target_profile','FL2VA cannot accept extra native references','Prepare endpoints or switch to Hybrid');
 if(profile==='minimax_h3_video_ref_edit'&&!motion)push('EDIT_SOURCE_REQUIRED','ERROR','motion_ref','Video Reference Edit requires a source animatic/video','Assign motion reference');
 if(profile==='minimax_h3_fl2va'&&!first)push('FIRST_REQUIRED','ERROR','first_frame_ref','FL2VA requires first-frame anchor','Assign FIRST');
 if(profile==='minimax_h3_hybrid'&&(!first&&!last||!active.some(r=>r.id!==shot.first_frame_ref&&r.id!==shot.last_frame_ref)))push('HYBRID_CONDITION_MISSING','ERROR','target_profile','Hybrid needs an endpoint and an additional reference','Add FIRST/LAST and a reference');
 if(!caps.verified)push('GENERIC_NOT_RUNTIME_VERIFIED','INFO','target_profile','Generic format is not an API compatibility guarantee','Connect media manually');
 if(first&&people)push('ENDPOINT_IDENTITY_CONFLICT','WARNING','characters','Endpoints may contain original actors whose identity differs from replacement references','Prefer prepared endpoints for accurate FIRST/LAST');
 if(shot.camera.movement!=='static'&&(!first||!last))push('UNSEEN_GEOMETRY','WARNING','camera','Camera movement may reveal unsupported geometry','Verify against the original 3D scene');
 if(shot.camera.lens_mm===null)push('LENS_UNSPECIFIED','INFO','camera.lens_mm','Focal length is not specified','Set it if known');
 if(active.some(r=>r.asset.state==='DECLARED'))push('MEDIA_NOT_ATTACHED','WARNING','references','Reference names are declarations, not verified physical connections','Attach inputs in the generation workflow');
 const instructions=extra.filter(l=>l.instruction.trim()).sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id));
 const arch=instructions.filter(l=>l.type==='architecture'),cam=instructions.filter(l=>l.type==='camera');
 const allInstructionText=instructions.map(l=>l.instruction).join('\n');
 if(shot.camera.movement!=='static'&&/\b(static camera|locked camera|no camera movement)\b/i.test(allInstructionText))push('STATIC_CAMERA_CONFLICT','ERROR','camera','Camera instruction conflicts with selected movement','Remove locked-camera rule or set static movement');
 if(arch.length>0&&/\b(redesign|change facade|move windows|remove windows)\b/i.test(allInstructionText))push('ARCHITECTURE_LOCK_CONFLICT','ERROR','architecture','Architecture lock contradicts a destructive architecture instruction','Review the explicit architecture rule');
 for(let i=0;i<retentionRules.length;i++)for(let j=i+1;j<retentionRules.length;j++){
  const a=retentionRules[i],b=retentionRules[j];
  if(a.ref_id!==b.ref_id||a.mode===b.mode)continue;
  const overlap=!a.attributes.length||!b.attributes.length||a.attributes.some(x=>b.attributes.includes(x));
  if(overlap)push('RETENTION_CONFLICT','ERROR','retention',a.ref_id+' has incompatible retention modes ('+a.mode+' vs '+b.mode+')','Align rules or separate their attribute scopes');
 }
 const endpoints=active.filter(r=>r.id===shot.first_frame_ref||r.id===shot.last_frame_ref);
 const additional=active.filter(r=>!endpoints.includes(r));
 const manifest=[],numbers={image:0,video:0,audio:0};
 // In Hybrid, FIRST/LAST have dedicated semantic roles and are not consumed as ordinary Picture REF slots.
 for(const r of active){
  let slot;
  if((profile==='minimax_h3_hybrid'||profile==='minimax_h3_fl2va')&&r.id===shot.first_frame_ref)slot='FIRST';
  else if((profile==='minimax_h3_hybrid'||profile==='minimax_h3_fl2va')&&r.id===shot.last_frame_ref)slot='LAST';
  else {numbers[r.kind]++;slot='<'+({image:'Picture',video:'Video',audio:'Audio'}[r.kind])+' '+numbers[r.kind]+'>';}
  manifest.push({id:r.id,kind:r.kind,role:r.role,slot,state:r.asset.state,label:r.label});
 }
 const label=id=>manifest.find(r=>r.id===id)?.slot||'[missing reference]';
 const subject=manifest.map(r=>r.slot+' = '+r.label+' ('+r.role+', '+r.id+')').join('\n');
 const characterLines=shot.characters.map(cid=>{const c=charMap.get(cid);return c.name+': '+label(c.identity_ref)+' controls identity only; blocking and wardrobe are separately specified.'});
 const retention=manifest.map(m=>{
  const rules=retentionRules.filter(r=>r.ref_id===m.id);
  if(rules.length)return m.slot+': '+rules.map(r=>r.mode+' ('+(r.attributes.length?'attributes: '+r.attributes.join(', '):'all specified properties')+')').join('; ');
  return m.slot+': '+(m.role==='character_identity'?'attribute_transfer (actor identity only)':m.role==='motion_reference'?'weak_reference (camera and action timing)':m.role==='first_frame'||m.role==='last_frame'?'partially_preserved (architecture and framing, possible actor replacement)':'fully_preserved (specified properties only)');
 });
 const body=[
  'Shot: '+shot.name+'. Duration: '+shot.duration_seconds+' seconds.',
  'Camera: '+shot.camera.movement.replaceAll('_',' ')+(shot.camera.lens_mm?' / '+shot.camera.lens_mm+'mm lens':'')+'. Speed: '+shot.camera.speed+'.',
  shot.first_frame_ref?'FIRST anchor: '+label(shot.first_frame_ref)+'.':'',
  shot.last_frame_ref?'LAST anchor: '+label(shot.last_frame_ref)+'.':'',
  shot.motion_ref?'Motion reference: '+label(shot.motion_ref)+' for camera and blocking, not architectural redesign.':'',
  ...(retentionRules.length?['RETENTION RULES:\n'+retention.join('\n')]:[]),...characterLines,...shot.actions,shot.lighting?'Lighting: '+shot.lighting:'',shot.atmosphere?'Atmosphere: '+shot.atmosphere:'',
  ...instructions.map(l=>l.type.toUpperCase()+': '+l.instruction),
  'QC: Preserve source architectural geometry, approved materials and facade structure. Reject unwanted morphing, identity switching, temporal flicker and unexpected objects.'
 ].filter(Boolean).join('\n');
 let text;
 if(profile==='minimax_h3_ref2va'||profile==='minimax_h3_hybrid'||profile==='minimax_h3_video_ref_edit'){
  text=['subject_definitions:',subject||'No semantic references.',
  'summary:','[reference-guided architectural video] '+shot.name,
  'retention_analysis:',retention.join('\n'),
  'detailed_description:','[Shot 1]\n'+body,
  'overall_soundscape:','Natural ambient sound as appropriate; no invented dialogue.',
  'non_diegetic_music:','None specified.'].join('\n\n');
 }else text=['VIDEO SHOT — '+PROFILE_LABELS[profile],subject,body].filter(Boolean).join('\n\n');
 return {text,manifest,issues,profile,shot_id:shot.id,exportable:!issues.some(i=>i.severity==='ERROR'),documented_route:caps.verified,adapter_verified:false,runtime_tested:false};
}
