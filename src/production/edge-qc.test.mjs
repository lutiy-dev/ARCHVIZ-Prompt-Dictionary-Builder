import test from 'node:test';
import assert from 'node:assert/strict';
import {compareProtectedEdges} from './edge-qc.mjs';
function image(offset=0,move=0){
 const w=24,h=24,data=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const bright=(x>=6+move&&x<17+move&&y>=7&&y<18)?Math.min(255,170+offset):Math.max(0,20+offset);const i=(y*w+x)*4;data[i]=data[i+1]=data[i+2]=bright;data[i+3]=255}
 return {width:w,height:h,data};
}
const mask=new Uint8Array(24*24).fill(255);
test('Identical protected edges yield zero advisory mismatch but never PASS',()=>{const r=compareProtectedEdges(image(),image(),{mask});assert.equal(r.missing_ratio,0);assert.equal(r.status,'REVIEW_REQUIRED');assert.equal(r.geometry_verified,false)});
test('Uniform brightness shift leaves edges intact',()=>{const r=compareProtectedEdges(image(0),image(30),{mask});assert.equal(r.missing_ratio,0);assert.equal(r.unexpected_ratio,0)});
test('Architectural rectangle shift beyond tolerance triggers warning metrics',()=>{const r=compareProtectedEdges(image(0),image(0,4),{mask});assert.ok(r.missing_ratio>0.1);assert.ok(r.unexpected_ratio>0.1)});
test('Requires explicit mask and valid matching RGBA',()=>{assert.throws(()=>compareProtectedEdges(image(),image()),/mask required/);assert.throws(()=>compareProtectedEdges(image(),image(),{mask:new Uint8Array(2)}),/mask required/)});
test('Blank protected region is inconclusive',()=>{const r=compareProtectedEdges(image(),image(),{mask:new Uint8Array(mask.length)});assert.equal(r.reason,'INSUFFICIENT_EDGE_EVIDENCE')});
