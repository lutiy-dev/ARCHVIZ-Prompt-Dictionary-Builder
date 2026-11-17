import {parseArtDirectionCandidate} from './art-direction-format.mjs';
export function stageArtCandidate(task,raw){
 if(task?.kind!=='archviz_production_task'||!task.id||typeof raw!=='string'||raw.length>30000)throw Error('Invalid task or candidate');
 const content=parseArtDirectionCandidate([{type:'message',content:[{type:'output_text',text:raw}]}]).content;
 return {task_id:task.id,architecture_lock:task.architecture_lock,content,status:'CANDIDATE_REVIEW_REQUIRED',applied_to_project:false};
}
export function decideArtCandidate(candidate,{decision,userConfirmed=false,geometryReviewed=false}={}){
 if(candidate?.status!=='CANDIDATE_REVIEW_REQUIRED'||!['ACCEPTED','REJECTED'].includes(decision)||userConfirmed!==true)throw Error('Explicit candidate decision required');
 const risk=candidate.content.potential_geometry_change||candidate.content.improvements.some(x=>x.geometry_risk);
 if(decision==='ACCEPTED'&&candidate.architecture_lock==='HARD'&&risk&&geometryReviewed!==true)throw Error('Geometry review required before accepting risky candidate');
 return {...structuredClone(candidate),status:decision,applied_to_project:false,geometry_verified:false,decision_scope:'RECOMMENDATIONS_ONLY'};
}
