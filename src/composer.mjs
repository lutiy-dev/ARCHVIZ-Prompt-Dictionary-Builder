import {sectionRu,translateBlock} from './translation-ru.mjs';
export function compose(library, selection) {
 const byId=new Map(library.blocks.map(b=>[b.id,b])); const seen=new Set(), groups=new Map(), groupsRu=new Map(), warnings=[];
 const ids=new Set(selection.map(s=>s.id));
 for(const item of selection){const b=byId.get(item.id);if(!b)throw Error(`Unknown block: ${item.id}`);
 for(const conflict of b.conflicts||[])if(ids.has(conflict)&&b.id<conflict)warnings.push(`${b.en} ↔ ${byId.get(conflict).en}`);
 const text=b.text.replace(/\{\{(\w+)\}\}/g,(_,key)=>String(item.parameters?.[key]??b.parameters[key]??''));
 const key=text.trim().replace(/\s+/g,' ').toLowerCase();if(seen.has(key))continue;seen.add(key);
 if(!groups.has(b.section)){groups.set(b.section,[]);groupsRu.set(b.section,[]);}groups.get(b.section).push(text);groupsRu.get(b.section).push(translateBlock(b,item));
 }
 return {text:library.sections.filter(s=>groups.has(s)).map(s=>s+'\n'+groups.get(s).join('\n')).join('\n\n'),textRu:library.sections.filter(s=>groupsRu.has(s)).map(s=>(sectionRu[s]||s)+'\n'+groupsRu.get(s).join('\n')).join('\n\n'),warnings};
}
export function merge(selection,ids){const seen=new Set(selection.map(b=>b.id));return [...selection,...ids.filter(id=>!seen.has(id)&&seen.add(id)).map(id=>({id,parameters:{}}))];}
