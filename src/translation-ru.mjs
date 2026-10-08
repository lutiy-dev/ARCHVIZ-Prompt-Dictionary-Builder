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

Object.assign(translationRu,{
 "golden-hour": {
  "source": "Use warm low-angle golden-hour sunlight with elongated natural shadows, controlled highlights and believable warm-to-cool color separation.",
  "ru": "Использовать тёплый низкий свет золотого часа с длинными естественными тенями, контролируемыми светами и правдоподобным разделением тёплых и холодных оттенков."
 },
 "blue-hour": {
  "source": "Use blue-hour ambient light with a cool sky, restrained contrast and plausible warm illumination from existing fixtures only.",
  "ru": "Использовать освещение синего часа с холодным небом, сдержанным контрастом и правдоподобным тёплым светом только от существующих светильников."
 },
 "early-morning": {
  "source": "Use clear early-morning daylight with a low sun angle, gentle contrast and fresh neutral-to-cool ambient light.",
  "ru": "Использовать ясный ранний утренний свет с низким солнцем, мягким контрастом и свежим нейтральным или прохладным рассеянным освещением."
 },
 "bright-midday": {
  "source": "Use bright midday daylight with a high sun angle, crisp physically plausible shadows and controlled highlight clipping.",
  "ru": "Использовать яркий полуденный свет с высоким солнцем, чёткими физически правдоподобными тенями и контролируемым пересветом."
 },
 "late-afternoon": {
  "source": "Use late-afternoon daylight with a moderately low sun angle, warm directional light and natural shadow depth.",
  "ru": "Использовать дневной свет ближе к вечеру с умеренно низким солнцем, тёплым направленным освещением и естественной глубиной теней."
 },
 "twilight": {
  "source": "Use twilight ambient light after sunset with a luminous cool sky and plausible illumination from existing fixtures only.",
  "ru": "Использовать сумеречное освещение после заката со светящимся холодным небом и правдоподобным светом только от существующих светильников."
 },
 "soft-diffused-light": {
  "source": "Use broad soft diffused illumination with gentle shadow transitions and restrained specular highlights.",
  "ru": "Использовать широкое мягкое рассеянное освещение с плавными переходами теней и сдержанными зеркальными бликами."
 },
 "hard-sunlight": {
  "source": "Use strong direct sunlight with crisp shadow edges while preserving physically plausible exposure and material response.",
  "ru": "Использовать сильный прямой солнечный свет с чёткими границами теней, сохраняя физически правдоподобную экспозицию и поведение материалов."
 },
 "side-light": {
  "source": "Emphasize existing surface relief with directional side lighting while preserving the source geometry and camera.",
  "ru": "Подчеркнуть существующий рельеф поверхности направленным боковым светом, сохраняя исходную геометрию и камеру."
 },
 "backlight": {
  "source": "Use controlled architectural backlighting with believable edge separation and preserved facade readability.",
  "ru": "Использовать контролируемое контровое архитектурное освещение с правдоподобным отделением контуров и сохранением читаемости фасада."
 },
 "warm-interior-glow": {
  "source": "Add restrained warm interior illumination only behind existing glazed openings; do not create new windows, fixtures or interior geometry.",
  "ru": "Добавить сдержанный тёплый свет интерьера только за существующими остеклёнными проёмами; не создавать новые окна, светильники или геометрию интерьера."
 },
 "clear-air": {
  "source": "Use clear dry air with high but natural visibility, restrained atmospheric scattering and no artificial haze.",
  "ru": "Использовать ясный сухой воздух с высокой, но естественной видимостью, сдержанным атмосферным рассеянием и без искусственной дымки."
 },
 "light-haze": {
  "source": "Add subtle distance haze for atmospheric depth without obscuring facade detail or changing silhouettes.",
  "ru": "Добавить лёгкую дымку вдали для атмосферной глубины, не скрывая детали фасада и не меняя силуэты."
 },
 "light-mist": {
  "source": "Add a thin natural mist concentrated in depth and low areas; keep the primary architecture clearly readable.",
  "ru": "Добавить тонкий естественный туман преимущественно вдали и в низких участках; основная архитектура должна оставаться отчётливо читаемой."
 },
 "after-rain": {
  "source": "Create a subtle after-rain atmosphere with clean humid air and localized residual moisture; do not imply active rainfall.",
  "ru": "Создать лёгкую атмосферу после дождя с чистым влажным воздухом и локальными остатками влаги; не изображать продолжающийся дождь."
 },
 "dramatic-clouds": {
  "source": "Use a believable layered cloudscape with controlled drama; keep the architecture as the visual priority.",
  "ru": "Использовать правдоподобное многослойное облачное небо со сдержанной драматичностью; архитектура остаётся главным визуальным объектом."
 },
 "subtle-aerial-perspective": {
  "source": "Increase atmospheric depth subtly with distance-dependent contrast and saturation falloff; preserve foreground clarity.",
  "ru": "Слегка усилить атмосферную глубину за счёт снижения контраста и насыщенности с расстоянием; сохранить чёткость переднего плана."
 },
 "microdetail": {
  "source": "Enhance physically plausible fine surface microdetail without changing object shape, edges, joints or architectural boundaries.",
  "ru": "Усилить физически правдоподобные мелкие детали поверхности, не меняя форму объектов, кромки, швы и архитектурные границы."
 },
 "roughness-variation": {
  "source": "Add subtle non-uniform roughness variation appropriate to the existing material, avoiding glossy noise and exaggerated contrast.",
  "ru": "Добавить лёгкую неоднородность шероховатости, соответствующую существующему материалу; избегать блестящего шума и чрезмерного контраста."
 },
 "subtle-weathering": {
  "source": "Add restrained localized weathering consistent with exposure, runoff and contact zones; avoid uniform procedural dirt.",
  "ru": "Добавить сдержанное локальное старение с учётом воздействия среды, стока воды и контактных зон; избегать равномерной процедурной грязи."
 },
 "edge-wear": {
  "source": "Add very subtle physically plausible wear to exposed existing edges only; do not round, chip or reshape geometry.",
  "ru": "Добавить очень лёгкий физически правдоподобный износ только на существующих открытых кромках; не скруглять, не скалывать и не менять геометрию."
 },
 "stone-detail": {
  "source": "Enhance natural mineral variation, pores and fine tonal variation at realistic scale while preserving existing stone joints and block layout.",
  "ru": "Усилить естественную минеральную неоднородность, поры и тонкие тональные различия в реалистичном масштабе, сохраняя швы камня и раскладку блоков."
 },
 "concrete-detail": {
  "source": "Use realistic architectural concrete response with restrained pores, subtle tonal variation and physically plausible roughness at true scale.",
  "ru": "Использовать реалистичное поведение архитектурного бетона с умеренными порами, лёгкой тональной неоднородностью и физически правдоподобной шероховатостью в натуральном масштабе."
 },
 "glass-realism": {
  "source": "Refine existing glazing with believable reflection, transmission and subtle roughness variation while preserving every frame and opening.",
  "ru": "Уточнить существующее остекление правдоподобными отражениями, прозрачностью и лёгкой неоднородностью шероховатости, сохраняя каждую раму и проём."
 },
 "pavement-detail": {
  "source": "Enhance existing pavement with realistic aggregate, joints, subtle wear and roughness variation at correct scale; preserve all paving boundaries.",
  "ru": "Улучшить существующее покрытие: реалистичный заполнитель, швы, лёгкий износ и неоднородность шероховатости в правильном масштабе; сохранить все границы мощения."
 },
 "natural-greenery-detail": {
  "source": "Increase natural leaf, grass and branch detail within existing vegetation while preserving plant count, placement and silhouette.",
  "ru": "Усилить естественную детализацию листьев, травы и ветвей существующей растительности, сохраняя количество растений, расположение и силуэты."
 },
 "spring": {
  "source": "Shift existing vegetation toward fresh natural spring growth without changing plant count, placement or silhouette.",
  "ru": "Передать свежую естественную весеннюю растительность, не меняя количество растений, расположение и силуэты."
 },
 "summer": {
  "source": "Keep existing vegetation in healthy natural summer condition with varied greens and no change to plant count, placement or silhouette.",
  "ru": "Сохранить существующую растительность в естественном здоровом летнем состоянии с разнообразными зелёными оттенками, без изменения количества растений, расположения и силуэтов."
 },
 "winter": {
  "source": "Shift the existing scene toward a restrained winter condition while preserving architecture, plant placement and silhouettes; do not add snow unless separately requested.",
  "ru": "Передать сдержанное зимнее состояние существующей сцены, сохраняя архитектуру, расположение растений и силуэты; не добавлять снег без отдельного запроса."
 },
 "highlight-rolloff": {
  "source": "Use smooth photographic highlight rolloff that retains bright-surface detail and avoids harsh digital clipping.",
  "ru": "Использовать плавный фотографический переход светов, сохраняя детали ярких поверхностей и избегая резкого цифрового пересвета."
 },
 "natural-contrast": {
  "source": "Use restrained photographic contrast with readable shadows, controlled highlights and no crushed blacks.",
  "ru": "Использовать сдержанный фотографический контраст с читаемыми тенями, контролируемыми светами и без проваленных чёрных участков."
 },
 "neutral-color": {
  "source": "Maintain a natural neutral color balance with believable material colors and no excessive global color cast.",
  "ru": "Сохранить естественный нейтральный цветовой баланс с правдоподобными цветами материалов и без чрезмерного общего цветового оттенка."
 },
 "premium-real-estate": {
  "source": "Use polished high-end real-estate photography aesthetics with natural exposure, clean color separation and restrained processing; preserve source framing.",
  "ru": "Использовать эстетику профессиональной фотографии премиальной недвижимости: естественная экспозиция, чёткое разделение цветов и сдержанная обработка; сохранить исходное кадрирование."
 },
 "editorial-architecture": {
  "source": "Use refined editorial architectural photography aesthetics with material clarity, natural tonal hierarchy and minimal stylization; preserve source framing.",
  "ru": "Использовать эстетику изысканной редакционной архитектурной фотографии: ясные материалы, естественная тональная иерархия и минимальная стилизация; сохранить исходное кадрирование."
 },
 "final-cleanup": {
  "source": "Remove generation artifacts, texture spill, halos, edge contamination and implausible local detail while preserving intended image content.",
  "ru": "Удалить артефакты генерации, выход текстуры за границы, ореолы, загрязнение кромок и неправдоподобные локальные детали, сохраняя задуманный состав изображения."
 },
 "asset-goal": {
  "source": "Create a photorealistic presentation image of a single {{object}} for a production brief. This is an image prompt, not a request for a generated 3D mesh.",
  "ru": "Создать фотореалистичное презентационное изображение одного объекта: {{object}}, для производственного задания. Это промпт для изображения, а не запрос на генерацию 3D-сетки.",
  "defaults": {
   "object": [
    "architectural lamp",
    "архитектурный светильник"
   ]
  }
 },
 "asset-reference": {
  "source": "Use the supplied object reference as the authority for design intent, silhouette, construction and proportions. Do not borrow unrelated objects or scenery.",
  "ru": "Считать предоставленный референс объекта эталоном замысла, силуэта, конструкции и пропорций. Не заимствовать посторонние объекты и окружение."
 },
 "asset-shape": {
  "source": "Preserve the referenced object silhouette, dimensions, proportions, component count, joints and construction details. Do not invent, remove or reposition parts.",
  "ru": "Сохранить силуэт объекта на референсе, размеры, пропорции, количество компонентов, соединения и конструктивные детали. Не придумывать, не удалять и не перемещать части."
 },
 "asset-material": {
  "source": "Present the object in {{material}} with physically plausible material response and true-scale surface detail. Keep the specified construction and shape unchanged.",
  "ru": "Показать объект с материалом {{material}}, физически правдоподобным поведением материала и деталями поверхности в натуральном масштабе. Оставить заданную конструкцию и форму без изменений.",
  "defaults": {
   "material": [
    "matte brushed brass",
    "матовая шлифованная латунь"
   ]
  }
 },
 "asset-view": {
  "source": "Show the complete object in {{view}} with believable perspective, consistent scale and no cropped parts.",
  "ru": "Показать объект целиком: {{view}}, с правдоподобной перспективой, согласованным масштабом и без обрезанных частей.",
  "defaults": {
   "view": [
    "a three-quarter product view",
    "предметный ракурс в три четверти"
   ]
  }
 },
 "asset-background": {
  "source": "Place the object against {{background}}. Avoid unrelated props, text and watermarks; retain a plausible contact shadow.",
  "ru": "Разместить объект на фоне: {{background}}. Избегать постороннего реквизита, текста и водяных знаков; сохранить правдоподобную контактную тень.",
  "defaults": {
   "background": [
    "a neutral graphite studio background",
    "нейтральный графитовый студийный фон"
   ]
  }
 },
 "asset-qc": {
  "source": "Compare with the object reference: identical silhouette, proportions, component count and construction; consistent material scale, readable surface detail, clean edges, complete framing and plausible light. Reject invented parts or shape drift.",
  "ru": "Сверить с референсом объекта: идентичный силуэт, пропорции, количество компонентов и конструкция; согласованный масштаб материала, читаемые детали поверхности, чистые кромки, полный объект в кадре и правдоподобный свет. Отклонить результат с придуманными частями или изменённой формой."
 }
});

