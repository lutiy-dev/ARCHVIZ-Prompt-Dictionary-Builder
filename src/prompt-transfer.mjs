import {validatePrompts} from './saved-prompts.mjs';
export const transferLimit=10000000;
const canonical=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
export function exportPrompts(data,library,presets){
 const text=JSON.stringify(validatePrompts(data,library,presets),null,2);
 if(new TextEncoder().encode(text).length>transferLimit)throw Error('Файл больше 10 МБ. Экспортируйте промпты по одному.');
 return text;
}
export function importPrompts(text,current,library,presets){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>transferLimit)throw Error('Файл больше 10 МБ');
 const incoming=validatePrompts(JSON.parse(text),library,presets),existing=validatePrompts(current,library,presets);
 const byId=new Map(existing.prompts.map(p=>[p.id,p]));let skipped=0;
 for(const p of incoming.prompts){
  const old=byId.get(p.id);
  if(old){if(canonical(old)!==canonical(p))throw Error('Одинаковый ID с разным содержимым. Импорт отменён; записи не изменены.');skipped++;continue;}
  byId.set(p.id,p);
 }
 const data=validatePrompts({schema_version:1,prompts:[...byId.values()]},library,presets);
 return {data,added:data.prompts.length-existing.prompts.length,skipped};
}
