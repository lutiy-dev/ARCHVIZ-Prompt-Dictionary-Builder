/** Pinned Skill text retrieval. It never evaluates or executes downloaded source. */
const SHA=/^[0-9a-f]{40}$/;
const safeName=/^[a-z][a-z0-9-]{1,99}$/;
export function skillSource({name,repository='lutiy-dev/GitHab-Skills',sha}){
 if(!safeName.test(name)||repository!=='lutiy-dev/GitHab-Skills'||!SHA.test(sha))throw Error('Untrusted skill reference');
 const path='skills/'+name+'/SKILL.md';
 return Object.freeze({name,repository,sha,path,url:'https://raw.githubusercontent.com/'+repository+'/'+sha+'/'+path,status:'SOURCE_DECLARED_NOT_FETCHED'});
}
export async function fetchPinnedSkill(ref,{fetchImpl=globalThis.fetch,allowNetwork=false}={}){
 const source=skillSource(ref);
 if(allowNetwork!==true)throw Error('Network access to skill source was not authorized');
 const res=await fetchImpl(source.url,{method:'GET',redirect:'error',headers:{Accept:'text/plain'}});
 if(!res.ok)throw Error('Skill source returned HTTP '+res.status);
 const content=await res.text();if(content.length>200000)throw Error('Skill source too large');
 const m=content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
 if(!m||!new RegExp('(?:^|\\n)name:\\s*'+source.name+'(?:\\r?\\n|$)').test(m[1]))throw Error('Skill name/frontmatter mismatch');
 return {source:{...source,status:'SOURCE_FETCHED_AT_PINNED_SHA'},content,executable:false,verified_source_integrity:false};
}