// Translate the actual EN output, including frozen Saved Prompt text; never recompose it.
export function previewRu(text,library){
 let incomplete=false;
 const candidates=library.blocks.flatMap(b=>{const t=translationRu[b.id];if(!t||t.source!==b.text)return [];const keys=[];const parts=b.text.split(/(\{\{\w+\}\})/g);const pattern=parts.map(s=>{const m=s.match(/^\{\{(\w+)\}\}$/);if(m){keys.push(m[1]);return '(.*?)';}return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}).join('');return [{t,keys,pattern:new RegExp('^'+pattern+'$')}];});
 const translated=text.split('\n').map(line=>{if(!line)return '';if(sectionRu[line])return sectionRu[line];for(const c of candidates){const match=line.match(c.pattern);if(!match)continue;const values=Object.fromEntries(c.keys.map((k,i)=>[k,match[i+1]]));return c.t.ru.replace(/\{\{(\w+)\}\}/g,(_,key)=>{const pair=c.t.defaults?.[key],v=values[key];if(pair&&v===pair[0])return pair[1];incomplete=true;return `[EN: ${v}]`;});}incomplete=true;return `[EN: ${line}]`;}).join('\n');
 return {text:translated,incomplete};
}

Object.assign(translationRu,{
 "video-arch-goal": {
  "source": "Create a photorealistic architectural image-to-video shot lasting {{duration}} from the supplied image. Produce a single continuous shot, not a redesigned scene.",
  "ru": "Создать фотореалистичный архитектурный image-to-video кадр длительностью {{duration}} по предоставленному изображению. Один непрерывный план без перепроектирования сцены.",
  "defaults": {
   "duration": [
    "5 seconds",
    "5 секунд"
   ]
  }
 },
 "video-object-goal": {
  "source": "Create a photorealistic product image-to-video shot of the referenced object lasting {{duration}}. Keep the complete object readable in a single continuous shot.",
  "ru": "Создать фотореалистичный предметный image-to-video кадр объекта с референса длительностью {{duration}}. Объект должен оставаться целиком читаемым в одном непрерывном плане.",
  "defaults": {
   "duration": [
    "5 seconds",
    "5 секунд"
   ]
  }
 },
 "video-reference": {
  "source": "Use the supplied image as the first-frame authority for design, proportions, materials and lighting. Reveal only surfaces supported by the reference; do not invent unseen architecture or object parts.",
  "ru": "Считать предоставленное изображение эталоном первого кадра: замысла, пропорций, материалов и света. Показывать только поверхности, подтверждённые референсом; не придумывать невидимую архитектуру или части объекта.",
  "defaults": {}
 },
 "video-arch-preserve": {
  "source": "Preserve building proportions, floor count, facade openings, structural edges and the placement of all existing objects throughout the shot. Perspective may change only as a coherent result of the requested camera movement.",
  "ru": "Сохранить пропорции здания, этажность, проёмы фасада, конструктивные кромки и расположение всех существующих объектов на протяжении кадра. Перспектива меняется только согласованно с заданным движением камеры.",
  "defaults": {}
 },
 "video-motion": {
  "source": "Camera movement: {{movement}}. Use slow smooth physically coherent motion, stable perspective and gentle acceleration. No cuts, abrupt zooms, camera shake or movement revealing unsupported surfaces.",
  "ru": "Движение камеры: {{movement}}. Использовать медленное плавное физически согласованное движение, стабильную перспективу и мягкое ускорение. Без монтажных склеек, резких приближений, тряски камеры и раскрытия неподтверждённых поверхностей.",
  "defaults": {
   "movement": [
    "a subtle forward dolly",
    "небольшой плавный проезд вперёд"
   ]
  }
 },
 "video-stability": {
  "source": "Maintain temporal consistency of geometry, textures, lighting and object identity across every frame. No flicker, morphing, drifting openings, duplicated parts or spontaneous objects. Keep the source lighting stable unless explicitly requested otherwise. Reject frames with geometry drift or invented detail.",
  "ru": "Сохранять согласованность геометрии, текстур, света и узнаваемости объектов во всех кадрах. Без мерцания, превращений формы, плавающих проёмов, дублированных частей и самопроизвольных объектов. Сохранять исходный свет, если явно не задано иное. Отклонить кадры с изменением геометрии или придуманными деталями.",
  "defaults": {}
 }
});

