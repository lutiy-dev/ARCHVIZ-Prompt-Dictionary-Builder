export const promptLibraryKey='archviz-prompt-library-v1';
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const string=(x,max)=>typeof x==='string'&&x.trim().length>0&&x.length<=max;
export function validatePrompts(value,library,presets){
 if(!plain(value)||value.schema_version!==1||!Array.isArray(value.prompts)||value.prompts.length>500)throw Error('Неверный формат Saved Prompts');
 const blocks=new Map(library.blocks.map(b=>[b.id,b])),scenarios=new Set(presets.map(p=>p.id)),ids=new Set();
 return {schema_version:1,prompts:value.prompts.map(p=>{
  if(!plain(p)||!string(p.id,100)||ids.has(p.id)||!string(p.name,100)||!scenarios.has(p.scenario)||!string(p.text,100000)||!Array.isArray(p.blockIds)||!p.blockIds.length||p.blockIds.length>200||new Set(p.blockIds).size!==p.blockIds.length||!plain(p.parameters)||!string(p.createdAt,40)||!Number.isFinite(Date.parse(p.createdAt))||new Date(p.createdAt).toISOString()!==p.createdAt)throw Error('Неверная запись Saved Prompt');
  ids.add(p.id);const parameters={};
  for(const id of p.blockIds){const b=blocks.get(id);if(!b||!plain(p.parameters[id]))throw Error('Неизвестный блок или параметры');parameters[id]={};for(const [key,v] of Object.entries(p.parameters[id])){if(!Object.hasOwn(b.parameters,key)||typeof v!=='string'||v.length>2000)throw Error('Неверный параметр');parameters[id][key]=v;}}
  if(Object.keys(p.parameters).some(id=>!p.blockIds.includes(id)))throw Error('Лишние параметры');
  return {id:p.id,name:p.name,scenario:p.scenario,text:p.text,blockIds:[...p.blockIds],parameters,createdAt:p.createdAt};
 })};
}
export function readPrompts(storage,library,presets){try{const raw=storage.getItem(promptLibraryKey);return {data:raw===null?{schema_version:1,prompts:[]}:validatePrompts(JSON.parse(raw),library,presets),error:null};}catch{return {data:{schema_version:1,prompts:[]},error:'Saved Prompts недоступны или повреждены. Исходное сохранение не перезаписано; исправьте его или восстановите резервную копию.'};}}
export function writePrompts(storage,data,library,presets){const checked=validatePrompts(data,library,presets);storage.setItem(promptLibraryKey,JSON.stringify(checked));return checked;}
export function snapshotPrompt({id,name,scenario,text,selection,library,createdAt}){const byId=new Map(library.blocks.map(b=>[b.id,b]));return {id,name,scenario,text,blockIds:selection.map(s=>s.id),parameters:Object.fromEntries(selection.map(s=>[s.id,{...byId.get(s.id).parameters,...s.parameters}])),createdAt};}
