// 브라우저에서 포스텔러 만세력 API를 직접 호출한다 (서버 없이 GitHub Pages에서도 동작).
// 포스텔러 API는 다른 사이트에서의 요청(CORS)을 허용한다. 명세: references/forceteller-api.md
// app/forceteller.py(파이썬 서버)와 같은 동작을 한다.

const FT_API = "https://api.forceteller.com";

const ENDPOINTS = {
  사주명식: ["/api/pro/profile/saju/chart", ""],
  오행십성: ["/api/pro/profile/saju/points", ""],
  신강신약: ["/api/pro/profile/saju/power", ""],
  용신: ["/api/pro/profile/saju/useful", ""],
  대운_연운_월운: ["/api/pro/profile/saju/daeun", ""],
  사주풀이: ["/api/pro/profile/saju/details/v2", "?cat=1"],
  길흉성: ["/api/pro/profile/saju/details/v2", "?cat=2"],
};

// 검색어 없이 보여줄 기본 도시 (GeoNames ID — 0이면 API가 에러를 냄)
const DEFAULT_CITIES = [
  { id: 1835848, name: "서울특별시" },
  { id: 1838524, name: "부산광역시" },
  { id: 1843564, name: "인천광역시" },
  { id: 1835329, name: "대구광역시" },
  { id: 1835235, name: "대전광역시" },
  { id: 1841811, name: "광주광역시" },
  { id: 1833747, name: "울산광역시" },
];

// ---------- 간지·십성 계산 (API가 주지 않는 오늘 일진, 첫 대운 전의 연운) ----------
const G_STEMS = "갑을병정무기경신임계";
const G_STEMS_HANJA = "甲乙丙丁戊己庚辛壬癸";
const G_BRANCHES = "자축인묘진사오미신유술해";
const G_BRANCHES_HANJA = "子丑寅卯辰巳午未申酉戌亥";
const G_ELEMENTS = "목화토금수";
const G_STEM_EL = "목목화화토토금금수수";
const G_BRANCH_EL = "수토목목토화화토금금토수";
const G_BRANCH_YANG = [false, false, true, false, true, true, false, false, true, false, true, true]; // 본기 기준
const G_TEN_GODS = [["비견", "겁재"], ["식신", "상관"], ["편재", "정재"], ["편관", "정관"], ["편인", "정인"]];

function tenGodOf(meEl, meYang, el, yang) {
  const d = (G_ELEMENTS.indexOf(el) - G_ELEMENTS.indexOf(meEl) + 5) % 5;
  return G_TEN_GODS[d][meYang === yang ? 0 : 1];
}

function makeGanji(si, bi, dayStem) {
  const me = G_STEMS.indexOf(dayStem);
  const meEl = G_STEM_EL[me], meYang = me % 2 === 0;
  const part = (name, chinese, el, yang) => ({ name, chinese, _오행: { name: el }, _십성: { name: tenGodOf(meEl, meYang, el, yang) } });
  return {
    _천간: part(G_STEMS[si], G_STEMS_HANJA[si], G_STEM_EL[si], si % 2 === 0),
    _지지: part(G_BRANCHES[bi], G_BRANCHES_HANJA[bi], G_BRANCH_EL[bi], G_BRANCH_YANG[bi]),
  };
}
const mod = (n, m) => ((n % m) + m) % m;
const yearGanji = (year, dayStem) => makeGanji(mod(year - 4, 10), mod(year - 4, 12), dayStem);

// 60갑자 일진 번호 (0=갑자). 1900-01-01은 갑술(10)
function dayIndex(y, m, d) {
  return mod(Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1900, 0, 1)) / 86400000) + 10, 60);
}

