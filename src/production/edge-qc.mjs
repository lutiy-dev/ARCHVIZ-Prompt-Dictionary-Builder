/**
 * LAB protected-area edge comparison for *already aligned* source/candidate renders.
 * Reports advisory evidence only: edges alone cannot prove geometric correctness.
 */
const invalid=m=>{throw Error('BLOCKED: '+m)};
const validImage=x=>x&&Number.isInteger(x.width)&&Number.isInteger(x.height)&&x.width>=3&&x.height>=3&&x.width*x.height<=8_000_000&&x.data?.length===x.width*x.height*4;
function edgeMap(img,threshold){
 const {width:w,height:h,data}=img;const luma=new Float64Array(w*h),edges=new Uint8Array(w*h);
 for(let p=0;p<luma.length;p++){const i=p*4;luma[p]=data[i]*0.2126+data[i+1]*0.7152+data[i+2]*0.0722}
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
  const k=y*w+x,tl=luma[k-w-1],tc=luma[k-w],tr=luma[k-w+1],l=luma[k-1],r=luma[k+1],bl=luma[k+w-1],bc=luma[k+w],br=luma[k+w+1];
  const gx=-tl+tr-2*l+2*r-bl+br,gy=-tl-2*tc-tr+bl+2*bc+br;
  if(Math.hypot(gx,gy)>=threshold)edges[k]=1;
 }
 return edges;
}
function matched(edge,k,mask,w,h,tolerance){
 if(!tolerance)return edge[k]===1&&mask[k]>0;
 const y=Math.floor(k/w),x=k%w;
 for(let yy=Math.max(1,y-tolerance);yy<=Math.min(h-2,y+tolerance);yy++)
  for(let xx=Math.max(1,x-tolerance);xx<=Math.min(w-2,x+tolerance);xx++){
   const at=yy*w+xx;if(mask[at]>0&&edge[at])return true;
  }
 return false;
}
export function compareProtectedEdges(source,candidate,{mask,edgeThreshold=140,tolerancePx=1}={}){
 if(!validImage(source)||!validImage(candidate)||source.width!==candidate.width||source.height!==candidate.height)invalid('input frames must be aligned, matching RGBA, 3+ px and <=8MP');
 const {width:w,height:h}=source;
 if(!mask||mask.length!==w*h)invalid('explicit one-channel protected-area mask required');
 if(!Number.isFinite(edgeThreshold)||edgeThreshold<=0||edgeThreshold>1500||!Number.isInteger(tolerancePx)||tolerancePx<0||tolerancePx>2)invalid('invalid edge configuration');
 const a=edgeMap(source,edgeThreshold),b=edgeMap(candidate,edgeThreshold);
 let sourceEdges=0,candidateEdges=0,sourceMissing=0,candidateUnexpected=0,protectedPixels=0;
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
  const k=y*w+x;if(!mask[k])continue;protectedPixels++;
  if(a[k]){sourceEdges++;if(!matched(b,k,mask,w,h,tolerancePx))sourceMissing++}
  if(b[k]){candidateEdges++;if(!matched(a,k,mask,w,h,tolerancePx))candidateUnexpected++}
 }
 if(!protectedPixels||!sourceEdges||!candidateEdges)return {status:'REVIEW_REQUIRED',reason:'INSUFFICIENT_EDGE_EVIDENCE',protected_pixels:protectedPixels,source_edges:sourceEdges,candidate_edges:candidateEdges};
 return {status:'REVIEW_REQUIRED',reason:'EDGE_METRICS_ARE_ADVISORY',
  protected_pixels:protectedPixels,source_edges:sourceEdges,candidate_edges:candidateEdges,
  missing_ratio:sourceMissing/sourceEdges,unexpected_ratio:candidateUnexpected/candidateEdges,
  tolerance_px:tolerancePx,edge_threshold:edgeThreshold,geometry_verified:false,alignment_verified:false};
}
