
import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyProject,demonstration,validateProject,shotTemplate,STORAGE_KEY} from './schema.mjs';
import {compileShot} from './compiler.mjs';
import {encode,decode,readProjects,writeProjects,importProject} from './store.mjs';
test('synthetic NABEREJNAYA has 12 shots / 90 seconds and five reference declarations',()=>{
 const p=demonstration();assert.equal(p.shots.length,12);assert.equal(p.shots.reduce((sum,s)=>sum+s.duration_seconds,0),90);
 assert.equal(p.references.length,5);assert.equal(validateProject(p).name,p.name);
});
test('Hybrid shot binds male and female to correct stable sources',()=>{
 const p=demonstration(),x=compileShot(p,'shot_05');
 assert.equal(x.exportable,true);
 assert.equal(x.manifest.find(r=>r.id==='male_ref').slot,'<Picture 1>');
 assert.equal(x.manifest.find(r=>r.id==='female_ref').slot,'<Picture 2>');
 assert.equal(x.manifest.find(r=>r.id==='shot05_first').slot,'FIRST');
 assert.equal(x.manifest.find(r=>r.id==='shot05_last').slot,'LAST');
 assert.equal(x.manifest.find(r=>r.id==='shot05_animatic').slot,'<Video 1>');
 assert.ok(x.issues.some(i=>i.code==='ENDPOINT_IDENTITY_CONFLICT'));
});
test('FL2VA rejects mixed actor and motion references',()=>{
 const p=demonstration();p.target_profile='minimax_h3_fl2va';const x=compileShot(p,'shot_05');
 assert.equal(x.exportable,false);assert.ok(x.issues.some(i=>i.code==='FL2VA_EXTRA_REF'));
});
test('Video Reference Edit demands source video',()=>{
 const p=demonstration();p.target_profile='minimax_h3_video_ref_edit';p.shots[4].first_frame_ref=null;p.shots[4].last_frame_ref=null;p.shots[4].motion_ref=null;
 const x=compileShot(p,'shot_05');assert.equal(x.exportable,false);assert.ok(x.issues.some(i=>i.code==='EDIT_SOURCE_REQUIRED'));
});
test('Stable binding unaffected by reference array reordering',()=>{
 const p=demonstration(),a=compileShot(p,'shot_05');p.references.reverse();const b=compileShot(p,'shot_05');
 assert.deepEqual(b.manifest,a.manifest);assert.equal(a.text,b.text);
});
test('Project JSON round trip preserves layer custom instructions',()=>{
 const p=demonstration();p.shots[4].layers[1].instruction='Do not alter window counts';
 assert.deepEqual(decode(encode(p)),p);
});
test('Unknown reference and character relations fail atomically',()=>{
 const p=demonstration();p.shots[4].first_frame_ref='no_such_reference';
 assert.throws(()=>validateProject(p));assert.throws(()=>decode(JSON.stringify(p)));
});
test('Separate namespace, invalid import cannot replace originals',()=>{
 const map=new Map(),s={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
 const p=demonstration();map.set('archviz-prompt-studio-v1','legacy');map.set('archviz-prompt-library-v1','legacy_saved');
 writeProjects(s,[p]);assert.equal(readProjects(s).projects.length,1);
 assert.throws(()=>importProject(s,'{"schema_version":99}'));
 assert.equal(readProjects(s).projects.length,1);assert.equal(map.get('archviz-prompt-studio-v1'),'legacy');assert.equal(map.get('archviz-prompt-library-v1'),'legacy_saved');
 assert.equal(STORAGE_KEY,'archviz-video-director-v1');
});
test('Static camera lock conflicts with moving camera',()=>{
 const p=demonstration();p.shots[4].layers.find(l=>l.type==='camera').instruction='locked camera throughout';const x=compileShot(p,'shot_05');
 assert.equal(x.exportable,false);assert.ok(x.issues.some(i=>i.code==='STATIC_CAMERA_CONFLICT'));
});
test('Compile does not mutate input',()=>{
 const p=demonstration(),snapshot=JSON.stringify(p),a=compileShot(p,'shot_05'),b=compileShot(p,'shot_05');
 assert.equal(JSON.stringify(p),snapshot);assert.equal(a.text,b.text);
});
test('No new references have attached media or public URLs',()=>{
 const p=demonstration();assert.ok(p.references.every(r=>r.asset.state==='DECLARED'&&!('url' in r.asset)));
});

test('Camera presets are independent snapshots and reject duplicate IDs',()=>{
 const p=demonstration(),camera=structuredClone(p.shots[4].camera);
 p.camera_presets=[{id:'camera_1',name:'Lateral tracking',camera}];
 const c=validateProject(p);p.shots[4].camera.movement='static';
 assert.equal(c.camera_presets[0].camera.movement,'truck_right');
 p.camera_presets.push({...p.camera_presets[0]});assert.throws(()=>validateProject(p));
});
test('Unexpected project fields and embedded media paths are rejected',()=>{
 const p=demonstration();p.secret_key='should never be exported';assert.throws(()=>encode(p));
 delete p.secret_key;p.references[0].asset.file_path='C:\\\\private';assert.throws(()=>encode(p));
});
