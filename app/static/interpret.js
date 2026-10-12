// 풀이 엔진: 만세력 데이터 -> 화면에 쓸 구조 + 해석 문장.
// 전통 명리 이론의 일반적인 해석을 규칙으로 옮긴 것 (재미·참고용). 화면 코드는 app.js.

// ================= 기본 상수 =================
const ELEMENTS = ["목", "화", "토", "금", "수"];
const ELEMENT_HANJA = { 목: "木", 화: "火", 토: "土", 금: "金", 수: "水" };
const GENERATES = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" }; // 상생
const CONTROLS = { 목: "토", 토: "수", 수: "화", 화: "금", 금: "목" }; // 상극
const STEM_ELEMENT = { 갑: "목", 을: "목", 병: "화", 정: "화", 무: "토", 기: "토", 경: "금", 신: "금", 임: "수", 계: "수" };

const TEN_GOD_ORDER = ["비견", "겁재", "식신", "상관", "편재", "정재", "편관", "정관", "편인", "정인"];
const TEN_GOD_GROUP = {
  비견: "비겁", 겁재: "비겁", 식신: "식상", 상관: "식상", 편재: "재성",
  정재: "재성", 편관: "관성", 정관: "관성", 편인: "인성", 정인: "인성",
};
const GROUP_LABEL = { 비겁: "비겁 · 나와 동료", 식상: "식상 · 표현과 재능", 재성: "재성 · 돈과 결과", 관성: "관성 · 책임과 명예", 인성: "인성 · 배움과 도움" };

const PILLARS = [
  { key: "_세차", idx: 0, label: "년주" },
  { key: "_월건", idx: 1, label: "월주" },
  { key: "_일진", idx: 2, label: "일주" },
  { key: "_시진", idx: 3, label: "시주" },
];

const BRANCH_ANIMAL = { 자: "쥐", 축: "소", 인: "호랑이", 묘: "토끼", 진: "용", 사: "뱀", 오: "말", 미: "양", 신: "원숭이", 유: "닭", 술: "개", 해: "돼지" };
const ELEMENT_COLOR_WORD = { 목: "푸른", 화: "붉은", 토: "황금", 금: "하얀", 수: "검은" };
const CLASH = [["자", "오"], ["축", "미"], ["인", "신"], ["묘", "유"], ["진", "술"], ["사", "해"]];
const COMBINE = [["자", "축"], ["인", "해"], ["묘", "술"], ["진", "유"], ["사", "신"], ["오", "미"]];
const pairHas = (pairs, a, b) => pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
const SAMJAE = [
  { 띠: ["신", "자", "진"], years: ["인", "묘", "진"] },
  { 띠: ["인", "오", "술"], years: ["신", "유", "술"] },
  { 띠: ["사", "유", "축"], years: ["해", "자", "축"] },
  { 띠: ["해", "묘", "미"], years: ["사", "오", "미"] },
];
// 천을귀인: 일간 -> 귀인 지지
const CHEONEUL = { 갑: ["축", "미"], 무: ["축", "미"], 경: ["축", "미"], 을: ["자", "신"], 기: ["자", "신"], 병: ["해", "유"], 정: ["해", "유"], 임: ["사", "묘"], 계: ["사", "묘"], 신: ["인", "오"] };

// ================= 해석 사전 =================
const ELEMENT_INFO = {
  목: { nature: "나무", keys: "성장 · 시작 · 인자함", trait: "새로운 일을 시작하고 키워 가는 힘이에요. 계획하고 배우며 뻗어 나가려는 성향과 연결돼요.",
    much: "나무 기운이 넘쳐 의욕과 계획이 많아요. 일을 많이 벌이니 하나씩 마무리하는 습관이 필요해요.",
    good: "나무 기운이 잘 발달해 성장하려는 힘과 추진력이 좋아요.",
    ok: "나무 기운이 알맞게 있어 시작과 성장의 균형이 좋아요.",
    lack: "나무 기운이 약해 새로운 시작이 망설여질 수 있어요. 배우고 성장하는 활동이 힘이 돼요.", organ: "간·눈·근육" },
  화: { nature: "불", keys: "열정 · 표현 · 예의", trait: "밝게 드러내고 표현하는 힘이에요. 열정, 활력, 사람들 앞에 서는 기운과 연결돼요.",
    much: "불 기운이 넘쳐 열정과 표현력이 강해요. 마음이 급해지기 쉬우니 쉬어 가는 연습을 하세요.",
    good: "불 기운이 잘 발달해 밝고 표현력이 좋아요.",
    ok: "불 기운이 알맞게 있어 열정과 차분함의 균형이 좋아요.",
    lack: "불 기운이 약해 감정 표현을 아끼는 편이에요. 햇빛, 운동, 사람들과의 만남이 활력을 줘요.", organ: "심장·혈압" },
  토: { nature: "흙", keys: "안정 · 신뢰 · 중재", trait: "중심을 잡고 버티는 힘이에요. 믿음직함, 꾸준함, 사람 사이를 잇는 기운과 연결돼요.",
    much: "흙 기운이 넘쳐 신중하고 고집이 있어요. 변화가 필요할 땐 작은 것부터 바꿔 보세요.",
    good: "흙 기운이 잘 발달해 믿음직하고 꾸준해요.",
    ok: "흙 기운이 알맞게 있어 안정감이 좋아요.",
    lack: "흙 기운이 약해 중심을 잡기 어려울 수 있어요. 규칙적인 생활 습관이 큰 힘이 돼요.", organ: "위장·소화기" },
  금: { nature: "쇠", keys: "결단 · 원칙 · 정리", trait: "맺고 끊는 힘이에요. 판단력, 원칙, 정리정돈하는 기운과 연결돼요.",
    much: "쇠 기운이 넘쳐 원칙이 강하고 판단이 날카로워요. 말할 때 한 번 더 부드럽게 다듬어 보세요.",
    good: "쇠 기운이 잘 발달해 결단력과 정리하는 힘이 좋아요.",
    ok: "쇠 기운이 알맞게 있어 판단과 유연함의 균형이 좋아요.",
    lack: "쇠 기운이 약해 결정하고 정리하는 걸 어려워할 수 있어요. 마감과 기준을 정해 두면 좋아요.", organ: "폐·호흡기·피부" },
  수: { nature: "물", keys: "지혜 · 유연함 · 휴식", trait: "스며들고 흐르는 힘이에요. 지혜, 생각, 적응력, 쉼과 연결돼요.",
    much: "물 기운이 넘쳐 생각과 상상이 많아요. 걱정이 꼬리를 물면 몸을 움직여 보세요.",
    good: "물 기운이 잘 발달해 생각이 깊고 유연해요.",
    ok: "물 기운이 알맞게 있어 생각과 행동의 균형이 좋아요.",
    lack: "물 기운이 약해 쉼 없이 달리기 쉬워요. 충분한 잠과 혼자만의 시간이 필요해요.", organ: "신장·방광·허리" },
};

