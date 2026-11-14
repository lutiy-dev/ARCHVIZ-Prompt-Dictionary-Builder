/** Strict recommendation-only structured format for an AI Art Director response. */
export const ART_DIRECTION_FORMAT=Object.freeze({
 type:'json_schema',
 name:'archviz_art_direction_v1',
 strict:true,
 schema:{
  type:'object',additionalProperties:false,
  properties:{
   summary:{type:'string'},
   improvements:{type:'array',items:{type:'object',additionalProperties:false,
     properties:{area:{type:'string',enum:['composition','lighting','materials','atmosphere','camera','other']},proposal:{type:'string'},reason:{type:'string'},geometry_risk:{type:'boolean'}},
     required:['area','proposal','reason','geometry_risk']}},
   potential_geometry_change:{type:'boolean'},
   requires_human_review:{type:'boolean'}
  },
  required:['summary','improvements','potential_geometry_change','requires_human_review']
 }
});
export function parseArtDirectionCandidate(output){
 const blocks=(output||[]).flatMap(item=>item?.type==='message'?(item.content||[]):[]);
 const texts=blocks.filter(item=>item?.type==='output_text'&&typeof item.text==='string').map(item=>item.text);
 if(texts.length!==1)throw Error('No unambiguous structured response');
 const data=JSON.parse(texts[0]);
 if(typeof data.summary!=='string'||!Array.isArray(data.improvements)||typeof data.potential_geometry_change!=='boolean'||typeof data.requires_human_review!=='boolean')throw Error('Invalid structured response');
 const allowed=new Set(['composition','lighting','materials','atmosphere','camera','other']);
 if(data.improvements.length>50||!data.improvements.every(item=>allowed.has(item?.area)&&typeof item?.proposal==='string'&&typeof item?.reason==='string'&&typeof item?.geometry_risk==='boolean'))throw Error('Invalid recommendation');
 return {status:'CANDIDATE_REVIEW_REQUIRED',geometry_verified:false,content:data};
}