Object.assign(translationRu,{
  "environment-extension": {
    "source": "Extend the environment only inside the supplied editable context mask. Preserve the primary building and all protected pixels; do not expand the canvas or change the camera.",
    "ru": "Дорисовать окружение только внутри предоставленной маски окружения. Сохранить основное здание и защищённые пиксели; не расширять холст и не менять камеру."
  },
  "context-description": {
    "source": "Add {{context}} within the editable region. Follow supplied site references and visible ground connections; keep the primary architecture as the visual priority.",
    "ru": "Добавить {{context}} в разрешённой области. Следовать референсам участка и видимым связям с землёй; основная архитектура остаётся главным объектом.",
    "defaults": {
      "context": [
        "restrained urban surroundings with distant neighboring buildings and planting",
        "сдержанное городское окружение с дальними соседними зданиями и озеленением"
      ]
    }
  },
  "perspective-scale-match": {
    "source": "Match added elements to the source horizon, vanishing directions, camera height, perspective and depth-dependent scale. Preserve existing lens projection and vertical-line treatment; ground every added object without shifting the source framing.",
    "ru": "Согласовать новые элементы с горизонтом, направлениями схода, высотой камеры, перспективой и масштабом по глубине исходника. Сохранить проекцию объектива и вертикали; поставить объекты на землю, не меняя кадрирование."
  },
  "match-source-lighting": {
    "source": "Match new context to the source light direction, shadow softness, color temperature and exposure. Add plausible contact shadows and local reflections; do not relight the protected architecture.",
    "ru": "Согласовать новое окружение с направлением света, мягкостью теней, цветовой температурой и экспозицией исходника. Добавить контактные тени и локальные отражения; не менять свет защищённой архитектуры."
  },
  "context-restrictions": {
    "source": "New context elements are permitted only inside the editable mask. Keep the primary building, openings, silhouette and protected site layout unchanged. Do not cover key entrances, invent signage or add text and watermarks.",
    "ru": "Новые элементы окружения разрешены только внутри маски. Сохранить основное здание, проёмы, силуэт и защищённую планировку участка. Не закрывать важные входы, не придумывать вывески, текст и водяные знаки."
  },
  "environment-qc": {
    "source": "Check added context against the source: coherent horizon and perspective, realistic scale, grounded objects, correct occlusions, matching light and clean mask edges. Reject changes to protected architecture or site boundaries.",
    "ru": "Проверить окружение: единый горизонт и перспектива, реалистичный масштаб, контакт с землёй, правильные перекрытия, согласованный свет и чистые границы маски. Отклонить изменения защищённой архитектуры и границ участка."
  },
  "night-windows": {
    "source": "Illuminate a restrained irregular selection of existing windows from plausible interior sources only. Preserve frames and openings; keep some rooms dark, retain glazing reflections and avoid uniform glowing facades or invented interior details.",
    "ru": "Осветить сдержанную нерегулярную часть существующих окон только правдоподобным внутренним светом. Сохранить рамы и проёмы; часть помещений оставить тёмной, сохранить отражения стекла, избегать равномерного свечения фасада и выдуманных деталей интерьера."
  },
  "night-street-sources": {
    "source": "Light the street and surrounding ground only from visible existing street poles and luminaires. Match each light pool and shadow to its fixture position and direction with natural falloff; do not add poles, fixtures or unsupported pools of light.",
    "ru": "Осветить улицу и землю только от видимых существующих столбов и светильников. Согласовать световые пятна и тени с положением и направлением источника, с естественным затуханием; не добавлять столбы, светильники и необоснованные пятна света."
  },
  "night-headlights": {
    "source": "Use headlights only on visible existing vehicles whose lamps face the scene. Align beams, road reflections and local illumination with vehicle orientation; preserve vehicle count and position. No floating beams, invented cars or excessive bloom.",
    "ru": "Использовать фары только видимых существующих автомобилей с подходящим направлением. Согласовать лучи, отражения дороги и локальный свет с ориентацией машины; сохранить количество и положение автомобилей. Без висящих лучей, новых машин и чрезмерного свечения."
  },
  "night-source-qc": {
    "source": "Trace every local light pool, cast shadow and reflection to a visible existing fixture, illuminated window or vehicle lamp. Keep unlit areas plausibly dark with restrained night ambient light; reject invented emitters, glowing surfaces and inconsistent shadows.",
    "ru": "Связать каждое локальное световое пятно, тень и отражение с существующим светильником, освещённым окном или фарой. Неосвещённые области оставить правдоподобно тёмными при сдержанном ночном фоновом свете; отклонить новые источники, светящиеся поверхности и неверные тени."
  },
  "add-people": {
    "source": "Add {{count}} new people only inside the supplied people insertion mask, with {{activity}}. Preserve existing people and architecture; use natural spacing and keep entrances and key facade details readable.",
    "ru": "Добавить {{count}} новых людей только внутри маски вставки, с действием: {{activity}}. Сохранить существующих людей и архитектуру; использовать естественные расстояния, не закрывать входы и важные детали фасада.",
    "defaults": {
      "count": [
        "two",
        "двух"
      ],
      "activity": [
        "casual walking",
        "спокойная ходьба"
      ]
    }
  },
  "people-integration": {
    "source": "Match added people to source perspective, depth-dependent scale, season and lighting. Place feet on the visible ground plane with believable contact shadows; use restrained everyday clothing and natural poses, without duplicating identities.",
    "ru": "Согласовать добавленных людей с перспективой, масштабом по глубине, сезоном и светом исходника. Поставить ступни на видимую землю с контактными тенями; использовать сдержанную повседневную одежду и естественные позы без повторения персонажей."
  },
  "add-people-qc": {
    "source": "Check the requested added-person count, anatomy, feet-ground contact, perspective, scale, shadows and occlusion. Reject floating feet, duplicated people, malformed limbs or changes outside the insertion mask.",
    "ru": "Проверить количество новых людей, анатомию, контакт ступней с землёй, перспективу, масштаб, тени и перекрытия. Отклонить висящие ступни, дубликаты, деформированные конечности и изменения вне маски."
  }
});