const STEM_INFO = {
  갑: { image: "곧게 뻗은 큰 나무", trait: "곧고 우직하며 앞장서서 길을 여는 리더형이에요. 한번 정한 목표는 끝까지 밀고 나가요.", care: "자존심이 강해 굽히기 어려울 때가 있어요." },
  을: { image: "들풀과 꽃", trait: "부드럽고 적응력이 뛰어나요. 어떤 환경에서도 살아남는 끈기와 사람 사이를 잇는 친화력이 있어요.", care: "남의 눈치를 많이 보거나 결정을 미룰 수 있어요." },
  병: { image: "하늘의 태양", trait: "밝고 솔직하며 열정적이에요. 있는 것만으로 분위기를 살리고 사람들을 끌어당겨요.", care: "마음이 급하고 쉽게 달아올랐다 식을 수 있어요." },
  정: { image: "어둠을 밝히는 촛불", trait: "따뜻하고 섬세하며 배려심이 깊어요. 한 가지에 깊이 몰입하는 집중력이 있어요.", care: "예민해서 속으로 끙끙 앓기 쉬워요." },
  무: { image: "든든한 큰 산", trait: "믿음직하고 포용력이 커요. 주변 사람들이 기대고 싶어 하는 중심 같은 존재예요.", care: "변화에 느리고 고집스러워 보일 수 있어요." },
  기: { image: "곡식을 키우는 논밭", trait: "실속 있고 다정해요. 사람이나 일을 차근차근 키워 내는 힘이 있어요.", care: "걱정이 많고 의심이 생기기 쉬워요." },
  경: { image: "단단한 바위", trait: "결단력과 의리가 있어요. 맺고 끊음이 분명하고 추진력이 강해요.", care: "말이 직설적이라 의도보다 날카롭게 들릴 수 있어요." },
  신: { image: "빛나는 보석", trait: "섬세하고 깔끔하며 자기 기준이 분명해요. 감각이 좋고 완성도를 중요하게 여겨요.", care: "완벽주의 때문에 스스로를 몰아붙이기 쉬워요." },
  임: { image: "넓은 바다", trait: "스케일이 크고 지혜로워요. 자유로운 생각과 넓은 시야로 큰 그림을 그려요.", care: "관심사가 자주 바뀌거나 방향을 잃기 쉬워요." },
  계: { image: "땅을 적시는 비", trait: "직관이 뛰어나고 조용히 스며드는 영향력이 있어요. 상대의 마음을 잘 읽어요.", care: "생각이 많아 걱정으로 이어지기 쉬워요." },
};

const BRANCH_INFO = {
  자: { time: "한겨울 · 밤 23~1시", trait: "영리하고 재치 있으며 적응이 빨라요." },
  축: { time: "늦겨울 · 새벽 1~3시", trait: "성실하고 인내심이 강해 묵묵히 해내요." },
  인: { time: "초봄 · 새벽 3~5시", trait: "용기와 추진력이 있고 앞장서기를 좋아해요." },
  묘: { time: "한봄 · 아침 5~7시", trait: "온화하고 감성이 풍부하며 섬세해요." },
  진: { time: "늦봄 · 아침 7~9시", trait: "포부가 크고 이상을 향해 나아가요." },
  사: { time: "초여름 · 오전 9~11시", trait: "지혜롭고 열정적이며 눈치가 빨라요." },
  오: { time: "한여름 · 낮 11~13시", trait: "활동적이고 솔직하며 에너지가 넘쳐요." },
  미: { time: "늦여름 · 오후 13~15시", trait: "온순하고 끈기 있으며 정이 많아요." },
  신: { time: "초가을 · 오후 15~17시", trait: "재주가 많고 임기응변에 강해요." },
  유: { time: "한가을 · 저녁 17~19시", trait: "깔끔하고 예리하며 완성도를 중시해요." },
  술: { time: "늦가을 · 저녁 19~21시", trait: "충직하고 의리 있으며 책임감이 강해요." },
  해: { time: "초겨울 · 밤 21~23시", trait: "너그럽고 순수하며 복이 많아요." },
};

const TEN_GOD_INFO = {
  비견: { key: "자립 · 주관", body: "나와 같은 기운이에요. 주관이 뚜렷하고 독립적이며, 동료·형제·친구와 연결돼요.", many: "많으면 고집이 세고 경쟁이 잦을 수 있어요.", none: "없으면 혼자 버티기보다 함께할 때 힘이 나요." },
  겁재: { key: "승부욕 · 추진", body: "나와 같은 오행이지만 음양이 다른 기운이에요. 승부욕과 추진력, 경쟁심과 연결돼요.", many: "많으면 충동적인 지출이나 손해를 조심해야 해요.", none: "없으면 경쟁보다 조화를 선호해요." },
  식신: { key: "표현 · 여유 · 먹을 복", body: "내가 만들어 내는 기운이에요. 재능을 꾸준히 펼치는 힘, 여유와 먹을 복을 뜻해요.", many: "많으면 여유가 지나쳐 느긋해질 수 있어요.", none: "없으면 생각을 밖으로 꺼내는 연습이 도움이 돼요." },
  상관: { key: "말재주 · 창의 · 개성", body: "틀을 깨는 표현력이에요. 말재주, 창의력, 날카로운 감각과 연결돼요.", many: "많으면 말실수나 윗사람과의 마찰을 조심해야 해요.", none: "없으면 규칙 안에서 차분히 움직이는 편이에요." },
  편재: { key: "사업 감각 · 활동력", body: "내가 다스리는 큰 재물이에요. 사업 감각, 활동력, 넓은 인맥과 연결돼요.", many: "많으면 일을 크게 벌이거나 바빠지기 쉬워요.", none: "없으면 큰 한 방보다 꾸준함이 맞아요." },
  정재: { key: "성실 · 꼼꼼한 재물", body: "차곡차곡 모으는 재물이에요. 성실함, 꼼꼼한 관리, 현실 감각과 연결돼요.", many: "많으면 지나치게 계산적이거나 소심해질 수 있어요.", none: "없으면 돈 관리에 계획을 세우면 좋아요." },
  편관: { key: "카리스마 · 도전", body: "나를 강하게 다스리는 기운이에요. 카리스마, 위기 극복, 도전 정신과 연결돼요.", many: "많으면 압박감과 스트레스가 커질 수 있어요.", none: "없으면 자유롭게 움직이는 걸 좋아해요." },
  정관: { key: "원칙 · 명예 · 책임", body: "나를 바르게 이끄는 기운이에요. 원칙, 명예, 책임감, 조직 생활과 연결돼요.", many: "많으면 틀에 갇혀 답답해질 수 있어요.", none: "없으면 스스로 정한 규칙이 도움이 돼요." },
  편인: { key: "직관 · 독특한 생각", body: "나를 돕는 특별한 기운이에요. 직관, 독창성, 전문 기술과 연결돼요.", many: "많으면 생각이 많고 변덕스러워질 수 있어요.", none: "없으면 머리보다 경험으로 배우는 타입이에요." },
  정인: { key: "학문 · 인자함 · 도움", body: "나를 감싸 주는 기운이에요. 배움, 인자함, 어머니, 문서·자격과 연결돼요.", many: "많으면 기대거나 미루는 습관을 조심해야 해요.", none: "없으면 스스로 길을 개척하는 힘이 있어요." },
};

