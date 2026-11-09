import {validateProject} from './schema.mjs';
const idOk=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(id);
export function saveLayerPreset(project,layer,name,id){
 const p=validateProject(project);
 if(!idOk(id)||typeof name!=='string'||!name.trim()||name.length>120)throw Error('Invalid preset name or ID');
 if(p.layer_presets.some(x=>x.id===id))throw Error('Layer preset ID already exists');
 const copy=structuredClone(layer);
 copy.id='template_'+id;copy.scope='shot';
 p.layer_presets.push({id,name,layer:copy});
 return validateProject(p);
}
export function applyLayerPreset(project,shotId,presetId,newLayerId){
 const p=validateProject(project),s=p.shots.find(x=>x.id===shotId),preset=p.layer_presets.find(x=>x.id===presetId);
 if(!s||!preset||!idOk(newLayerId))throw Error('Unknown shot, preset, or invalid layer ID');
 if(s.layers.some(x=>x.id===newLayerId))throw Error('Duplicate layer ID');
 const copy=structuredClone(preset.layer);copy.id=newLayerId;copy.scope='shot';
 s.layers.push(copy);
 return validateProject(p);
}
