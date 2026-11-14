/** Bounded history persistence; the legacy application keys remain untouched. */
import {appendHistory} from './core.mjs';
export const PRODUCTION_HISTORY_KEY='archviz-production-history-v1';
const MAX_RECORDS=250;
export function decodeHistory(raw){
 if(typeof raw!=='string'||new TextEncoder().encode(raw).length>800000)throw Error('History JSON exceeds 800KB');
 const data=JSON.parse(raw);if(data?.schema_version!==1||!Array.isArray(data.records)||data.records.length>MAX_RECORDS)throw Error('Invalid history envelope');
 let records=[];for(const item of data.records)records=appendHistory(records,item);
 return records;
}
export function readHistory(storage){
 try{const raw=storage.getItem(PRODUCTION_HISTORY_KEY);return {records:raw===null?[]:decodeHistory(raw),error:null}}catch(e){return {records:[],error:e.message}}
}
export function addHistoryRecord(storage,entry){
 const old=readHistory(storage);if(old.error)throw Error('Storage unsafe to overwrite: '+old.error);
 const records=appendHistory(old.records,entry);if(records.length>MAX_RECORDS)throw Error('History limit reached: export before writing');
 storage.setItem(PRODUCTION_HISTORY_KEY,JSON.stringify({schema_version:1,records}));return records;
}
export function exportHistory(storage){const state=readHistory(storage);if(state.error)throw Error(state.error);return JSON.stringify({schema_version:1,records:state.records},null,2)}