const PILLAR_INFO = [
  { stage: "초년기 (태어나서 ~ 청소년)", area: "조상과 집안", extra: "사회가 처음 보는 나의 인상도 나타내요." },
  { stage: "청년기 (20 ~ 30대)", area: "부모·형제와 사회 환경", extra: "직업과 적성의 중심이 되는 자리예요." },
  { stage: "중년기 (40 ~ 50대)", area: "나 자신과 배우자", extra: "천간은 '나', 지지는 '배우자 자리'예요." },
  { stage: "말년기 (60대 ~)", area: "자녀와 미래 계획", extra: "아랫사람과 노후의 모습도 나타내요." },
];

const UNSEONG_INFO = {
  장생: "새로 태어나 자라기 시작하는 기운이에요. 배움이 빠르고 사랑받는 힘이 있어요.",
  목욕: "세상에 처음 나와 씻는 시기예요. 호기심과 멋, 감각이 살아 있어요.",
  관대: "옷을 갖춰 입고 사회로 나가는 시기예요. 자신감과 의욕이 넘쳐요.",
  건록: "자리를 잡고 실력을 인정받는 시기예요. 성실하고 자립심이 강해요.",
  제왕: "기운이 가장 왕성한 정점이에요. 리더십과 추진력이 강해요.",
  쇠: "정점을 지나 노련해지는 시기예요. 경험이 많고 신중해요.",
  병: "힘을 빼고 감성이 깊어지는 시기예요. 배려심과 상상력이 풍부해요.",
  사: "움직임을 멈추고 생각하는 시기예요. 깊이 연구하는 힘이 있어요.",
  묘: "창고에 갈무리하는 시기예요. 모으고 집중하는 힘이 있어요.",
  절: "끊어지고 새로 시작하는 시기예요. 변화에 강하고 결단이 빨라요.",
  태: "새 생명이 깃드는 시기예요. 가능성이 크고 순수해요.",
  양: "품 안에서 길러지는 시기예요. 보살핌을 받고 차분히 준비해요.",
};

const STAR_INFO = {
  천을귀인: "어려울 때 귀인이 나타나 도와주는 가장 좋은 길성이에요.",
  천덕귀인: "하늘의 덕으로 위기를 무사히 넘기는 복이 있어요.",
  월덕귀인: "주변의 덕을 입어 큰 탈 없이 지나가는 복이에요.",
  문창귀인: "글과 공부에 재능이 있어 학업·시험에 유리해요.",
  문곡귀인: "학문과 예술 감각이 뛰어나요.",
  학당귀인: "배우는 머리가 좋아 공부로 빛을 봐요.",
  태극귀인: "끝까지 지켜 주는 복이 있어 시작한 일을 잘 마무리해요.",
  복성귀인: "먹고사는 복, 타고난 복이 있어요.",
  천주귀인: "먹을 복과 사람 복이 있어요.",
  천관귀인: "명예와 직장에 복이 있어요.",
  천복귀인: "하늘이 내린 복으로 생활이 넉넉해요.",
  관귀학관: "공부한 것이 직업과 명예로 이어져요.",
  정록: "평생 먹고살 걱정이 적은 안정된 복이에요.",
  암록: "보이지 않는 곳에서 도움을 받는 숨은 복이에요.",
  협록: "주변 사람 덕분에 재물이 들어와요.",
  금여성: "좋은 배우자 복과 품위가 있어요.",
  천문성: "직관과 영감이 뛰어나 교육·상담·의료 쪽에 잘 맞아요.",
  천의성: "남을 돌보고 치유하는 재능이 있어요.",
  월공: "욕심을 비우면 오히려 일이 잘 풀려요.",
  도화살: "사람을 끄는 매력이 있어요. 인기와 연애운이 강해요.",
  홍염살: "분위기 있는 매력으로 이성의 마음을 끌어요.",
  역마살: "이동과 변화가 많아요. 여행·해외·활동적인 일과 잘 맞아요.",
  화개살: "예술·학문·종교처럼 혼자 깊이 파고드는 분야에 재능이 있어요.",
  양인살: "강한 추진력과 승부욕이 있어요. 성급함만 조심하면 큰 힘이 돼요.",
  현침살: "예리한 감각과 손재주가 있어요. 의료·기술·디자인과 잘 맞고, 말이 날카로워지지 않게 조심하면 좋아요.",
  백호살: "강한 에너지를 가졌어요. 다치지 않게 조심하고 그 힘을 일에 쓰면 좋아요.",
  괴강살: "카리스마와 리더십이 강해요. 고집은 조금 내려놓으세요.",
  귀문관살: "감수성과 직관이 아주 예민해요. 예술적 재능이 있지만 스트레스 관리가 필요해요.",
  원진살: "사소한 일로 서운함이 생기기 쉬워요. 대화로 풀면 괜찮아요.",
  고신살: "혼자만의 시간이 필요한 독립적인 성향이에요.",
  과숙살: "혼자서도 잘 지내는 독립적인 성향이에요.",
  급각살: "발·다리를 다치지 않게 조심하라는 뜻이에요.",
  겁살: "갑자기 잃는 일을 조심하라는 뜻이지만, 반대로 강한 돌파력이기도 해요.",
  재살: "구설이나 갈등에 휘말리지 않게 조심하라는 뜻이에요.",
  천살: "내 힘으로 어쩔 수 없는 일엔 겸손하게 대처하라는 뜻이에요.",
  지살: "이동과 새 출발의 기운이에요.",
  년살: "도화살과 같은 뜻으로 매력과 인기가 있어요.",
  월살: "일이 막힐 때는 서두르지 말고 때를 기다리라는 뜻이에요.",
  망신살: "실수로 체면이 상하지 않게 말과 행동을 조심하라는 뜻이에요.",
  장성살: "무리를 이끄는 리더의 기운이에요.",
  반안살: "안정과 승진, 편안하게 자리 잡는 기운이에요.",
  육해살: "몸과 마음의 피로를 잘 챙기라는 뜻이에요.",
};
const isGuiin = (n) => n.endsWith("귀인") || ["관귀학관", "정록", "암록", "협록", "금여성", "천문성", "천의성", "월공"].includes(n);

