// saju-explain 형식 풀이: 표로 한눈에 → 상태 한 단어 → 종합 해석 문단.
// interpret.js의 analyze()가 끝에서 analyzeDetail()을 불러 A.detail에 담는다. 화면은 app.js의 renderChart.

// ================= 사전 =================
const SOLAR_MONTH = { 인: "입춘~경칩", 묘: "경칩~청명", 진: "청명~입하", 사: "입하~망종", 오: "망종~소서", 미: "소서~입추", 신: "입추~백로", 유: "백로~한로", 술: "한로~입동", 해: "입동~대설", 자: "대설~소한", 축: "소한~입춘" };
const SEASON = { 인: "이른 봄", 묘: "한봄", 진: "늦봄", 사: "초여름", 오: "한여름", 미: "늦여름", 신: "초가을", 유: "한가을", 술: "늦가을", 해: "초겨울", 자: "한겨울", 축: "늦겨울" };
const UNSEONG_ENERGY = { 장생: "탄생", 목욕: "호기심", 관대: "도약", 건록: "자립", 제왕: "최강", 쇠: "노련", 병: "감성", 사: "사색", 묘: "저장", 절: "전환", 태: "잉태", 양: "양육" };
const UNSEONG_FLOW = { 장생: "새롭게 자라나는 기운", 목욕: "호기심 많고 감각적인 시기", 관대: "의욕 넘치는 도약", 건록: "스스로 자리 잡는 단단함", 제왕: "가장 강한 주체성", 쇠: "노련한 여유", 병: "섬세한 감성", 사: "깊은 사색", 묘: "모으고 갈무리하는 안정", 절: "과감한 독립과 변화", 태: "새로운 가능성", 양: "차분히 준비하는 시간" };
const GROUP_KEYWORD = { 비겁: "자아 · 경쟁 · 독립", 식상: "표현 · 창의 · 재능", 재성: "재물 · 현실 · 관리", 관성: "명예 · 책임 · 직장", 인성: "학문 · 지원 · 어머니" };
const GROUP_MANY = {
  비겁: "주관이 뚜렷하고 독립심이 강해요. 남에게 기대기보다 스스로 길을 만드는 타입이에요.",
  식상: "표현력과 재능이 넘쳐요. 생각을 밖으로 꺼내 만들고 보여 주는 일에서 빛나요.",
  재성: "현실 감각이 뛰어나고 결과를 만들어 내는 힘이 있어요. 돈과 일의 흐름을 잘 읽어요.",
  관성: "책임감이 강하고 원칙을 지켜요. 조직 안에서 인정받고 자리를 잡는 힘이 있어요.",
  인성: "배우고 생각하는 힘이 깊어요. 지식과 자격, 주변의 도움이 든든한 바탕이 돼요.",
};
const GROUP_NONE = {
  비겁: "비겁이 없어 혼자 밀어붙이기보다 함께할 사람을 곁에 두면 힘이 나요.",
  식상: "식상이 없어 생각을 말이나 글로 꺼내는 연습을 하면 재능이 더 드러나요.",
  재성: "재성이 없어 돈 욕심이 크지 않은 편이에요. 계획적인 저축 습관이 도움이 돼요.",
  관성: "관성이 없어 틀에 매이기보다 자유롭게 움직이는 걸 좋아해요. 스스로 정한 규칙이 힘이 돼요.",
  인성: "인성이 없어 남의 도움보다 경험으로 배우는 타입이에요. 꾸준한 공부 습관이 큰 무기가 돼요.",
};
// 신살 종합 해석에 쓰는 짧은 표현 (앞에 둘수록 먼저 이야기함)
const STAR_PHRASE = {
  괴강살: "남에게 기대지 않는 카리스마와 강한 주체성",
  양인살: "결단력과 프로다운 돌파력",
  백호살: "무엇이든 밀어붙이는 강한 에너지",
  장성살: "무리를 이끄는 리더의 기질",
  역마살: "이동하며 새로운 경험을 쌓는 무대에서 능력을 펼치는 힘",
  도화살: "사람의 시선을 끄는 매력과 예술적 감각",
  홍염살: "분위기 있는 매력",
  년살: "사람을 끄는 매력",
  화개살: "남다른 탐구심과 깊이 있는 기획력",
  현침살: "예리한 감각과 섬세한 손재주",
  귀문관살: "예민한 직관과 풍부한 감수성",
  천을귀인: "어려울 때 지혜롭게 넘기도록 돕는 든든한 방어막",
  천덕귀인: "위기를 무사히 넘기게 하는 하늘의 덕",
  월덕귀인: "주변의 덕을 입는 복",
  태극귀인: "시작한 일을 끝까지 지켜 주는 복",
  문창귀인: "글과 공부의 재능",
  학당귀인: "배우는 머리",
  문곡귀인: "학문과 예술 감각",
  천문성: "직관과 영감",
  금여성: "품위와 좋은 배우자 복",
  정록: "먹고살 걱정이 적은 안정된 복",
};
const REL_INFO = {
  천간합: ["천간합", "서로 끌어당겨 목표와 결과에 집중하는 힘"],
  지지육합: ["육합", "강한 결속력과 뚝심"],
  지지삼합: ["삼합", "같은 목표로 힘을 모으는 협력"],
  지지방합: ["방합", "같은 계절 기운이 모여 한 방향으로 강해짐"],
  천간충: ["천간충", "생각과 목표가 부딪혀 고민이 많아질 수 있음"],
  지지충: ["충", "변화와 이동이 잦은 역동적인 흐름"],
  형: ["형", "갈등을 조율하며 단단해지는 과정"],
  파: ["파", "관계를 다시 정리하고 조정할 일"],
  해: ["해", "사소한 오해를 조심하고 섬세하게 살필 점"],
  원진: ["원진", "예민한 직관과 감수성, 서운함에 주의"],
  공망: ["공망", "비어 있는 자리라 욕심을 덜면 오히려 편함"],
};
const CAREER_GROUP = {
  비겁: ["1인 창업가 · 프리랜서", "주관과 독립심(비겁)을 살려 스스로 영역을 만드는 일"],
  식상: ["콘텐츠 크리에이터 · 작가 · 기획자", "표현력과 창의력(식상)을 결과물로 만드는 일"],
  재성: ["경영 · 영업 · 금융", "현실 감각과 결과를 만드는 힘(재성)을 쓰는 일"],
  관성: ["공무원 · 공공기관 · 관리직", "책임감과 원칙(관성)이 인정받는 조직"],
  인성: ["연구원 · 교육자 · 자격 전문직", "배우고 깊이 생각하는 힘(인성)을 쓰는 일"],
};
const CAREER_STAR = [
  ["역마살", "해외 · 여행 · 물류처럼 이동이 많은 직무", "역마살의 활동성을 살려 넓은 무대에서 움직이는 일"],
  ["화개살", "연구 · 예술 · 철학 분야", "화개살의 깊은 탐구심으로 한 분야를 파고드는 일"],
  ["도화살", "방송 · 디자인 · 뷰티", "도화살의 매력으로 사람들의 시선을 받는 일"],
  ["홍염살", "공연 · 패션 · 브랜딩", "홍염살의 분위기와 감각을 쓰는 일"],
  ["문창귀인", "교육 · 글쓰기 · 출판", "문창귀인의 글재주와 학습 능력을 쓰는 일"],
  ["학당귀인", "교육 · 연구 · 시험으로 들어가는 전문직", "학당귀인의 배우는 머리를 살리는 일"],
  ["천문성", "상담 · 교육 · 의료", "천문성의 직관과 영감으로 사람을 돕는 일"],
  ["천의성", "의료 · 돌봄 · 치유", "천의성의 돌보는 재능을 쓰는 일"],
  ["현침살", "의료 · 정밀 기술 · 디자인", "현침살의 예리한 감각과 손재주를 쓰는 일"],
  ["괴강살", "조직을 이끄는 리더 · 전문직", "괴강살의 카리스마로 앞장서는 일"],
  ["양인살", "전문 기술직 · 스포츠", "양인살의 결단력과 돌파력을 쓰는 일"],
];
const CAREER_ADVICE = {
  비겁: "남의 지시를 따르기보다 스스로 결정권을 가질 수 있는 환경에서 실력이 드러나요.",
  식상: "정해진 일을 반복하기보다 자기만의 결과물을 만들어 보여 줄 수 있는 일에서 가장 크게 성장해요.",
  재성: "성과가 숫자로 보이는 일, 직접 관리하고 굴리는 일에서 의욕이 커져요.",
  관성: "체계가 잡힌 조직에서 책임을 맡을수록 인정받고 자리를 잡아요.",
  인성: "전문 지식과 자격을 쌓아 그 분야의 믿음직한 전문가가 되는 길이 잘 맞아요.",
};
const STATUS_WORD = { 과다: "과다", 발달: "발달", 적정: "적정", 부족: "부족" };
const PILLAR_AREA = ["초년 · 집안", "청년기 · 사회", "나와 배우자 자리", "말년 · 자녀"];
const stars5 = (v) => Math.max(1, Math.min(5, Math.round(v / 20)));

