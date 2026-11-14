/** LAB-only image-diff. Pixel changes cannot establish architectural geometry preservation. */
const assert=(condition,message)=>{if(!condition)throw Error(message)};
export function comparePixels(source,candidate,{channelThreshold=40}={}){
 assert(source&&candidate&&Number.isInteger(source.width)&&Number.isInteger(source.height),'Invalid source image');
 assert(source.width>0&&source.height>0&&source.width*candidate.height===candidate.width*source.height&&source.width===candidate.width&&source.height===candidate.height,'Image dimensions must match (alignment required)');
 const pixels=source.width*source.height;
 assert(pixels<=8_000_000,'Image exceeds LAB safety limit of 8 MP');
 assert(Number.isInteger(channelThreshold)&&channelThreshold>=0&&channelThreshold<=255,'Invalid threshold');
 assert(source.data?.length===pixels*4&&candidate.data?.length===pixels*4,'Malformed pixel buffers');
 const overlay=new Uint8ClampedArray(pixels*4);
 let changed=0;let accumulated=0;
 for(let i=0;i<overlay.length;i+=4){
  const delta=Math.max(Math.abs(source.data[i]-candidate.data[i]),Math.abs(source.data[i+1]-candidate.data[i+1]),Math.abs(source.data[i+2]-candidate.data[i+2]));
  accumulated+=delta;
  if(delta>channelThreshold){changed++;overlay[i]=255;overlay[i+3]=Math.min(255,Math.max(48,delta));}
 }
 return {width:source.width,height:source.height,changed_pixels:changed,changed_ratio:changed/pixels,average_max_channel_difference:accumulated/pixels,channel_threshold:channelThreshold,overlay,status:'REVIEW_REQUIRED',reasons:['PIXEL_DIFF_NOT_GEOMETRY_PROOF','MANUAL_ARCHITECTURE_REVIEW_REQUIRED']};
}
export async function compareImageFiles(original,candidate,{threshold=40}={}){
 assert(original instanceof Blob&&candidate instanceof Blob,'Two local image files required');
 assert(original.size>0&&candidate.size>0&&original.size<=30_000_000&&candidate.size<=30_000_000,'Image file exceeds 30MB LAB limit');
 const a=await createImageBitmap(original),b=await createImageBitmap(candidate);
 try{
  assert(a.width===b.width&&a.height===b.height,'Image dimensions differ; align images before comparison');
  assert(a.width*b.height<=8_000_000,'Maximum supported image size is 8MP');
  const canvas=document.createElement('canvas');canvas.width=a.width;canvas.height=a.height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});assert(ctx,'2D Canvas not available');
  ctx.drawImage(a,0,0);const left=ctx.getImageData(0,0,a.width,a.height);
  ctx.clearRect(0,0,a.width,a.height);ctx.drawImage(b,0,0);const right=ctx.getImageData(0,0,b.width,b.height);
  const result=comparePixels(left,right,{channelThreshold:threshold});
  const overlayCtx=canvas.getContext('2d');overlayCtx.putImageData(new ImageData(result.overlay,a.width,a.height),0,0);
  return {report:{...result,overlay:undefined},canvas};
 }finally{a.close();b.close()}
}