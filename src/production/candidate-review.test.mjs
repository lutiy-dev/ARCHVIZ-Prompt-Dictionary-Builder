import test from 'node:test';import assert from 'node:assert/strict';
import {stageArtCandidate,decideArtCandidate} from './candidate-review.mjs';
const task={kind:'archviz_production_task',id:'task_1',architecture_lock:'HARD'};
const draft={summary:'Improve lighting',improvements:[{area:'lighting',proposal:'Soft evening light',reason:'Clearer facade',geometry_risk:false}],potential_geometry_change:false,requires_human_review:true};
test('Staged model recommendation cannot alter original project',()=>{const c=stageArtCandidate(task,JSON.stringify(draft));assert.equal(c.applied_to_project,false);assert.equal(c.status,'CANDIDATE_REVIEW_REQUIRED');assert.throws(()=>decideArtCandidate(c,{decision:'ACCEPTED'}),/Explicit/)});
test('User may accept safe recommendation without applying it automatically',()=>{const c=stageArtCandidate(task,JSON.stringify(draft));const d=decideArtCandidate(c,{decision:'ACCEPTED',userConfirmed:true});assert.equal(d.status,'ACCEPTED');assert.equal(d.applied_to_project,false)});
test('Risky architecture candidate requires separate geometry review',()=>{const r={...draft,potential_geometry_change:true};const c=stageArtCandidate(task,JSON.stringify(r));assert.throws(()=>decideArtCandidate(c,{decision:'ACCEPTED',userConfirmed:true}),/Geometry review/);assert.equal(decideArtCandidate(c,{decision:'REJECTED',userConfirmed:true}).status,'REJECTED')});
test('Corrupt candidate JSON cannot be staged',()=>assert.throws(()=>stageArtCandidate(task,'{'),SyntaxError));
