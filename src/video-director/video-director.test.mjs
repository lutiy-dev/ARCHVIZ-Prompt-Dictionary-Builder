
import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyProject,demonstration,validateProject,shotTemplate,STORAGE_KEY} from './schema.mjs';
import {compileShot} from './compiler.mjs';
import {encode,decode,readProjects,writeProjects,importProject} from './store.mjs';
import {saveLayerPreset,applyLayerPreset} from './layer-presets.mjs';
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

test('Architecture lock detects destructive custom instructions',()=>{
 const p=demonstration();p.shots[4].layers.find(l=>l.type==='additional').instruction='change facade windows';
 const x=compileShot(p,'shot_05');assert.equal(x.exportable,false);assert.ok(x.issues.some(i=>i.code==='ARCHITECTURE_LOCK_CONFLICT'));
});
test('Retention references must resolve and input cannot include hidden asset paths',()=>{
 const p=demonstration(),layer=p.shots[4].layers[0];
 layer.retention=[{ref_id:'missing',mode:'fully_preserved',attributes:['architecture']}];
 assert.throws(()=>validateProject(p));
 layer.retention=[];p.references[0].asset.display_name='/private/image.png';assert.throws(()=>encode(p));
});

test('Documented model routing does not claim runtime verification',()=>{
 const x=compileShot(demonstration(),'shot_05');
 assert.equal(x.documented_route,true);assert.equal(x.adapter_verified,false);assert.equal(x.runtime_tested,false);
});

test('Retention rules appear in compiled video prompt and map to the intended reference',()=>{
 const p=demonstration(),l=p.shots[4].layers.find(l=>l.type==='additional');
 l.retention=[{ref_id:'male_ref',mode:'attribute_transfer',attributes:['face','hair']}];
 const out=compileShot(p,'shot_05');
 assert.equal(out.exportable,true);
 assert.match(out.text,/<Picture 1>: attribute_transfer \(attributes: face, hair\)/);
 assert.ok(out.manifest.find(r=>r.id==='male_ref'));
});
test('Conflicting retention modes on overlapping attributes block export',()=>{
 const p=demonstration(),a=p.shots[4].layers.find(l=>l.type==='additional'),b=p.shots[4].layers.find(l=>l.type==='characters');
 a.retention=[{ref_id:'male_ref',mode:'attribute_transfer',attributes:['face']}];
 b.retention=[{ref_id:'male_ref',mode:'fully_preserved',attributes:['face']}];
 const out=compileShot(p,'shot_05');assert.equal(out.exportable,false);
 assert.ok(out.issues.some(i=>i.code==='RETENTION_CONFLICT'));
 b.retention[0].attributes=['clothing'];assert.equal(compileShot(p,'shot_05').exportable,true);
});
test('Layer preset round-trip and applied instances do not mutate source',()=>{
 const original=demonstration(),layer=original.shots[4].layers.find(l=>l.type==='additional');
 layer.instruction='Preserve reflected sunlight on water';
 layer.retention=[{ref_id:'shot05_animatic',mode:'weak_reference',attributes:['blocking']}];
 const saved=saveLayerPreset(original,layer,'Reflective Scene','preset_01');
 assert.equal(saved.layer_presets.length,1);assert.equal(original.layer_presets.length,0);
 const applied=applyLayerPreset(saved,'shot_06','preset_01','layer_new');
 assert.equal(applied.shots[5].layers.at(-1).instruction,layer.instruction);
 applied.shots[5].layers.at(-1).instruction='modified';
 assert.equal(saved.layer_presets[0].layer.instruction,layer.instruction);
 assert.deepEqual(decode(encode(applied)).layer_presets,applied.layer_presets);
 assert.throws(()=>saveLayerPreset(saved,layer,'Duplicate','preset_01'));
});
test('Legacy v0.1 projects without layer presets load non-destructively',()=>{
 const p=demonstration();delete p.layer_presets;
 const normalized=validateProject(p);assert.deepEqual(normalized.layer_presets,[]);
 assert.equal(Object.hasOwn(p,'layer_presets'),false);
});
test('FL2VA rejects extra reference introduced only by a layer retention rule',()=>{
 const p=demonstration(),s=p.shots[4];p.target_profile='minimax_h3_fl2va';
 s.characters=[];s.motion_ref=null;
 s.layers[0].retention=[{ref_id:'male_ref',mode:'weak_reference',attributes:[]}];
 const compiled=compileShot(p,s.id);assert.equal(compiled.exportable,false);
 assert.ok(compiled.issues.some(i=>i.code==='FL2VA_ADDITIONAL_REF'));
});