// 올해·이번 달 기운(십성 그룹)별 풀이. [점수 보정, 문장]
const GROUP_YEAR = {
  비겁: { short: "자신감과 독립심이 커지는", total: "나와 같은 기운이 들어와 자신감과 독립심이 커지는 해예요. 새로운 사람을 많이 만나고 스스로 결정해서 밀고 나갈 일이 생겨요.",
    love: [0, "친구처럼 편한 인연이 생기기 쉬워요. 연인과는 자존심 대결을 피하세요."], money: [-1, "돈이 들어오는 만큼 나가기도 쉬워요. 돈을 빌려주거나 함께 투자하는 일은 신중하게 하세요."],
    work: [0, "스스로 주도하는 일에서 힘을 내요. 협업에서는 역할 분담을 분명히 하세요."], people: [1, "사람을 많이 만나고 모임이 늘어요. 경쟁자도 생기니 비교는 내려놓으세요."],
    caution: "고집이 세져 주변과 부딪히기 쉬워요. 돈 거래와 보증은 피하세요.", month: "사람이 모이는 달 · 지출 조심", daeun: "내 힘으로 영역을 넓혀 가는 10년",
    period: "자신감과 독립심이 커지는 시기예요. 스스로 결정하고 밀고 나갈 일이 많아져요." },
  식상: { short: "표현과 아이디어가 빛나는", total: "하고 싶은 말과 아이디어가 많아지는 해예요. 표현하고 만들고 보여 주는 일에서 성과가 나요.",
    love: [1, "표현력이 좋아져 마음을 전하기 좋아요. 호감이 있다면 먼저 다가가 보세요."], money: [1, "재능과 아이디어가 돈으로 이어지는 해예요. 작은 부업이나 도전이 성과를 낼 수 있어요."],
    work: [0, "기획·발표·창작에 강해요. 지루한 반복 업무는 계획표로 버티세요."], people: [0, "분위기를 띄우는 역할을 맡아요. 말실수만 조심하면 인기가 올라가요."],
    caution: "말이 앞서 실수하거나 윗사람과 부딪히기 쉬워요. 말하기 전에 한 번 더 생각하세요.", month: "아이디어와 표현이 빛나는 달", daeun: "재능을 마음껏 펼치는 10년",
    period: "재능과 표현력이 꽃피는 시기예요. 만들고 보여 주는 일에서 성과가 나요." },
  재성: { short: "성과와 돈의 흐름이 활발한", total: "눈에 보이는 결과와 성과를 쫓게 되는 해예요. 바쁘게 움직이는 만큼 얻는 것도 많아요.",
    love: [0, "적극적으로 다가가면 좋은 반응을 얻어요. 바쁘다고 연락을 소홀히 하지 마세요."], money: [1, "돈의 흐름이 활발해지는 해예요. 수입이 늘 기회가 있지만 씀씀이도 커질 수 있어요."],
    work: [0, "실적과 결과로 평가받는 일에 강해요. 공부는 목표 점수를 정해야 집중이 돼요."], people: [0, "실속 있는 인맥이 생겨요. 이해관계가 얽힌 부탁은 신중하게."],
    caution: "욕심을 부리다 무리하기 쉬워요. 체력과 일정 관리에 신경 쓰세요.", month: "바쁘지만 성과가 나는 달", daeun: "성과와 재물을 쌓아 가는 10년",
    period: "현실적인 성과와 재물을 쌓는 시기예요. 바쁘게 움직이는 만큼 얻는 것이 많아요." },
  관성: { short: "책임과 인정받을 기회가 커지는", total: "책임과 역할이 커지는 해예요. 시험·평가·승진처럼 실력을 인정받을 기회가 와요.",
    love: [0, "진지한 만남이 이어지기 좋아요. 신뢰를 쌓으면 관계가 깊어져요."], money: [0, "큰돈보다는 안정적인 수입이 들어오는 해예요. 계획적으로 관리하면 좋아요."],
    work: [1, "시험·면접·승진 운이 좋아요. 규칙적으로 준비하면 결과가 잘 나와요."], people: [0, "윗사람과의 관계가 중요해져요. 예의와 약속을 지키면 인정받아요."],
    caution: "부담과 스트레스가 쌓이기 쉬워요. 혼자 다 떠안지 말고 쉬는 시간을 챙기세요.", month: "책임과 평가가 따르는 달", daeun: "책임과 자리를 얻어 가는 10년",
    period: "책임과 역할이 커지는 시기예요. 실력을 인정받고 자리를 잡아 가요." },
  인성: { short: "배움과 도움이 따르는", total: "배우고 준비하기 좋은 해예요. 도와주는 사람이 생기고 공부·자격증·계약 같은 문서에 좋은 일이 있어요.",
    love: [0, "편안하게 기댈 수 있는 사람을 만나요. 먼저 마음을 열면 관계가 따뜻해져요."], money: [0, "당장 큰돈보다는 계약·자격처럼 나중에 돈이 되는 것을 얻어요."],
    work: [2, "공부운이 가장 좋은 해예요. 이해력과 집중력이 올라 공부한 만큼 성과가 나요."], people: [1, "도와주는 귀인이 나타나요. 필요할 땐 망설이지 말고 도움을 청하세요."],
    caution: "생각이 많아져 시작을 미루기 쉬워요. 고민보다 실행을 먼저 해 보세요.", month: "공부하고 정리하기 좋은 달", daeun: "배우고 기반을 다지는 10년",
    period: "배우고 실력을 쌓는 시기예요. 도와주는 사람이 많고 기반이 단단해져요." },
};

// 오늘의 기운(일진 천간의 십성 그룹)별 풀이
const DAY_TEXT = {
  비겁: { title: "주도하는 날", summary: "내 뜻대로 밀고 나가기 좋은 날이에요. 사람을 많이 만나고 의견을 낼 일이 생겨요.",
    work: "앞장서서 이끌면 성과가 나요.", money: "지출이 생기기 쉬우니 충동구매는 조심하세요.", love: "친구 같은 편안한 대화가 잘 통해요.", people: "자존심 대결은 피하고 먼저 양보해 보세요.",
    todo: "운동, 모임 주도하기", avoid: "돈 빌려주기, 보증" },
  식상: { title: "표현하는 날", summary: "말과 아이디어가 술술 나오는 날이에요. 보여 주고 표현하는 일에 운이 따라요.",
    work: "기획·발표·글쓰기에 좋아요.", money: "재능이 돈이 되는 작은 기회가 있어요.", love: "마음을 표현하면 좋은 반응이 와요.", people: "농담 수위와 말실수만 조심하세요.",
    todo: "창작, 발표, 맛있는 음식 먹기", avoid: "윗사람에게 반박하기" },
  재성: { title: "결과를 챙기는 날", summary: "현실적인 성과를 챙기기 좋은 날이에요. 바쁘게 움직인 만큼 얻는 게 있어요.",
    work: "마감·정산·실적 정리에 좋아요.", money: "돈 흐름이 활발해요. 계획한 소비만 하세요.", love: "적극적으로 다가가면 좋은 반응이 와요.", people: "바빠서 약속을 잊지 않게 챙기세요.",
    todo: "가계부·일정 정리", avoid: "무리한 욕심, 충동 투자" },
  관성: { title: "인정받는 날", summary: "책임감 있게 움직이면 인정받는 날이에요. 맡은 일을 꼼꼼히 마무리해 보세요.",
    work: "보고·시험·면접에 좋아요.", money: "정해 둔 예산을 지키면 좋아요.", love: "진지한 대화로 신뢰가 쌓여요.", people: "예의와 약속이 특히 중요한 날이에요.",
    todo: "계획표 정리, 단정한 옷차림", avoid: "지각, 규칙 어기기" },
  인성: { title: "채우는 날", summary: "배우고 생각을 정리하기 좋은 날이에요. 도움을 청하면 귀인이 나타나요.",
    work: "공부·자료조사·문서 작업에 좋아요.", money: "계약서·서류는 꼼꼼히 읽어 보세요.", love: "편안하게 기대고 위로받기 좋아요.", people: "조언을 구하면 좋은 답을 얻어요.",
    todo: "독서, 강의 듣기, 충분한 휴식", avoid: "고민만 하다 미루기" },
};

