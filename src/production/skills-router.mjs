/** Pinned Skill text retrieval. It never evaluates or executes downloaded source. */
import {createHash} from 'node:crypto';
const SHA=/^[0-9a-f]{40}$/;
const safeName=/^[a-z][a-z0-9-]{1,99}$/;
export function skillSource({name,repository='lutiy-dev/GitHab-Skills',sha}){
 if(!safeName.test(name)||repository!=='lutiy-dev/GitHab-Skills'||!SHA.test(sha))throw Error('Untrusted skill reference');
 const path='skills/'+name+'/SKILL.md';
 return Object.freeze({name,repository,sha,path,url:'https://raw.githubusercontent.com/'+repository+'/'+sha+'/'+path,status:'SOURCE_DECLARED_NOT_FETCHED'});
}
/** Verify raw text against the exact Git blob object hash from a trusted Git tree. */
export function gitBlobSha(content){
 if(typeof content!=='string')throw Error('Invalid skill content');
 const data=Buffer.from(content,'utf8');
 return createHash('sha1').update('blob '+data.length+'\0').update(data).digest('hex');
}
export async function fetchPinnedSkill(ref,{fetchImpl=globalThis.fetch,allowNetwork=false,expectedBlobSha=null}={}){
 const source=skillSource(ref);
 if(allowNetwork!==true)throw Error('Network access to skill source was not authorized');
 const res=await fetchImpl(source.url,{method:'GET',redirect:'error',headers:{Accept:'text/plain'}});
 if(!res.ok)throw Error('Skill source returned HTTP '+res.status);
 const content=await res.text();if(content.length>200000)throw Error('Skill source too large');
 const m=content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
 if(!m||!new RegExp('(?:^|\\n)name:\\s*'+source.name+'(?:\\r?\\n|$)').test(m[1]))throw Error('Skill name/frontmatter mismatch');
 if(expectedBlobSha!==null&&(!SHA.test(expectedBlobSha)||gitBlobSha(content)!==expectedBlobSha))throw Error('Skill blob integrity mismatch');
 const verified=expectedBlobSha!==null;
 return {source:{...source,status:verified?'SOURCE_BLOB_VERIFIED':'SOURCE_FETCHED_AT_PINNED_SHA'},content,executable:false,verified_source_integrity:verified};
}