Object.assign(translationRu,{
  "added-snow-cover": {
    "source": "Add {{amount}} of settled snow only inside the supplied seasonal edit mask, with {{distribution}}. Follow existing ground contours and upward-facing surfaces. Preserve architecture, openings, curbs and site boundaries; keep entrances, walkways and vehicle access clear and readable. Do not add falling snow, reshape objects or conceal protected facade details.",
    "ru": "Добавить {{amount}} лежащего снега только внутри маски сезонного редактирования, с распределением: {{distribution}}. Следовать существующему рельефу земли и обращённым вверх поверхностям. Сохранить архитектуру, проёмы, бордюры и границы участка; входы, пешеходные пути и подъезды оставить расчищенными и читаемыми. Не добавлять падающий снег, не менять форму объектов и не скрывать защищённые детали фасада.",
    "defaults": {
      "amount": [
        "a light layer",
        "тонкий слой"
      ],
      "distribution": [
        "localized natural accumulation on lawns and exposed ground, with cleared paths",
        "локальные естественные скопления на газонах и открытой земле с расчищенными дорожками"
      ]
    }
  },
  "autumn-fallen-leaves": {
    "source": "Add {{amount}} of fallen autumn leaves only inside the supplied seasonal edit mask, with {{distribution}}. Match leaf species, size, perspective and source lighting to existing vegetation. Use irregular wind-shaped clusters rather than a uniform carpet. Preserve paving, curbs, drainage, entrances and road markings; do not add trees or cover protected architecture.",
    "ru": "Добавить {{amount}} опавших осенних листьев только внутри маски сезонного редактирования, с распределением: {{distribution}}. Согласовать вид, размер, перспективу и свет листьев с существующей растительностью. Использовать нерегулярные скопления по направлению ветра вместо равномерного ковра. Сохранить покрытие, бордюры, водоотвод, входы и дорожную разметку; не добавлять деревья и не закрывать защищённую архитектуру.",
    "defaults": {
      "amount": [
        "a sparse scattering",
        "небольшое количество"
      ],
      "distribution": [
        "small clusters near existing trees, along curb edges and on lawns, with clear entrances and walking routes",
        "небольшие скопления возле существующих деревьев, вдоль бордюров и на газонах, со свободными входами и пешеходными путями"
      ]
    }
  }
});