const BOOST = {
  목: { color: "초록 · 청록", dir: "동쪽", food: "신맛, 푸른 채소", nums: "3, 8", act: "아침 산책, 식물 돌보기, 새로운 공부", item: "화분, 나무 소품" },
  화: { color: "빨강 · 주황", dir: "남쪽", food: "쓴맛, 붉은 과일", nums: "2, 7", act: "햇볕 쬐기, 땀 나는 운동, 사람 만나기", item: "따뜻한 조명, 캔들" },
  토: { color: "노랑 · 베이지", dir: "중앙", food: "단맛, 곡물·고구마", nums: "5, 10", act: "규칙적인 생활, 등산, 꾸준한 저축", item: "도자기, 흙 소품" },
  금: { color: "흰색 · 은색", dir: "서쪽", food: "매운맛, 무·배·도라지", nums: "4, 9", act: "정리정돈, 계획표 쓰기, 악기·운동 연습", item: "금속 액세서리, 시계" },
  수: { color: "검정 · 남색", dir: "북쪽", food: "짠맛, 검은콩·미역", nums: "1, 6", act: "충분한 수면, 독서와 명상, 물가 산책", item: "어항, 물 소품" },
};

const CAUTION_STARS = {
  양인살: "양인살이 있어 급하게 결정하거나 다투기 쉬워요. 큰 결정은 하루 미뤄 보세요.",
  백호살: "백호살이 있어 다치지 않게 조심하세요. 운전·운동할 때 안전을 챙기세요.",
  괴강살: "괴강살이 있어 고집이 강하게 나올 수 있어요. 한 발 물러서는 여유가 필요해요.",
  현침살: "현침살이 있어 말이 날카로워지기 쉬워요. 부드러운 표현을 골라 보세요.",
  망신살: "망신살이 있어 실수로 체면이 상하지 않게 말과 행동을 조심하세요.",
  귀문관살: "귀문관살이 있어 예민해지기 쉬워요. 스트레스를 그때그때 풀어 주세요.",
};

// ================= 유틸 =================
function josa(word, withBatchim, without) {
  const ch = [...String(word)].reverse().find((c) => c >= "가" && c <= "힣");
  const has = ch && (ch.charCodeAt(0) - 0xac00) % 28 !== 0;
  return word + (has ? withBatchim : without);
}
const unique = (arr) => arr.filter((x, i) => arr.indexOf(x) === i);
const elId = (el) => ELEMENTS.indexOf(el);
// 내부 점수(대략 1~5) -> 0~100 지수
const toIndex = (raw) => Math.max(8, Math.min(98, Math.round(raw * 20 - 5)));
const indexLabel = (v) => (v >= 80 ? "아주 좋음" : v >= 65 ? "좋음" : v >= 45 ? "보통" : v >= 30 ? "주의" : "조심");
const dayLabel = (v) => (v >= 80 ? "아주 좋은 날" : v >= 65 ? "좋은 날" : v >= 45 ? "무난한 날" : v >= 30 ? "조심하는 날" : "쉬어 가는 날");

