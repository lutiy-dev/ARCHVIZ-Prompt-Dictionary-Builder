// Reviewed reading aid for the canonical English blocks. Source text must match exactly.
export const sectionRu={
 'GOAL':'ЗАДАЧА','SOURCE / INPUT':'ИСТОЧНИК / ВХОДНЫЕ ДАННЫЕ',
 'MUST PRESERVE':'ОБЯЗАТЕЛЬНО СОХРАНИТЬ','ALLOWED CHANGES':'РАЗРЕШЁННЫЕ ИЗМЕНЕНИЯ',
 'MATERIAL / SUBJECT':'МАТЕРИАЛ / ОБЪЕКТ','LIGHT / ATMOSPHERE':'СВЕТ / АТМОСФЕРА',
 'CAMERA / PHOTOGRAPHY':'КАМЕРА / ФОТОГРАФИЯ','RESTRICTIONS':'ЗАПРЕТЫ','QC':'ПРОВЕРКА КАЧЕСТВА'
};
export const translationRu={
 goal:{source:'Create a photorealistic architectural image from the supplied render.',ru:'Создать фотореалистичное архитектурное изображение на основе предоставленного рендера.'},
 source:{source:'Use the source render as the authority for geometry, camera and composition.',ru:'Считать исходный рендер эталоном геометрии, камеры и композиции.'},
 geometry:{source:'Preserve the original architectural geometry, camera position, building proportions, floor count and facade openings.',ru:'Сохранить исходную архитектурную геометрию, положение камеры, пропорции здания, количество этажей и проёмы фасада.'},
 windows:{source:'Keep all windows, glazing, frames and balcony openings unchanged.',ru:'Оставить без изменений все окна, остекление, рамы и балконные проёмы.'},
 facade:{source:'Change only the opaque exterior wall material within the supplied facade mask. Preserve all opening boundaries.',ru:'Изменять только непрозрачный материал наружных стен в пределах предоставленной маски фасада. Сохранить границы всех проёмов.'},
 brick:{source:'Use aged red brick with {{scale}}, {{joints}}, {{roughness}} and {{weathering}}.',ru:'Использовать состаренный красный кирпич: {{scale}}, {{joints}}, {{roughness}}, {{weathering}}.',defaults:{scale:['realistic brick dimensions','реалистичный размер кирпича'],joints:['recessed mortar joints','утопленные растворные швы'],roughness:['matte surface roughness','матовая шероховатость поверхности'],weathering:['subtle localized weathering','лёгкое локальное старение']}},
 limestone:{source:'Use weathered limestone with {{scale}}, {{joints}}, {{roughness}} and {{weathering}}.',ru:'Использовать выветренный известняк: {{scale}}, {{joints}}, {{roughness}}, {{weathering}}.',defaults:{scale:['natural block scale','естественный масштаб каменных блоков'],joints:['fine mortar joints','тонкие растворные швы'],roughness:['matte mineral roughness','матовая минеральная шероховатость'],weathering:['subtle edge erosion','лёгкая эрозия кромок']}},
 travertine:{source:'Refine the existing light travertine on the masked upper facade. Make its natural directional grain, fine open pores and restrained mineral banding visible at architectural viewing distance. Keep the original stone color, panel layout, edges, joints, relief and daylight response; do not invent new seams or replace the architectural design.',ru:'Уточнить существующий светлый травертин на верхнем фасаде в пределах маски. Сделать заметными естественную направленную фактуру, мелкие открытые поры и сдержанную минеральную полосчатость с обычной дистанции восприятия архитектуры. Сохранить исходный цвет камня, раскладку панелей, кромки, швы, рельеф и вид материала при дневном свете; не придумывать новые швы и не менять архитектурный проект.'},
 overcast:{source:'Use overcast daylight with soft diffused shadows.',ru:'Использовать пасмурный дневной свет с мягкими рассеянными тенями.'},
 night:{source:'Create a night atmosphere with plausible illumination from existing fixtures only.',ru:'Создать ночную атмосферу с правдоподобным освещением только от существующих светильников.'},
 wet:{source:'Apply subtle dampness and physically plausible reflections to ground surfaces only; preserve their boundaries.',ru:'Добавить лёгкую влажность и физически правдоподобные отражения только на поверхности земли; сохранить её границы.'},
 autumn:{source:'Shift existing foliage to natural autumn colors without changing plant count, placement or silhouette.',ru:'Изменить цвет существующей листвы на естественные осенние оттенки, не меняя количество растений, их расположение и силуэты.'},
 photo:{source:'Use restrained commercial architectural photography grading, natural dynamic range and believable material response. Preserve the source perspective and framing.',ru:'Применить сдержанную обработку в стиле коммерческой архитектурной фотографии, естественный динамический диапазон и правдоподобное поведение материалов при освещении. Сохранить исходную перспективу и кадрирование.'},
 exclude:{source:'Do not add or remove architectural elements. No extra floors, moved windows, warped edges, invented balconies, text or watermarks.',ru:'Не добавлять и не удалять архитектурные элементы. Не допускать дополнительных этажей, смещённых окон, искривлённых контуров, придуманных балконов, текста и водяных знаков.'},
 qc:{source:'Check against the source: identical floor count, opening positions, silhouettes, camera and perspective; clean mask boundaries and no texture spill. Reject results with geometry drift.',ru:'Сверить с исходником: то же количество этажей, положение проёмов, силуэты, камера и перспектива; чёткие границы маски и отсутствие выхода текстуры за них. Отклонить результат при отклонении геометрии.'},
 road:{source:'Refine existing pavement texture, joints and wear only inside the ground mask. Preserve curbs, road width and paving boundaries.',ru:'Уточнить существующую фактуру покрытия, швы и износ только внутри маски земли. Сохранить бордюры, ширину дороги и границы покрытия.'},
 greenery:{source:'Refine existing vegetation inside its mask. Preserve species intent, plant count, placement and overall silhouette. Do not add trees.',ru:'Уточнить существующую растительность внутри её маски. Сохранить задуманные виды растений, их количество, расположение и общий силуэт. Не добавлять деревья.'},
 people:{source:'Edit people only inside the supplied people mask. Match source perspective, scale, lighting and contact shadows. Preserve surrounding architecture.',ru:'Редактировать людей только внутри предоставленной маски людей. Согласовать их с исходной перспективой, масштабом, освещением и контактными тенями. Сохранить окружающую архитектуру.'},
 interior:{source:'Refine the supplied interior render to photographic realism while preserving the layout and furniture placement.',ru:'Довести предоставленный рендер интерьера до фотографического реализма, сохранив планировку и расположение мебели.'},
 polish:{source:'Adjust tonal balance, highlight rolloff and atmospheric depth only. Use the reference for mood, not geometry or new objects.',ru:'Изменять только тональный баланс, мягкость перехода светов и атмосферную глубину. Использовать референс для настроения, а не для геометрии или новых объектов.'},
 mask:{source:'Treat the supplied mask as the edit boundary. Preserve all pixels outside the intended editable region as closely as the editing system allows.',ru:'Считать предоставленную маску границей редактирования. Сохранять все пиксели вне намеченной области настолько точно, насколько позволяет система редактирования.'}
};

export function translateBlock(block,item){
 const t=translationRu[block.id];
 if(!t||t.source!==block.text)return `[Перевод блока не сверен. EN: ${block.text.replace(/\{\{(\w+)\}\}/g,(_,key)=>String(item.parameters?.[key]??block.parameters[key]??''))}]`;
 return t.ru.replace(/\{\{(\w+)\}\}/g,(_,key)=>{
  const value=String(item.parameters?.[key]??block.parameters[key]??'');
  const pair=t.defaults?.[key];
  return pair&&value===pair[0]?pair[1]:`[EN: ${value}]`;
 });
}