// 오늘(한국 시간)의 일진과 12시진. 시두법: 자시 천간 = (일간 번호 % 5) * 2
function todaySection(sections, now = new Date()) {
  const kst = new Date(now.getTime() + 9 * 3600000);
  const y = kst.getUTCFullYear(), m = kst.getUTCMonth() + 1, d = kst.getUTCDate();
  const dayStem = sections["사주명식"]._기본명식._일진._천간.name;
  const i = dayIndex(y, m, d);
  const hours = Array.from({ length: 12 }, (_, b) => {
    const start = mod(b * 2 - 1, 24);
    return {
      branch: G_BRANCHES[b],
      start: `${String(start).padStart(2, "0")}:00`,
      end: `${String((start + 2) % 24).padStart(2, "0")}:00`,
      _간지: makeGanji(((i % 10) % 5 * 2 + b) % 10, b, dayStem),
    };
  });
  return { date: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`, _간지: makeGanji(i % 10, i % 12, dayStem), hours };
}

// 첫 대운이 시작되기 전(어린 나이)이면 API 연운에 올해가 없으므로 직접 계산해 넣는다
function fillCurrentYear(sections, year) {
  const luck = sections["대운_연운_월운"];
  if (luck._연운.some((y) => y.year === year)) return;
  const dayStem = sections["사주명식"]._기본명식._일진._천간.name;
  luck._연운.unshift({ year, _간지: yearGanji(year, dayStem), computed: true });
}

// ---------- 포스텔러 호출 ----------
function buildProfile({ name = "", gender, birthday, time, lunar, leap_month, location_id, location_name }) {
  const [y, m, d] = birthday.split("-").map(Number);
  const [hh, mm] = (time || "00:00").split(":").map(Number);
  return {
    name, gender, birthday,
    birthtime: time ? `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}` : "",
    calendar: lunar ? (leap_month ? "L" : "M") : "S", // S=양력, M=음력, L=음력(윤달)
    hmUnsure: !time, midnightAdjust: false,
    locationId: location_id, locationName: location_name,
    year: y, month: m, day: d, hour: hh, min: mm, saved: false,
    _합보정: false, _조후궁성보정: false,
  };
}

async function ftPost(path, body) {
  const res = await fetch(FT_API + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return res.json();
}

async function searchCities(q) {
  q = q.trim();
  if (!q) return DEFAULT_CITIES;
  const res = await fetch(`${FT_API}/api/pro/cities?q=${encodeURIComponent(q.slice(0, 30))}`);
  const data = await res.json();
  return (data?.data?.cities || []).map((c) => ({ id: c.geonameId, name: (c.fullName || c.name).trim() }));
}

const fortuneCache = new Map();

// 입력값 -> { profile, summary, sections, today }. 문제가 있으면 한국어 메시지로 Error
async function getFortune(input) {
  const profile = buildProfile(input);
  const key = JSON.stringify(profile);
  let base = fortuneCache.get(key);
  if (!base) {
    let valid;
    try {
      valid = (await ftPost("/api/calendar/validate", profile)).status === 200;
    } catch {
      throw new Error("만세력 서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.");
    }
    if (!valid) throw new Error("존재하지 않는 날짜예요. 음력이라면 그 달에 30일이 있는지, 윤달이 있는 해인지 확인해 주세요.");
    const names = Object.keys(ENDPOINTS);
    let results;
    try {
      results = await Promise.all(names.map((n) => ftPost(ENDPOINTS[n][0] + ENDPOINTS[n][1], profile)));
    } catch {
      throw new Error("만세력 데이터를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
    const bad = results.findIndex((r) => r?.status !== 200);
    if (bad >= 0) throw new Error(`만세력 데이터를 불러오지 못했어요 (${names[bad]}).`);
    const sections = Object.fromEntries(names.map((n, i) => [n, results[i].data]));
    base = { profile, summary: sections["사주명식"].profile, sections };
    fortuneCache.set(key, base);
  }
  const today = todaySection(base.sections);
  fillCurrentYear(base.sections, Number(today.date.slice(0, 4)));
  return { ...base, today };
}

// 예시 데이터 (sample.json)
async function getSample() {
  const data = await (await fetch("sample.json")).json();
  const today = todaySection(data.sections);
  fillCurrentYear(data.sections, Number(today.date.slice(0, 4)));
  return { ...data, summary: data.sections["사주명식"].profile, today };
}