// ================= 분석 =================
function analyzeDetail(A, data) {
  const s = data.sections;
  const sm = s["사주명식"].profile || {};
  const known = A.pillars.filter((p) => !p.unknown);
  const meYang = G_STEMS.indexOf(A.me.name) % 2 === 0;
  const tgOf = (stem) => tenGodOf(A.me.el, meYang, STEM_ELEMENT[stem], G_STEMS.indexOf(stem) % 2 === 0); // api.js
  const where = (labels) => labels.join(" · ");

  // ---------- 기본 정보 ----------
  const yearP = A.pillars[0], monthP = A.pillars[1];
  const mb = monthP.branch.name;
  const lun = (sm.lunBirth || "").match(/^\((.+?)\)\s*(.+)$/);
  const basics = [
    ["양력", sm.sunBirth || "-"],
    ["음력", lun ? `${lun[2]} (${lun[1]})` : sm.lunBirth || "-"],
    ["태어난 곳", sm.location || "-"],
    ["진태양시", A.unknown ? "시간 모름" : `${(sm.adjustedBirth || "").split(" ")[1] || "-"}${sm.adjusted ? ` (${sm.adjusted} 보정)` : ""}`],
    ["성별", A.gender === "M" ? "남" : "여"],
    ["띠", `${ELEMENT_COLOR_WORD[yearP.stem.el]} ${BRANCH_ANIMAL[yearP.branch.name]}띠 (${yearP.stem.name}${yearP.branch.name}년)`],
    ["절기 기준 월", `${mb}월 · ${SOLAR_MONTH[mb]}`],
  ];

  // ---------- 원국 요약 ----------
  const si = STEM_INFO[A.me.name];
  const seasonEl = monthP.branch.el;
  const seasonLine = seasonEl === A.me.el ? "계절의 기운이 나와 같아 타고난 힘이 있는 편이에요."
    : GENERATES[seasonEl] === A.me.el ? "계절이 나를 키워 주는 때라 든든한 바탕이 있어요."
      : "계절의 기운이 나와 달라 스스로 힘을 길러 가는 사주예요.";
  const strengthLine = /강|왕/.test(A.strength) ? "스스로 밀고 나가는 힘이 강해요."
    : /약/.test(A.strength) ? "혼자보다 주변과 함께할 때 힘이 커져요." : "기운의 균형이 잘 잡혀 있어요.";
  const wonguk = [
    `나를 뜻하는 일간은 ${A.me.name}(${A.me.chinese}) · ${A.me.el} 기운, 자연으로 치면 ${josa(si.image, "이에요", "예요")}. ${si.trait}`,
    `${SEASON[mb]}(${mb}월)에 태어났어요. ${seasonLine} 전체적으로는 '${A.strength || "-"}' 사주라 ${strengthLine}`,
  ];

  // ---------- 오행 ----------
  const surface = known.flatMap((p) => [p.stem, p.branch]);
  const elements = A.elementRows.map((r) => {
    const chars = surface.filter((c) => c.el === r.el);
    return {
      ...r, chars: chars.map((c) => `${c.name}(${c.chinese})`), count: chars.length,
      ratio: surface.length ? (chars.length / surface.length) * 100 : 0,
      status: chars.length === 0 ? "결핍" : STATUS_WORD[r.desc] || r.desc || "적정",
    };
  });
  const strongest = [...elements].sort((a, b) => b.percent - a.percent)[0];
  const missing = elements.filter((e) => e.count === 0);
  const elementText = [
    `가장 강한 기운은 ${josa(`${strongest.el}(${ELEMENT_HANJA[strongest.el]})`, "이에요", "예요")}. ${/과다/.test(strongest.desc) ? ELEMENT_INFO[strongest.el].much : ELEMENT_INFO[strongest.el].good}`,
  ];
  missing.forEach((e) => elementText.push(`겉으로 드러난 ${e.el}(${ELEMENT_HANJA[e.el]}) 기운이 없어요. ${ELEMENT_INFO[e.el].lack}`));
  if (A.useful) {
    const B = BOOST[A.useful];
    elementText.push(`그래서 나에게 가장 필요한 기운(용신)은 ${josa(`${A.useful}(${ELEMENT_HANJA[A.useful]})`, "이에요", "예요")}. 행운의 색은 ${B.color}, 좋은 방향은 ${josa(B.dir, "이에요", "예요")}. ${B.act} 같은 습관이 그 기운을 채워 줘요.`);
  }

  // ---------- 십성 ----------
  const tenRows = known.map((p) => ({ label: p.label, stem: p.idx === 2 ? "나" : p.stem.tenGod, branch: p.branch.tenGod }));
  const chars = known.flatMap((p) => (p.idx === 2 ? [p.branch] : [p.stem, p.branch]));
  const groups = Object.keys(GROUP_LABEL).map((g) => ({
    group: g, keyword: GROUP_KEYWORD[g], share: A.groupShare[g] || 0,
    count: chars.filter((c) => TEN_GOD_GROUP[c.tenGod] === g).length,
  }));
  const ranked = [...groups].sort((a, b) => b.count - a.count || b.share - a.share);
  const zero = groups.filter((g) => g.count === 0);
  const tenText = [`가장 많은 기운은 ${ranked[0].group}(${ranked[0].keyword})이에요. ${GROUP_MANY[ranked[0].group]}`];
  if (ranked[1].count > 0) tenText.push(`그다음은 ${ranked[1].group}(${ranked[1].keyword})으로, ${GROUP_MANY[ranked[1].group]}`);
  zero.slice(0, 2).forEach((g) => tenText.push(GROUP_NONE[g.group]));

  // ---------- 대운 ----------
  const d0 = A.daeun[0];
  const forward = d0 && (G_STEMS.indexOf(d0.stem) - G_STEMS.indexOf(monthP.stem.name) + 10) % 10 === 1;
  const curD = A.daeun.find((d) => d.now);
  const daeunText = [];
  if (curD) {
    const g = GROUP_YEAR[curD.stemG];
    daeunText.push(`지금은 ${curD.age}세부터 시작된 ${curD.ganji}(${curD.hanja}) 대운이에요. '${g.daeun}' — ${g.period}`);
    if (curD.stemEl === A.useful || curD.branchEl === A.useful) daeunText.push(`나에게 필요한 ${A.useful} 기운이 들어오는 시기라 흐름이 좋아요.`);
    const next = A.daeun[A.daeun.indexOf(curD) + 1];
    if (next) daeunText.push(`${next.year}년(${next.age}세)부터는 ${next.ganji} 대운, '${GROUP_YEAR[next.stemG].daeun}'으로 넘어가요.`);
  } else if (d0) daeunText.push(`첫 대운은 ${d0.age}세(${d0.year}년)부터 시작돼요. 그전까지는 타고난 사주의 기운대로 자라요.`);

  // ---------- 신살 (자리까지) ----------
  const gilhyung = s["길흉성"].길흉 || {};
  const starMap = new Map();
  const addStar = (name, loc, idx) => {
    const cur = starMap.get(name) || { name, locs: [], idxs: [] };
    if (!cur.locs.includes(loc)) cur.locs.push(loc);
    if (!cur.idxs.includes(idx)) cur.idxs.push(idx);
    starMap.set(name, cur);
  };
  known.forEach((p) => {
    const g = gilhyung[p.idx] || {};
    (g[0] || g["0"] || []).forEach((n) => addStar(n, `${p.label.slice(0, 1)}간(${p.stem.name})`, p.idx));
    (g[1] || g["1"] || []).forEach((n) => addStar(n, `${p.label.slice(0, 1)}지(${p.branch.name})`, p.idx));
    if (p.sinsal12) addStar(p.sinsal12, `${p.label.slice(0, 1)}지(${p.branch.name})`, p.idx);
  });
  const stars = [...starMap.values()].map((x) => ({ ...x, good: isGuiin(x.name), info: STAR_INFO[x.name] || "전해지는 뜻이 다양한 신살이에요." }))
    .sort((a, b) => Number(a.good) - Number(b.good));
  const order = Object.keys(STAR_PHRASE);
  const told = stars.filter((x) => STAR_PHRASE[x.name]).sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
  const plain = told.filter((x) => !x.good).slice(0, 4);
  const lucky = told.filter((x) => x.good).slice(0, 2);
  const placeOf = (x) => where(x.idxs.sort().map((i) => PILLARS[i].label));
  const starText = [];
  if (plain.length) {
    starText.push(plain.map((x, i) =>
      `${i === 0 ? "" : i === plain.length - 1 ? "또 " : ""}${placeOf(x)}에 있는 ${josa(x.name, "은", "는")} ${josa(STAR_PHRASE[x.name], "을", "를")} 더해 줘요.`).join(" "));
  }
  if (lucky.length) {
    starText.push(lucky.map((x, i) => `${plain.length && i === 0 ? "그리고 " : ""}${placeOf(x)}의 ${josa(x.name, "이", "가")} ${josa(STAR_PHRASE[x.name], "이", "가")} 되어 줘요.`).join(" "));
  }
  if (!starText.length) starText.push(stars.length ? "드러난 신살들이 각자 작은 개성을 더해 줘요. 항목을 누르면 뜻을 볼 수 있어요." : "사주에 드러난 신살이 없어 큰 굴곡 없이 담백한 편이에요.");

  // ---------- 12운성 ----------
  const unseong = known.map((p) => ({ label: p.label, branch: `${p.branch.name}(${p.branch.chinese})`, name: p.unseong, energy: UNSEONG_ENERGY[p.unseong] || "-" }));
  const dayU = A.pillars[2].unseong;
  const flowParts = known.map((p) => [["초년", "청년기", "중년", "말년"][p.idx], p.label, p.unseong]);
  const unseongText = [];
  if (UNSEONG_INFO[dayU]) unseongText.push(`나 자신(일주)의 12운성은 '${dayU}'이에요. ${UNSEONG_INFO[dayU]}`);
  if (flowParts.length >= 3) {
    const f = (x) => `${x[0]}(${x[1]} '${x[2]}')의 ${UNSEONG_FLOW[x[2]] || x[2]}`;
    const [a, b, ...rest] = flowParts;
    const tail = rest.map(f).join(", ");
    unseongText.push(`${f(a)}에서 출발해 ${josa(f(b), "을", "를")} 거치고, ${josa(tail, "으로", "로")} 이어지는 흐름이에요.`);
  }

  // ---------- 지장간 ----------
  const slot = (list) => (list.length >= 3 ? [list[0], list[1], list[2]] : list.length === 2 ? [list[0], null, list[1]] : [null, null, list[0] || null]);
  const hidden = known.map((p) => ({ label: p.label, slots: slot(p.hiddenStems).map((h) => h && { ...h, tenGod: tgOf(h.name) }) }));
  const hiddenText = [];
  missing.forEach((e) => {
    const found = hidden.flatMap((h) => h.slots.filter((x) => x && x.el === e.el).map((x) => ({ ...x, label: h.label })));
    if (found.length) {
      const x = found[0];
      hiddenText.push(`사주 겉면에는 ${e.el}(${ELEMENT_HANJA[e.el]}) 기운이 없지만, ${where(unique(found.map((f) => f.label)))}의 지장간 속에 ${josa(`${x.name}${e.el}(${x.tenGod})`, "이", "가")} 숨어 있어요. ${TEN_GOD_INFO[x.tenGod].key}의 힘을 필요할 때 꺼내 쓸 수 있어요.`);
    } else hiddenText.push(`${e.el}(${ELEMENT_HANJA[e.el]}) 기운은 겉에도 속에도 없어요. 생활 속에서 의식적으로 채워 주면 좋아요.`);
  });
  const spouse = hidden.find((h) => h.label === "일주")?.slots[2];
  if (spouse) hiddenText.push(`배우자 자리(일지) 속 중심 기운은 ${josa(`${spouse.name}${spouse.el}(${spouse.tenGod})`, "이에요", "예요")}. 가까운 사람과의 관계에서 ${TEN_GOD_INFO[spouse.tenGod].key}의 모습이 드러나기 쉬워요.`);
  if (!missing.length && hiddenText.length < 2) hiddenText.unshift("겉에 드러난 기운과 속에 숨은 기운의 방향이 비슷해, 겉과 속이 한결같은 편이에요.");

  // ---------- 형충회합 ----------
  const rel = s["사주풀이"] || {};
  const relations = [];
  Object.keys(REL_INFO).forEach((k) => (rel[k] || []).forEach((r) => {
    if (A.unknown && (r.list || []).includes(3)) return;
    const title = String(r.title || "");
    const plainTitle = title.replace(/<[^>]+>/g, "");
    const name = (title.match(/<b>(.*?)<\/b>/) || plainTitle.match(/(\S+?)(?:이|가) 있어요/) || [, plainTitle])[1];
    const same = relations.find((x) => x.kind === REL_INFO[k][0] && x.name === name); // 같은 관계가 여러 자리에 있으면 한 줄로
    const idxs = unique([...(same ? same.idxs : []), ...(r.list || [])]).sort();
    if (same) same.idxs = idxs;
    else relations.push({ kind: REL_INFO[k][0], name, idxs, meaning: REL_INFO[k][1], good: /합/.test(k) });
  }));
  relations.forEach((x) => (x.where = where(x.idxs.map((i) => PILLARS[i]?.label).filter(Boolean))));
  const goodRel = relations.filter((r) => r.good).length, badRel = relations.length - goodRel;
  const relText = [!relations.length ? "글자끼리 크게 묶이거나 부딪히는 관계가 없어 담백하고 안정적인 구조예요."
    : goodRel > badRel ? "서로 묶이는 합이 많아 사람과 목표를 하나로 모으는 힘이 좋아요. 인연을 오래 이어 가는 편이에요."
      : badRel > goodRel ? "부딪히는 관계가 있어 삶에 변화와 움직임이 많아요. 변화를 두려워하지 않으면 오히려 성장의 계기가 돼요."
        : "합과 충이 함께 있어 안정과 변화가 번갈아 와요. 흐름에 맞춰 유연하게 움직이면 좋아요."];

  // ---------- 적성 · 직업 ----------
  const jobs = [];
  ranked.filter((g) => g.count > 0).slice(0, 2).forEach((g) => jobs.push({ title: CAREER_GROUP[g.group][0], why: CAREER_GROUP[g.group][1] }));
  CAREER_STAR.filter(([n]) => starMap.has(n)).slice(0, 2).forEach(([, t, w]) => jobs.push({ title: t, why: w }));
  const careerText = [`가장 강한 ${ranked[0].group} 기운을 보면, ${CAREER_ADVICE[ranked[0].group]}`];
  if (starMap.has("역마살")) careerText.push("역마살이 있어 한자리에 오래 머무는 일보다 출장·이동이 함께하는 환경에서 더 크게 성취해요.");
  if (starMap.has("화개살")) careerText.push("화개살이 있어 혼자 깊이 몰입할 수 있는 시간과 공간이 있을 때 실력이 쌓여요.");
  if (zero.some((g) => g.group === "관성")) careerText.push("관성이 없어 딱딱한 조직보다 자율적인 환경이 잘 맞아요.");

  // ---------- 올해 키워드 ----------
  let yearKeys = null;
  if (A.year) {
    const Y = A.year;
    const real = Y.months.filter((m) => !m.nextYear);
    const best = [...real].sort((a, b) => b.value - a.value).slice(0, 2).sort((a, b) => parseInt(a.label) - parseInt(b.label));
    const worst = [...real].sort((a, b) => a.value - b.value)[0];
    yearKeys = {
      total: `${GROUP_YEAR[Y.stemG].short} 해`,
      rows: Y.fields.map((f) => ({ title: f.title, value: f.value, stars: stars5(f.value), line: f.text[0] })),
      advice: [
        `${Y.year}년은 ${Y.ganji}(${Y.hanja})년, ${unique([Y.stemEl, Y.branchEl]).map((e) => `${e}(${ELEMENT_HANJA[e]})`).join("·")} 기운이 들어오는 해예요. ` +
          ([Y.stemEl, Y.branchEl].includes(A.useful) ? `나에게 꼭 필요한 ${A.useful} 기운이라 적극적으로 움직일수록 좋은 결과가 따라와요.`
            : [Y.stemEl, Y.branchEl].some((e) => A.excess.includes(e)) ? "이미 많은 기운이 더해지는 해라 속도를 조절하고, 무리한 확장보다 지금 가진 것을 다지는 쪽이 좋아요."
              : "크게 부딪히는 기운 없이 흐름을 타기 좋은 해예요. 계획한 일을 꾸준히 밀고 나가세요."),
        `특히 ${best.map((m) => m.label).join(", ")}에 흐름이 가장 좋아 중요한 일을 이때 맞추면 좋아요.${worst && worst.value < best[best.length - 1].value ? ` ${worst.label}은 한 박자 쉬어 가는 달로 두세요.` : ""}`,
      ],
    };
  }

  return { basics, wonguk, elements, elementText, tenRows, groups, tenText, forward, daeunText, stars, starText, unseong, unseongText, hidden, hiddenText, relations, relText, jobs, careerText, yearKeys };
}
