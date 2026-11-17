import test from 'node:test';
import assert from 'node:assert/strict';
import {SKILL_REGISTRY,OVIZLAB_SKILLS_REPO,OVIZLAB_SKILLS_SHA,getSkill,validateSkillPin} from './skill-registry.mjs';

test('OVizLAB registry pins 25 unique canonical skills',()=>{
 assert.equal(SKILL_REGISTRY.length,25);
 assert.equal(new Set(SKILL_REGISTRY.map(x=>x.id)).size,25);
 assert.match(OVIZLAB_SKILLS_SHA,/^[0-9a-f]{40}$/);
 for(const skill of SKILL_REGISTRY){
  assert.equal(skill.repository,OVIZLAB_SKILLS_REPO);
  assert.equal(skill.path,`skills/${skill.id}/SKILL.md`);
  assert.equal(skill.sha,OVIZLAB_SKILLS_SHA);
  assert.equal(skill.execution_allowed,false);
 }
});
test('Geometry Guardian pin validates without claiming runtime execution',()=>{
 const skill=getSkill('archviz-geometry-guardian');
 assert.ok(skill);
 const report=validateSkillPin(skill.id);
 assert.equal(report.status,'SOURCE_PINNED_METADATA_VALIDATED');
 assert.equal(report.source_fetch_performed,false);
 assert.equal(report.execution_allowed,false);
});
test('Unknown skill fails closed',()=>{
 assert.equal(validateSkillPin('missing').status,'BLOCKED');
});