// ================= 분석 =================
function analyze(data) {
  const s = data.sections;
  const profile = data.profile || {};
  const unknown = !!profile.hmUnsure; // 시간 모름: 시주는 API의 임시값이라 쓰지 않음
  const gender = profile.gender;
  const todayDate = data.today?.date ? new Date(data.today.date + "T12:00:00") : new Date();
  const year = todayDate.getFullYear();
  const month = todayDate.getMonth() + 1;

  // ---------- 원국 ----------
  const chart = s["사주명식"]._기본명식;
  const sinsal12 = s["사주명식"]._신살 || {};
  const gilhyung = s["길흉성"].길흉 || {};
  const pillars = PILLARS.map((p) => {
    const d = chart[p.key];
    if (!d || (unknown && p.idx === 3)) return { ...p, unknown: true };
    const part = (x) => ({ name: x.name, chinese: x.chinese, el: x._오행.name, yinyang: x._음양?.name, tenGod: x._십성.name });
    return {
      ...p, unknown: false,
      stem: part(d._천간), branch: part(d._지지),
      hiddenStems: (d._지장간 || []).map((h) => ({ name: h.name, chinese: h.chinese, el: STEM_ELEMENT[h.name] })),
      unseong: d._운성?.name, sinsal12: sinsal12[p.key]?.name,
      stars: unique(Object.values(gilhyung[p.idx] || {}).flat()),
    };
  });
  const me = pillars[2].stem;
  const known = pillars.filter((p) => !p.unknown);

  const elementRows = ELEMENTS.map((el) => {
    const e = s["오행십성"]._오행.find((x) => x.element.name === el) || { percent: 0, point: 0, description: "" };
    return { el, id: elId(el), percent: e.percent, point: e.point, desc: e.description };
  });
  const useful = Object.values(s["용신"]._용신들 || {})[0]?.[0]?.name;
  const excess = elementRows.filter((e) => /과다/.test(e.desc) && e.el !== useful).map((e) => e.el);
  const lacking = elementRows.filter((e) => e.percent === 0 || /부족/.test(e.desc)).map((e) => e.el);
  const strength = s["신강신약"].name || "";

  // 십신: API는 일간(나 자신)도 비견으로 세므로 그 몫을 빼고 비중을 다시 계산
  const selfShare = 100 / (unknown ? 6 : 8);
  const tenGods = TEN_GOD_ORDER.map((name) => {
    const t = s["오행십성"]._십성.find((x) => x.element.name === name);
    let pct = t ? t.percent : 0;
    if (name === "비견") pct = Math.max(0, pct - selfShare);
    return { name, group: TEN_GOD_GROUP[name], percent: pct < 0.01 ? 0 : pct };
  });
  const tenTotal = tenGods.reduce((a, t) => a + t.percent, 0) || 1;
  tenGods.forEach((t) => (t.share = (t.percent / tenTotal) * 100));
  const groupShare = {};
  tenGods.forEach((t) => (groupShare[t.group] = (groupShare[t.group] || 0) + t.share));

  // 신살·귀인 (어느 기둥에 있는지)
  const starMap = new Map();
  known.forEach((p) => {
    p.stars.forEach((n) => starMap.set(n, unique([...(starMap.get(n) || []), p.label])));
    if (p.sinsal12) starMap.set(p.sinsal12, unique([...(starMap.get(p.sinsal12) || []), p.label]));
  });
  const allStars = [...starMap].map(([name, where]) => ({ name, where, info: STAR_INFO[name] || "" }));
  const guiin = allStars.filter((x) => isGuiin(x.name));
  const sinsal = allStars.filter((x) => !isGuiin(x.name));
  const hasStar = (n) => starMap.has(n);

  const natalBranches = known.map((p) => ({ idx: p.idx, label: p.label, name: p.branch.name }));
  const dayBranch = pillars[2].branch?.name;

  // 어떤 오행이 들어올 때 나에게 좋은지: 용신 +2, 용신을 생 +1, 용신을 극하거나 이미 넘치면 -1
  const elScore = (el) => {
    let sc = 0;
    if (el === useful) sc += 2;
    else if (GENERATES[el] === useful) sc += 1;
    if (CONTROLS[el] === useful) sc -= 1;
    if (excess.includes(el)) sc -= 1;
    return sc;
  };
  const describe = (g) => ({
    ganji: g._천간.name + g._지지.name, hanja: (g._천간.chinese || "") + (g._지지.chinese || ""),
    stem: g._천간.name, branch: g._지지.name,
    stemEl: g._천간._오행.name, branchEl: g._지지._오행.name,
    stemTG: g._천간._십성.name, branchTG: g._지지._십성.name,
    stemG: TEN_GOD_GROUP[g._천간._십성.name], branchG: TEN_GOD_GROUP[g._지지._십성.name],
    clash: natalBranches.filter((b) => pairHas(CLASH, g._지지.name, b.name)),
    combine: natalBranches.filter((b) => pairHas(COMBINE, g._지지.name, b.name)),
  });

  // 대운
  const luck = s["대운_연운_월운"];
  const daeun = luck._대운.map((d) => ({ age: d.age, year: d.year, ...describe(d._간지) }));
  const curDaeunIdx = daeun.map((d) => d.year <= year).lastIndexOf(true);
  daeun.forEach((d, i) => (d.now = i === curDaeunIdx));

  // ---------- 올해 ----------
  let yearR = null;
  const yearItem = luck._연운.find((y) => y.year === year);
  if (yearItem) {
    const Y = describe(yearItem._간지);
    const yEls = unique([Y.stemEl, Y.branchEl]);
    const yGroups = unique([Y.stemG, Y.branchG]);
    const fit = elScore(Y.stemEl) + elScore(Y.branchEl);
    const bias = fit / 3;
    const dayClash = Y.clash.some((b) => b.idx === 2);
    const dayComb = Y.combine.some((b) => b.idx === 2);
    const tooMuch = yEls.filter((e) => excess.includes(e));
    const avg = (k) => (GROUP_YEAR[Y.stemG][k][0] + GROUP_YEAR[Y.branchG][k][0]) / 2;
    const lines = (k) => unique([GROUP_YEAR[Y.stemG][k][1], ...(Y.branchG !== Y.stemG ? [`하반기에는 ${GROUP_YEAR[Y.branchG][k][1]}`] : [])]);
    const animal = BRANCH_ANIMAL[Y.branch];

    const totalText = [`${year}년은 ${ELEMENT_COLOR_WORD[Y.stemEl]} ${animal}의 해(${Y.ganji}년)예요. ${GROUP_YEAR[Y.stemG].total}`];
    if (Y.branchG !== Y.stemG) totalText.push(`하반기로 갈수록 ${GROUP_YEAR[Y.branchG].short} 흐름이 이어져요.`);
    if (yEls.includes(useful)) totalText.push(`나에게 꼭 필요한 ${useful} 기운이 들어오는 해라 전체적으로 흐름이 좋아요.`);
    else if (yEls.some((e) => GENERATES[e] === useful)) totalText.push(`나에게 필요한 ${useful} 기운을 돕는 해라 노력한 만큼 결과가 따라와요.`);
    tooMuch.forEach((e) => totalText.push(`다만 원래 많은 ${e} 기운이 더해지니 과하지 않게 조절하세요.`));

    const spouseG = gender === "M" ? "재성" : "관성"; // 전통적으로 남자는 재성, 여자는 관성이 이성 인연
    let love = 3 + bias + avg("love");
    const loveText = lines("love");
    const spouseIn = [Y.stemG, Y.branchG].filter((g) => g === spouseG).length;
    if (spouseIn) { love += spouseIn; loveText.unshift("이성 인연을 뜻하는 기운이 들어와 새로운 만남이 생기기 좋은 해예요."); }
    if (hasStar("도화살") || hasStar("홍염살") || hasStar("년살")) { love += 0.5; loveText.push("타고난 도화의 매력이 있어 인기가 많은 편이에요."); }
    if (dayComb) { love += 1; loveText.push("배우자 자리와 올해 기운이 합을 이뤄 관계가 깊어지기 좋아요."); }
    if (dayClash) { love -= 1; loveText.push("배우자 자리가 올해 기운과 부딪혀 다툼이나 변화가 생기기 쉬워요. 서운한 건 바로 이야기하세요."); }

    const money = 3 + bias + avg("money");
    const moneyText = lines("money");
    if ((groupShare.재성 || 0) === 0) moneyText.push("타고나기를 돈 욕심이 크지 않아 꾸준히 모으는 방식이 잘 맞아요.");

    let work = 3 + bias + avg("work");
    const workText = lines("work");
    const studyStar = ["문창귀인", "학당귀인", "문곡귀인", "관귀학관"].find(hasStar);
    if (studyStar) { work += 0.5; workText.push(`타고난 ${josa(studyStar, "이", "가")} 있어 배우는 힘이 좋아요.`); }

    let health = 4 + bias / 2;
    const healthText = [];
    tooMuch.forEach((e) => { health -= 1; healthText.push(`원래 많은 ${e} 기운이 더 강해져 ${ELEMENT_INFO[e].organ} 쪽을 신경 쓰세요.`); });
    lacking.slice(0, 1).forEach((e) => { health -= 0.5; healthText.push(`타고나기를 ${e} 기운이 약해 ${ELEMENT_INFO[e].organ} 건강을 꾸준히 챙기세요.`); });
    if (Y.clash.length) health -= 0.5;
    if (!healthText.length) healthText.push("큰 걱정 없이 무난한 해예요. 규칙적인 생활 리듬만 지켜 주세요.");
    healthText.push(/강|왕/.test(strength) ? "에너지가 넘치는 체질이라 운동으로 힘을 밖으로 쓰면 좋아요." : "쉽게 지칠 수 있는 체질이라 충분한 휴식이 가장 좋은 보약이에요.");

    let people = 3 + bias + avg("people");
    const peopleText = lines("people");
    if (hasStar("천을귀인")) { people += 0.5; peopleText.push("타고난 천을귀인이 있어 어려울 때 도와주는 사람이 나타나요."); }
    if (Y.clash.length) people -= 0.5;

    const fields = [
      { key: "love", title: "연애운", value: toIndex(love), text: loveText },
      { key: "money", title: "재물운", value: toIndex(money), text: moneyText },
      { key: "work", title: "직장 · 학업운", value: toIndex(work), text: workText },
      { key: "people", title: "대인관계운", value: toIndex(people), text: peopleText },
      { key: "health", title: "건강운", value: toIndex(health), text: healthText },
    ];
    // 총운 = 올해 기운이 나와 맞는 정도(절반) + 분야별 지수 평균(절반) -> 숫자끼리 어긋나지 않게
    const fieldAvg = fields.reduce((a, x) => a + x.value, 0) / fields.length;
    const totalValue = Math.round((toIndex(3 + fit / 2 - (dayClash ? 0.5 : 0)) + fieldAvg) / 2);

    const cautions = yGroups.map((g) => GROUP_YEAR[g].caution);
    Y.clash.forEach((b) => cautions.push(`올해 기운이 내 사주의 ${b.label}(${PILLAR_INFO[b.idx].area})와 부딪혀요(충). 이 부분에서 변화나 이동이 생기기 쉬우니 미리 대비하세요.`));
    const birthBranch = pillars[0].branch?.name;
    const sj = SAMJAE.find((g) => g.띠.includes(birthBranch));
    const sjIdx = sj ? sj.years.indexOf(Y.branch) : -1;
    if (sjIdx >= 0) cautions.push(`올해는 ${["들", "눌", "날"][sjIdx]}삼재예요. 무리한 도전보다는 지키는 쪽으로 움직이면 좋아요.`);
    Object.keys(CAUTION_STARS).filter(hasStar).slice(0, 2).forEach((n) => cautions.push(CAUTION_STARS[n]));

    const months = luck._월운.map((m, i) => {
      const M = describe(m._간지);
      const v = toIndex(3 + (elScore(M.stemEl) + elScore(M.branchEl)) / 2 - (M.clash.some((b) => b.idx === 2) ? 0.5 : 0));
      const notes = [GROUP_YEAR[M.stemG].month];
      if (M.clash.length) notes.push("변화·이동수");
      if (M.combine.some((b) => b.idx === 2)) notes.push("인연운 상승");
      const nextYear = i === luck._월운.length - 1 && m.month === 1;
      return { label: `${m.month}월`, nextYear, value: v, ganji: M.ganji, text: notes.join(" · "), now: m.year === year && m.month === month && !nextYear };
    });

    yearR = {
      year, ganji: Y.ganji, hanja: Y.hanja, name: `${ELEMENT_COLOR_WORD[Y.stemEl]} ${animal}의 해`,
      value: totalValue, label: indexLabel(totalValue), text: totalText,
      fields, cautions, months, daeunNow: curDaeunIdx >= 0 ? daeun[curDaeunIdx] : null,
      firstDaeun: curDaeunIdx < 0 ? daeun[0] : null,
    };
  }

  // ---------- 개운법 (원국 기준) ----------
  const boostEls = unique([useful, ...lacking]).filter(Boolean).slice(0, 2);
  const remedy = {
    elements: boostEls.map((e) => ({ el: e, id: elId(e), main: e === useful, ...BOOST[e] })),
    habit: /강|왕/.test(strength)
      ? "기운이 강한 사주라 에너지를 운동·봉사·취미처럼 밖으로 쓰면 균형이 맞아요."
      : /약/.test(strength)
        ? "기운이 부드러운 사주라 혼자 버티기보다 믿을 만한 사람에게 도움을 청하고 충분히 쉬는 게 운을 키워요."
        : "기운이 고른 사주라 지금처럼 균형 잡힌 생활을 유지하는 게 가장 좋은 개운법이에요.",
  };

  // ---------- 오늘 ----------
  let todayR = null;
  if (data.today) {
    const D = describe(data.today._간지);
    let raw = 3 + (elScore(D.stemEl) + elScore(D.branchEl)) / 2;
    const flow = [];
    const guiinDay = (CHEONEUL[me.name] || []).includes(D.branch);
    if (guiinDay) { raw += 0.5; flow.push("오늘은 나의 천을귀인 날이에요. 도움을 청하면 귀인이 나타나요."); }
    if (D.combine.some((b) => b.idx === 2)) { raw += 0.5; flow.push("오늘의 기운이 나의 배우자 자리(일지)와 합을 이뤄요. 사람과의 관계가 부드럽게 풀려요."); }
    if (D.clash.some((b) => b.idx === 2)) { raw -= 0.75; flow.push("오늘의 기운이 나의 일지와 부딪혀요(충). 계획이 바뀌거나 예민해질 수 있으니 여유 있게 움직이세요."); }
    D.clash.filter((b) => b.idx !== 2).forEach((b) => { raw -= 0.25; flow.push(`오늘의 기운이 ${b.label}와 부딪혀 ${PILLAR_INFO[b.idx].area} 쪽에 작은 변화가 생길 수 있어요.`); });
    D.combine.filter((b) => b.idx !== 2).forEach((b) => flow.push(`오늘의 기운이 ${b.label}와 합을 이뤄 ${PILLAR_INFO[b.idx].area} 쪽 일이 순조로워요.`));
    if (D.stemEl === useful || D.branchEl === useful) flow.push(`나에게 필요한 ${useful} 기운이 들어오는 날이라 힘을 받아요.`);
    const todayExcess = unique([D.stemEl, D.branchEl]).find((e) => excess.includes(e));
    if (todayExcess) flow.push(`원래 많은 ${todayExcess} 기운이 더해지는 날이라 과하지 않게 조절하세요.`);
    if (!flow.length) flow.push("특별히 부딪히거나 합을 이루는 기운이 없는 평온한 날이에요. 평소 리듬대로 움직이면 좋아요.");

    const value = toIndex(raw);
    const T = DAY_TEXT[D.stemG];
    const hours = data.today.hours.map((h) => {
      const H = describe(h._간지);
      let r = 3 + (elScore(H.stemEl) + elScore(H.branchEl)) / 2;
      if (dayBranch && pairHas(CLASH, H.branch, dayBranch)) r -= 0.5;
      if (dayBranch && pairHas(COMBINE, H.branch, dayBranch)) r += 0.5;
      return { label: h.branch, range: `${h.start}–${h.end}`, value: toIndex(r), ganji: H.ganji, group: H.stemG };
    });
    const maxV = Math.max(...hours.map((h) => h.value));
    const minV = Math.min(...hours.map((h) => h.value));
    hours.forEach((h) => { h.best = h.value === maxV; h.worst = h.value === minV && minV !== maxV; });

    // 개운: 오늘 넘치는 기운이 있으면 그 기운을 빼 주는(설기) 오행, 아니면 용신
    const luckyEl = todayExcess ? GENERATES[todayExcess] : useful || GENERATES[me.el];
    const pick = Number(data.today.date.slice(-2)) % 2;
    const B = BOOST[luckyEl];
    const monthItem = luck._월운.find((m) => m.year === year && m.month === month);
    const M = monthItem && describe(monthItem._간지);

    todayR = {
      date: data.today.date, ganji: D.ganji, hanja: D.hanja,
      value, label: dayLabel(value), title: T.title, summary: T.summary,
      areas: [
        { title: "일 · 공부", text: T.work }, { title: "돈", text: T.money },
        { title: "연애", text: T.love }, { title: "관계", text: T.people },
      ],
      lucky: {
        el: luckyEl, id: elId(luckyEl),
        color: B.color.split(" · ")[pick], number: B.nums.split(", ")[pick], dir: B.dir,
        food: B.food, item: B.item.split(", ")[pick], todo: T.todo, avoid: T.avoid,
        why: todayExcess
          ? `오늘은 원래 많은 ${todayExcess} 기운이 강해지는 날이라, 그 기운을 자연스럽게 풀어 주는 ${luckyEl} 기운이 도움이 돼요.`
          : `나에게 필요한 ${luckyEl} 기운을 채우면 오늘의 흐름이 더 좋아져요.`,
      },
      dayGod: { name: D.stemTG, info: TEN_GOD_INFO[D.stemTG] },
      flow, hours,
      month: M && `이번 달은 ${M.ganji}월로 '${GROUP_YEAR[M.stemG].month}'이에요.`,
    };
  }

  return {
    name: profile.name || "나", unknown,
    pillars, me, elementRows, useful, excess, lacking, strength,
    tenGods, groupShare, guiin, sinsal, daeun,
    year: yearR, today: todayR, remedy,
  };
}