Object.assign(translationRu,{
  "first-last-goal": {
    "source": "Create a photorealistic architectural video lasting {{duration}} between the supplied first and last frames. Produce one continuous shot that starts at the first image and ends at the last image.",
    "ru": "Создать фотореалистичное архитектурное видео длительностью {{duration}} между предоставленными первым и последним кадрами. Один непрерывный план, начинающийся первым изображением и заканчивающийся последним.",
    "defaults": {
      "duration": [
        "5 seconds",
        "5 секунд"
      ]
    }
  },
  "first-last-reference": {
    "source": "Use the supplied first frame as the starting state and the supplied last frame as the target state. Both frames must depict the same architecture from the same camera with aligned framing, perspective and aspect ratio. Preserve their shared geometry; use the last frame only as authority for the explicitly requested changes. Do not invent unseen surfaces.",
    "ru": "Считать первый кадр начальным состоянием, а последний — целевым. Оба кадра должны показывать одну архитектуру с одной камеры, с согласованными кадрированием, перспективой и соотношением сторон. Сохранить общую геометрию; последний кадр задаёт только явно запрошенные изменения. Не придумывать невидимые поверхности.",
    "defaults": {}
  },
  "first-last-transition": {
    "source": "Transition description: {{transition}}. Change only the specified properties, progressively and coherently from the first-frame state to the last-frame state. Keep all other scene elements unchanged. Do not use a simple crossfade with doubled edges, sudden state changes, cuts or geometric morphing. Any lighting or seasonal change must follow the supplied endpoints without inventing intermediate objects.",
    "ru": "Описание перехода: {{transition}}. Менять только указанные свойства постепенно и согласованно от первого состояния к последнему. Остальные элементы сцены оставить неизменными. Без простого наложения кадров с двойными контурами, скачков состояния, склеек и изменения формы геометрии. Изменение света или сезона должно следовать опорным кадрам без придуманных промежуточных объектов.",
    "defaults": {
      "transition": [
        "a gradual lighting change from the first frame to the last frame",
        "постепенное изменение освещения от первого кадра к последнему"
      ]
    }
  },
  "first-last-camera": {
    "source": "Keep the camera locked throughout the transition: identical position, focal length, framing, horizon and perspective in every frame. No dolly, pan, orbit, zoom, shake or reframing. Reject mismatched endpoint cameras rather than inventing a camera path.",
    "ru": "Зафиксировать камеру на протяжении перехода: одинаковые положение, фокусное расстояние, кадрирование, горизонт и перспектива во всех кадрах. Без проезда, панорамирования, облёта, приближения, тряски и смены кадрирования. Несовпадающие камеры опорных кадров требуют исправления исходников, а не придуманной траектории.",
    "defaults": {}
  }
});


