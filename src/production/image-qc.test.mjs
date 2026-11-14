import test from 'node:test';import assert from 'node:assert/strict';
import {comparePixels} from './image-qc.mjs';
const frame=(pixels,w=2,h=1)=>({width:w,height:h,data:new Uint8ClampedArray(pixels)});
test('Identical images still require review, not geometry PASS',()=>{const a=frame([0,0,0,255,120,120,120,255]);const out=comparePixels(a,a);assert.equal(out.changed_ratio,0);assert.equal(out.status,'REVIEW_REQUIRED')});
test('LAB pixel overlay detects controlled difference',()=>{const a=frame([0,0,0,255,120,120,120,255]);const b=frame([0,0,0,255,250,120,120,255]);const out=comparePixels(a,b);assert.equal(out.changed_pixels,1);assert.equal(out.changed_ratio,0.5);assert.equal(out.overlay[4],255);assert.equal(out.overlay[7]>0,true)});
test('Invalid dimensions and oversized images are blocked',()=>{const a=frame([0,0,0,255],1,1);const b=frame([0,0,0,255],2,1);assert.throws(()=>comparePixels(a,b),/dimensions/);assert.throws(()=>comparePixels({width:5000,height:5000,data:[]},{width:5000,height:5000,data:[]}),/8 MP/)});
test('Threshold input is validated and boundary strictly greater',()=>{const a=frame([0,0,0,255],1,1),b=frame([40,0,0,255],1,1);assert.equal(comparePixels(a,b,{channelThreshold:40}).changed_pixels,0);assert.throws(()=>comparePixels(a,b,{channelThreshold:300}),/threshold/)});