// ================= 탭하면 보여줄 해석 =================
function explainChar(A, pillar, which) {
  const c = pillar[which];
  const pos = PILLAR_INFO[pillar.idx];
  const body = [];
  if (which === "stem") {
    const si = STEM_INFO[c.name];
    body.push(`${c.name}(${c.chinese})은 ${c.el}(${ELEMENT_HANJA[c.el]}) 기운의 글자로, 자연으로 치면 ${josa(si.image, "이에요", "예요")}.`);
    if (pillar.idx === 2) body.push(`일주의 천간은 바로 '나'를 뜻해요. ${si.trait}`, si.care);
    else body.push(si.trait);
  } else {
    const bi = BRANCH_INFO[c.name];
    body.push(`${c.name}(${c.chinese})는 ${BRANCH_ANIMAL[c.name]}를 뜻하는 글자로, ${bi.time}에 해당하는 ${c.el} 기운이에요. ${bi.trait}`);
    if (pillar.hiddenStems?.length) body.push(`안에 숨은 기운(지장간): ${pillar.hiddenStems.map((h) => `${h.name} ${h.el}`).join(" · ")}`);
  }
  if (!(which === "stem" && pillar.idx === 2) && TEN_GOD_INFO[c.tenGod]) {
    body.push(`나에게 이 글자는 '${c.tenGod}'이에요. ${TEN_GOD_INFO[c.tenGod].body}`);
  }
  body.push(`${pillar.label}는 ${pos.stage}와 ${pos.area}를 나타내요.`);
  return { title: `${pillar.label} ${which === "stem" ? "천간" : "지지"} · ${c.name}(${c.chinese})`, body };
}