Object.assign(translationRu,{
  "material-id-goal": {
    "source": "Convert the supplied architectural render into a flat Material ID map for masking and downstream editing.",
    "ru": "Преобразовать предоставленный архитектурный рендер в плоскую карту Material ID для создания масок и последующего редактирования."
  },
  "material-id-preserve": {
    "source": "Preserve the exact source camera, silhouette, object boundaries, window openings, frames, curbs, paving borders, vegetation silhouettes and all visible architectural edges. Do not move, add, remove or redesign geometry.",
    "ru": "Точно сохранить исходную камеру, силуэт, границы объектов, оконные проёмы, рамы, бордюры, границы мощения, силуэты растительности и все видимые архитектурные контуры. Не перемещать, не добавлять, не удалять и не перепроектировать геометрию."
  },
  "material-id-rules": {
    "source": "Assign one solid flat RGB color to each visually distinct material or surface class. Use the same color for the same material across light, shadow and repeated disconnected regions. Use different colors for different materials or surface classes.",
    "ru": "Назначить каждому визуально различимому материалу или классу поверхности один сплошной плоский RGB-цвет. Использовать один и тот же цвет для одного материала в освещённых, затенённых и разнесённых областях. Для разных материалов или классов поверхностей использовать разные цвета."
  },
  "material-id-classes": {
    "source": "Separate facade materials, glazing/windows, window and door frames, roof, metal, wood, concrete, stone, brick, road, paving, curb, vegetation, sky, water and people when visibly present. Keep distinct facade materials separate even when they belong to the same building.",
    "ru": "Разделять материалы фасада, остекление и окна, оконные и дверные рамы, кровлю, металл, дерево, бетон, камень, кирпич, дорогу, мощение, бордюр, растительность, небо, воду и людей, если они видимы. Разные материалы фасада должны оставаться отдельными даже в пределах одного здания."
  },
  "material-id-restrictions": {
    "source": "Output only the flat Material ID map. No textures, lighting, shadows, gradients, reflections, glare, ambient occlusion, photographic detail, outlines, labels, text, legends, watermarks or decorative effects. Do not invent hidden materials.",
    "ru": "Вывести только плоскую карту Material ID. Без текстур, освещения, теней, градиентов, отражений, бликов, ambient occlusion, фотографических деталей, контуров, подписей, текста, легенд, водяных знаков и декоративных эффектов. Не придумывать скрытые материалы."
  },
  "material-id-qc": {
    "source": "Check that every pixel belongs to a clean flat region, repeated instances of the same material use the same RGB color, adjacent different materials use clearly different colors, and region boundaries match the source render without geometry drift.",
    "ru": "Проверить, что каждый пиксель относится к чистой плоской области, повторяющиеся участки одного материала используют один и тот же RGB-цвет, соседние разные материалы имеют явно различающиеся цвета, а границы областей совпадают с исходным рендером без дрейфа геометрии."
  }
});
