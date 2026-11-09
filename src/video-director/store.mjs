
import {validateProject,STORAGE_KEY,MAX_IMPORT_BYTES} from './schema.mjs';
export const encode=p=>JSON.stringify(validateProject(p),null,2);
export function decode(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_IMPORT_BYTES)throw Error('Project file exceeds 2 MB');
 return validateProject(JSON.parse(text));
}
export function readProjects(storage){
 try{
  const raw=storage.getItem(STORAGE_KEY);
  if(raw===null)return {projects:[],error:null};
  const data=JSON.parse(raw);
  if(!Array.isArray(data)||data.length>30)throw Error('Invalid project library');
  const projects=data.map(validateProject);
  if(new Set(projects.map(p=>p.id)).size!==projects.length)throw Error('Duplicate project ID');
  return {projects,error:null};
 }catch(e){return {projects:[],error:'Video Director storage cannot be read; original data was not overwritten: '+e.message};}
}
export function writeProjects(storage,projects){
 if(!Array.isArray(projects)||projects.length>30||new Set(projects.map(p=>p.id)).size!==projects.length)throw Error('Invalid project library');
 const safe=projects.map(validateProject);
 storage.setItem(STORAGE_KEY,JSON.stringify(safe));
 return safe;
}
export function upsertProject(storage,project){
 const p=validateProject(project),state=readProjects(storage);
 if(state.error)throw Error(state.error);
 const existing=state.projects.findIndex(x=>x.id===p.id);
 const next=[...state.projects];
 if(existing>=0)next[existing]=p;else next.push(p);
 return writeProjects(storage,next);
}
export function importProject(storage,text,{replace=false}={}){
 const incoming=decode(text),state=readProjects(storage);
 if(state.error)throw Error(state.error);
 const index=state.projects.findIndex(p=>p.id===incoming.id);
 if(index>=0&&!replace)throw Error('Project ID exists; import cancelled without overwrite');
 const next=[...state.projects];
 if(index>=0)next[index]=incoming;else next.push(incoming);
 return writeProjects(storage,next);
}