function explainPillar(A, pillar) {
  const pos = PILLAR_INFO[pillar.idx];
  if (pillar.unknown) return { title: pillar.label, body: ["태어난 시간을 몰라 시주는 비워 두었어요. 시간을 알면 말년운과 자녀운을 더 자세히 볼 수 있어요."] };
  const els = [pillar.stem.el, pillar.branch.el, ...pillar.hiddenStems.map((h) => h.el)];
  const top = ELEMENTS.map((e) => [e, els.filter((x) => x === e).length]).sort((a, b) => b[1] - a[1])[0][0];
  const body = [
    `${pillar.label}는 ${pos.stage}를 뜻하고 ${pos.area}를 나타내요. ${pos.extra}`,
    `이 기둥은 ${pillar.stem.name}${pillar.branch.name}(${pillar.stem.chinese}${pillar.branch.chinese})로, ${top} 기운이 가장 강해요. ${ELEMENT_INFO[top].trait}`,
  ];
  if (UNSEONG_INFO[pillar.unseong]) body.push(`12운성 '${pillar.unseong}' — ${UNSEONG_INFO[pillar.unseong]}`);
  if (pillar.sinsal12 && STAR_INFO[pillar.sinsal12]) body.push(`12신살 '${pillar.sinsal12}' — ${STAR_INFO[pillar.sinsal12]}`);
  return { title: `${pillar.label} · ${pillar.stem.name}${pillar.branch.name}`, body };
}

function explainElement(A, row) {
  const info = ELEMENT_INFO[row.el];
  const state = /과다/.test(row.desc) ? info.much : /발달/.test(row.desc) ? info.good : row.percent === 0 || /부족/.test(row.desc) ? info.lack : info.ok;
  const body = [`${info.nature} — ${info.keys}`, info.trait, `내 사주에서는 ${row.percent}%로 '${row.desc || "-"}' 상태예요. ${state}`];
  if (row.el === A.useful) body.push(`${josa(row.el, "은", "는")} 나에게 가장 필요한 기운(용신)이에요. 행운의 색은 ${BOOST[row.el].color}, 좋은 방향은 ${BOOST[row.el].dir}이에요.`);
  return { title: `${row.el}(${ELEMENT_HANJA[row.el]}) 기운`, body };
}

function explainTenGod(A, t) {
  const info = TEN_GOD_INFO[t.name];
  const body = [info.key, info.body, `내 사주에서 차지하는 비중은 ${Math.round(t.share)}%예요.`];
  if (t.share >= 25) body.push(info.many);
  if (t.share === 0) body.push(info.none);
  body.push(`'${GROUP_LABEL[t.group]}' 그룹에 속해요.`);
  return { title: t.name, body };
}

function explainStar(A, star) {
  return {
    title: star.name,
    body: [
      star.info || "전해지는 뜻이 다양한 신살이에요.",
      `내 사주의 ${star.where.join(", ")}에 있어요.`,
      isGuiin(star.name) ? "귀인은 나를 돕는 좋은 별이에요." : "'살'이라고 무조건 나쁜 건 아니에요. 대부분 강한 개성이나 조심할 점을 뜻해요.",
    ],
  };
}

function explainDaeun(A, d) {
  const g = GROUP_YEAR[d.stemG];
  const body = [`${d.age}세 ~ ${d.age + 9}세 (${d.year} ~ ${d.year + 9}년) · ${d.ganji} 대운`, `'${g.daeun}'이에요. ${g.period}`];
  if (d.stemEl === A.useful || d.branchEl === A.useful) body.push(`나에게 필요한 ${A.useful} 기운이 들어오는 대운이라 흐름이 좋아요.`);
  else if (A.excess.includes(d.stemEl) || A.excess.includes(d.branchEl)) body.push("이미 많은 기운이 더해지는 시기라 무리하지 않는 게 좋아요.");
  if (d.clash.length) body.push(`${d.clash.map((b) => b.label).join(", ")}와 부딪혀(충) 환경의 변화가 생기기 쉬운 시기예요.`);
  if (d.combine.length) body.push(`${d.combine.map((b) => b.label).join(", ")}와 합을 이뤄 인연과 협력이 따르는 시기예요.`);
  return { title: `${d.age}세 대운${d.now ? " · 지금" : ""}`, body };
}
