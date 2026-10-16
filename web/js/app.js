// 화면: 입력 폼 -> getFortune()(api.js, 포스텔러 직접 호출) -> analyze()(interpret.js) -> 탭 3개 + 해석 시트

const $ = (sel, el = document) => el.querySelector(sel);
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const pad = (n) => String(n).padStart(2, "0");
const elVar = (el) => `--el:var(--el-${ELEMENTS.indexOf(el)})`;

// ================= 입력 폼 =================
// 포스텔러처럼 숫자를 직접 입력한다: 생년월일 19900101 -> 1990/01/01, 시각 1230 -> 12:30
const form = $("#fortune-form");
const f = form.elements;
const digits = (v, n) => v.replace(/\D/g, "").slice(0, n);
const formatDate = (d) => [d.slice(0, 4), d.slice(4, 6), d.slice(6, 8)].filter(Boolean).join("/");
const formatTime = (d) => [d.slice(0, 2), d.slice(2, 4)].filter(Boolean).join(":");

f.birthday.addEventListener("input", () => {
  const d = digits(f.birthday.value, 8);
  f.birthday.value = formatDate(d);
  if (d.length === 8 && !f.unknown_time.checked) f.birthtime.focus();
});
f.birthtime.addEventListener("input", () => (f.birthtime.value = formatTime(digits(f.birthtime.value, 4))));
f.unknown_time.addEventListener("change", () => {
  f.birthtime.disabled = f.unknown_time.checked;
  if (f.unknown_time.checked) f.birthtime.value = "";
});

// 입력값 검사 -> 문제가 있으면 한국어 메시지
function readBirthday() {
  const d = digits(f.birthday.value, 8);
  if (d.length < 8) return { error: "생년월일을 숫자 8자리로 입력해 주세요. 예) 19900101" };
  const y = +d.slice(0, 4), m = +d.slice(4, 6), day = +d.slice(6, 8);
  const thisYear = new Date().getFullYear();
  if (y < 1900 || y > thisYear) return { error: `태어난 해는 1900년부터 ${thisYear}년 사이로 입력해 주세요.` };
  if (m < 1 || m > 12) return { error: "태어난 월은 01부터 12 사이로 입력해 주세요." };
  const max = f.calendar.value === "S" ? new Date(y, m, 0).getDate() : 30; // 음력은 최대 30일
  if (day < 1 || day > max) return { error: `${m}월은 ${max}일까지 있어요. 날짜를 확인해 주세요.` };
  if (f.calendar.value === "S" && new Date(y, m - 1, day) > new Date()) return { error: "오늘 이후 날짜는 입력할 수 없어요." };
  return { value: `${y}-${pad(m)}-${pad(day)}` };
}
function readBirthtime() {
  if (f.unknown_time.checked) return { value: null };
  const d = digits(f.birthtime.value, 4);
  if (d.length < 4) return { error: "태어난 시각을 숫자 4자리로 입력해 주세요. 예) 0930, 1430 · 모르면 ‘시간 모름’을 눌러 주세요." };
  const h = +d.slice(0, 2), mi = +d.slice(2, 4);
  if (h > 23 || mi > 59) return { error: "시각은 00:00부터 23:59 사이로 입력해 주세요." };
  return { value: `${pad(h)}:${pad(mi)}` };
}

// 도시: 직접 입력 -> 입력하는 동안 포스텔러 도시 검색 결과를 아래에 보여 줌 (GeoNames ID)
const cityInput = $("#city-input");
const cityResults = $("#city-results");
let cityTimer, cityList = [];
function setCity(c) {
  f.location_id.value = c ? c.id : "";
  f.location_name.value = c ? c.name : "";
  if (c) cityInput.value = c.name;
}
function closeCityResults() {
  cityResults.hidden = true;
  cityInput.setAttribute("aria-expanded", "false");
}
async function showCityResults(q) {
  try {
    cityList = q ? await searchCities(q) : []; // api.js
  } catch {
    cityList = [];
  }
  if (q !== cityInput.value.trim()) return; // 그사이 입력이 바뀌었으면 버림
  if (!q) return closeCityResults();
  cityResults.innerHTML = cityList.length
    ? cityList.map((c, i) => `<li><button type="button" role="option" data-i="${i}">${esc(c.name)}</button></li>`).join("")
    : `<li class="empty">검색 결과가 없어요. 시·군·구 이름이나 나라의 수도로 입력해 보세요.</li>`;
  cityResults.hidden = false;
  cityInput.setAttribute("aria-expanded", "true");
}
cityInput.addEventListener("input", () => {
  setCity(null); // 글자를 고치면 다시 골라야 함
  clearTimeout(cityTimer);
  const q = cityInput.value.trim();
  cityTimer = setTimeout(() => showCityResults(q), 250);
});
cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !cityResults.hidden && cityList.length) {
    e.preventDefault();
    setCity(cityList[0]);
    closeCityResults();
  } else if (e.key === "Escape") closeCityResults();
});
cityResults.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-i]");
  if (!b) return;
  setCity(cityList[+b.dataset.i]);
  closeCityResults();
});
document.addEventListener("click", (e) => {
  if (!e.target.closest(".city-field")) closeCityResults();
});

// 목록에서 고르지 않고 입력만 했으면 검색 결과 첫 번째 도시로 정한다
async function resolveCity() {
  if (f.location_id.value) return {};
  const q = cityInput.value.trim();
  if (!q) return { error: "태어난 도시를 입력해 주세요. 모르면 ‘서울특별시’를 입력하세요." };
  let list = [];
  try {
    list = await searchCities(q);
  } catch {
    return { error: "도시를 검색하지 못했어요. 인터넷 연결을 확인해 주세요." };
  }
  if (!list.length) return { error: `‘${q}’에 해당하는 도시를 찾지 못했어요. 시·군·구 이름이나 나라의 수도로 입력해 주세요.` };
  setCity(list[0]);
  return {};
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!f.name.value.trim()) return showError("이름을 입력해 주세요.");
  const birthday = readBirthday();
  if (birthday.error) return showError(birthday.error);
  const time = readBirthtime();
  if (time.error) return showError(time.error);
  closeCityResults();
  // 도시 확인부터 로딩 화면(마법진) 안에서 진행
  load(async () => {
    const city = await resolveCity();
    if (city.error) throw new Error(city.error);
    return getFortune({ // api.js
      name: f.name.value.trim(),
      gender: f.gender.value,
      birthday: birthday.value,
      time: time.value,
      lunar: f.calendar.value !== "S",
      leap_month: f.calendar.value === "L",
      location_id: +f.location_id.value,
      location_name: f.location_name.value,
    });
  });
});
$("#sample-btn").addEventListener("click", () => load(getSample));

async function load(request) {
  const btn = $("#submit-btn");
  showError("");
  btn.disabled = true;
  btn.textContent = "풀이하는 중…";
  $("#loading").hidden = false; // 마법진이 빠르게 도는 로딩 화면
  try {
    // 너무 빨리 끝나면 깜빡이기만 하므로 마법진을 최소 0.9초는 보여 준다
    const [data] = await Promise.all([request(), new Promise((r) => setTimeout(r, 900))]);
    render(data);
  } catch (err) {
    showError(err.message || "결과를 불러오지 못했어요.");
  } finally {
    $("#loading").hidden = true;
    btn.disabled = false;
    btn.textContent = "사주 풀이 보기";
  }
}
function showError(msg) {
  const el = $("#form-error");
  el.textContent = msg;
  el.hidden = !msg;
}
$("#back-btn").addEventListener("click", () => {
  $("#result-view").hidden = true;
  $("#form-view").hidden = false;
  window.scrollTo(0, 0);
});

// ================= 탭 =================
const TABS = ["chart", "year", "today"];
function selectTab(name) {
  TABS.forEach((t) => {
    $(`#tab-${t}`).setAttribute("aria-selected", String(t === name));
    $(`#panel-${t}`).hidden = t !== name;
  });
}
TABS.forEach((t) => $(`#tab-${t}`).addEventListener("click", () => selectTab(t)));
$(".tabs").addEventListener("keydown", (e) => {
  if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
  const cur = TABS.findIndex((t) => $(`#tab-${t}`).getAttribute("aria-selected") === "true");
  const next = TABS[(cur + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length];
  selectTab(next);
  $(`#tab-${next}`).focus();
});

// ================= 해석 시트 =================
const sheet = $("#sheet");
let explainers = [];
const tapAttr = (fn) => `data-x="${explainers.push(fn) - 1}"`;
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-x]");
  if (!t) return;
  const { title, body } = explainers[+t.dataset.x]();
  $("#sheet-title").textContent = title;
  $("#sheet-body").innerHTML = body.filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join("");
  sheet.showModal();
});
$("#sheet-close").addEventListener("click", () => sheet.close());
sheet.addEventListener("click", (e) => e.target === sheet && sheet.close());

// ================= 렌더 =================
const card = (title, inner, note = "") =>
  `<section class="card"><div class="card-head"><h2>${title}</h2>${note ? `<span class="card-note">${note}</span>` : ""}</div>${inner}</section>`;

function render(data) {
  const A = analyze(data);
  explainers = [];
  const sm = data.summary || {};
  $("#profile-line").innerHTML = `
    <p class="profile-name">${esc(A.name)}</p>
    <p class="profile-sub">${esc(sm.sunBirth ? `양력 ${sm.sunBirth}` : "")}${sm.location ? ` · ${esc(sm.location)}` : ""}</p>`;
  if (A.year) $("#tab-year").textContent = `${A.year.year}년 운세`;
  $("#panel-chart").innerHTML = renderChart(A);
  $("#panel-year").innerHTML = A.year ? renderYear(A) : card("올해 운세", `<p>올해 운세 데이터를 찾지 못했어요.</p>`);
  $("#panel-today").innerHTML = A.today ? renderToday(A) : card("오늘의 운세", `<p>오늘의 데이터를 찾지 못했어요.</p>`);
  selectTab("chart");
  $("#form-view").hidden = true;
  $("#result-view").hidden = false;
  window.scrollTo(0, 0);
  const now = $(".daeun .now");
  if (now) now.parentElement.scrollLeft = now.offsetLeft - now.parentElement.offsetLeft - now.parentElement.clientWidth / 2 + now.clientWidth / 2;
}

// ---------- 탭 1: 내 사주 (saju-explain 형식: 표 → 상태 → 종합 해석) ----------
const insight = (paras, title = "종합 해석") =>
  `<div class="insight"><p class="insight-title">✦ ${esc(title)}</p>${paras.filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join("")}</div>`;
const table = (head, rows, cls = "") =>
  `<div class="tbl-wrap"><table class="tbl ${cls}">${head ? `<thead><tr>${head.map((h) => `<th scope="col">${h}</th>`).join("")}</tr></thead>` : ""}<tbody>${rows.join("")}</tbody></table></div>`;
const elDot = (el) => `<i class="dot" style="${elVar(el)}"></i>`;

function renderChart(A) {
  const D = A.detail;
  const shown = [...A.pillars].reverse(); // 전통 표기: 시·일·월·년 (오른쪽이 년주)
  const pillarHead = ["구분", ...shown.map((p) => (p.idx === 2 ? `<span class="me-col">${p.label}</span>` : p.label))];
  const perPillar = (label, fn) => `<tr><th scope="row">${label}</th>${shown.map((p) => `<td${p.idx === 2 ? ' class="me-col"' : ""}>${p.unknown ? "-" : fn(p)}</td>`).join("")}</tr>`;

  // 1. 기본 정보
  const basics = table(null, D.basics.map(([k, v]) => `<tr><th scope="row">${k}</th><td>${esc(v)}</td></tr>`), "kv-tbl");

  // 2. 사주 원국표
  const tile = (p, which) => {
    if (p.unknown) return `<div class="ch empty"><span class="han">?</span></div>`;
    const c = p[which];
    return `<button type="button" class="ch" style="${elVar(c.el)}" ${tapAttr(() => explainChar(A, p, which))}>
      <span class="han">${esc(c.chinese)}</span><span class="kor">${elDot(c.el)}${esc(c.name)} · ${esc(c.el)}</span></button>`;
  };
  const tileRow = (label, which) => `<tr><th scope="row">${label}</th>${shown.map((p) => `<td>${tile(p, which)}</td>`).join("")}</tr>`;
  const wonguk = table(pillarHead.map((h, i) => (i === 0 ? h : `<button type="button" class="col-btn" ${tapAttr(() => explainPillar(A, shown[i - 1]))}>${h}</button>`)), [
    perPillar("십성", (p) => (p.idx === 2 ? "<b>본인</b>" : esc(p.stem.tenGod))),
    tileRow("천간", "stem"),
    tileRow("지지", "branch"),
    perPillar("십성", (p) => esc(p.branch.tenGod)),
    perPillar("지장간", (p) => esc(p.hiddenStems.map((h) => h.name).join("·"))),
    perPillar("12운성", (p) => esc(p.unseong || "-")),
    perPillar("신살", (p) => unique([...p.stars, p.sinsal12].filter(Boolean)).map(esc).join("<br>") || "-"),
  ], "wonguk");
  const legend = `<div class="legend">${ELEMENTS.map((e) => `<span>${elDot(e)}${e} ${ELEMENT_HANJA[e]}</span>`).join("")}</div>`;

  // 3. 오행 분석
  const elementTable = table(["오행", "해당 글자", "개수", "비율", "상태"], D.elements.map((r) => `
    <tr class="tap-row" ${tapAttr(() => explainElement(A, r))}>
      <th scope="row">${elDot(r.el)}${r.el}(${ELEMENT_HANJA[r.el]})</th>
      <td>${r.chars.length ? esc(r.chars.join(", ")) : "-"}</td><td>${r.count}개</td><td>${r.ratio.toFixed(1)}%</td>
      <td><span class="status s-${esc(r.status)}">${esc(r.status)}</span></td></tr>`));
  const maxEl = Math.max(...A.elementRows.map((r) => r.percent), 1);
  const elementBars = A.elementRows.map((r) => `
    <button type="button" class="bar tap" ${tapAttr(() => explainElement(A, r))}>
      <span class="bar-name">${elDot(r.el)}${r.el} ${ELEMENT_HANJA[r.el]}</span>
      <span class="bar-track"><span class="bar-fill" style="width:${(r.percent / maxEl) * 100}%;background:var(--el-${r.id})"></span></span>
      <span class="bar-val">${Math.round(r.percent)}%</span></button>`).join("");
  const stacks = A.pillars.map((p) => {
    if (p.unknown) return `<div class="stack-row"><span class="stack-name">${p.label}<small>시간 모름</small></span><div class="stack empty"></div></div>`;
    const w = {};
    const add = (el, v) => (w[el] = (w[el] || 0) + v);
    add(p.stem.el, 1);
    add(p.branch.el, 1);
    p.hiddenStems.forEach((h) => add(h.el, 1 / p.hiddenStems.length));
    const total = Object.values(w).reduce((a, b) => a + b, 0);
    const segs = ELEMENTS.filter((e) => w[e]).map((e) => `<span style="${elVar(e)};flex:${w[e] / total}" title="${e} ${Math.round((w[e] / total) * 100)}%"></span>`).join("");
    return `<button type="button" class="stack-row tap" ${tapAttr(() => explainPillar(A, p))}>
      <span class="stack-name">${p.label}<small>${esc(p.stem.name + p.branch.name)}</small></span><div class="stack">${segs}</div></button>`;
  }).join("");
  const summary = `<div class="summary-chips">
      <span class="pill">일간 <b>${esc(A.me.name)}(${esc(A.me.chinese)}) · ${esc(A.me.el)}</b></span>
      <span class="pill">신강·신약 <b>${esc(A.strength || "-")}</b></span>
      ${A.useful ? `<span class="pill">용신 <b>${esc(A.useful)}(${ELEMENT_HANJA[A.useful]})</b></span>` : ""}</div>`;

  // 4. 십성 분포
  const tenTable = table(pillarHead, [
    perPillar("천간 십성", (p) => (p.idx === 2 ? "<b>본인</b>" : esc(p.stem.tenGod))),
    perPillar("지지 십성", (p) => esc(p.branch.tenGod)),
  ]);
  const groupTable = table(["십성 분류", "개수", "키워드"], D.groups.map((g) => `
    <tr><th scope="row">${g.group}</th><td>${g.count}개</td><td>${esc(g.keyword)}</td></tr>`), "left-last");
  const maxTG = Math.max(...A.tenGods.map((t) => t.share), 1);
  const tenBars = A.tenGods.filter((t) => t.share > 0).map((t) => `
    <button type="button" class="bar tap" ${tapAttr(() => explainTenGod(A, t))}>
      <span class="bar-name">${t.name}</span>
      <span class="bar-track"><span class="bar-fill" style="width:${(t.share / maxTG) * 100}%"></span></span>
      <span class="bar-val">${Math.round(t.share)}%</span></button>`).join("");

  // 5. 대운
  const d0 = A.daeun[0];
  const daeunMeta = d0 ? `<p class="meta-line">대운 방향 <b>${D.forward ? "순행 →" : "역행 ←"}</b> · 대운 시작 <b>만 ${d0.age}세 (${d0.year}년)</b></p>` : "";
  const daeunTable = table(["나이", "대운 간지", "천간 오행", "지지 오행", "기간"], A.daeun.map((d) => `
    <tr class="tap-row ${d.now ? "now" : ""}" ${tapAttr(() => explainDaeun(A, d))}>
      <th scope="row">${d.age}세${d.now ? '<span class="tag on">지금</span>' : ""}</th>
      <td>${esc(d.ganji)}(${esc(d.hanja)})</td><td>${elDot(d.stemEl)}${esc(d.stemEl)}</td><td>${elDot(d.branchEl)}${esc(d.branchEl)}</td>
      <td>${d.year} ~ ${d.year + 9}</td></tr>`));

  // 6. 신살
  const starTable = D.stars.length ? table(["신살", "위치", "의미"], D.stars.map((x) => `
    <tr class="tap-row" ${tapAttr(() => explainStar(A, { name: x.name, where: x.locs, info: x.info }))}>
      <th scope="row">${esc(x.name)}${x.good ? '<span class="tag">길성</span>' : ""}</th>
      <td>${esc(x.locs.join(", "))}</td><td class="left">${esc(x.info)}</td></tr>`), "stars-tbl") : `<p class="empty-note">사주에 드러난 신살이 없어요.</p>`;

  // 7. 12운성
  const unTable = table(pillarHead, [
    perPillar("지지", (p) => `${esc(p.branch.name)}(${esc(p.branch.chinese)})`),
    perPillar("12운성", (p) => `<b>${esc(p.unseong || "-")}</b>`),
    perPillar("에너지", (p) => esc(UNSEONG_ENERGY[p.unseong] || "-")),
  ]);

  // 8. 지장간
  const hid = Object.fromEntries(D.hidden.map((h) => [h.label, h.slots]));
  const hidCell = (x) => (x ? `${elDot(x.el)}${esc(x.name)}(${esc(x.chinese)})<small class="sub">${esc(x.tenGod)}</small>` : "-");
  const hidTable = table(pillarHead, ["여기", "중기", "정기"].map((k, i) => perPillar(k, (p) => hidCell(hid[p.label]?.[i]))), "hidden-tbl");

  // 9. 형충회합
  const relTable = D.relations.length ? table(["관계", "글자", "자리", "의미"], D.relations.map((r) => `
    <tr><th scope="row">${esc(r.kind)}</th><td>${esc(r.name)}</td><td>${esc(r.where)}</td><td class="left">${esc(r.meaning)}</td></tr>`)) : "";

  // 10. 적성 · 직업
  const jobs = `<ol class="jobs">${D.jobs.map((j) => `<li><b>${esc(j.title)}</b><span>${esc(j.why)}</span></li>`).join("")}</ol>`;

  return [
    card("기본 정보", basics),
    card("사주 원국표", `<p class="meta-line">오른쪽(년주)에서 왼쪽(시주)으로 읽어요. 글자를 누르면 뜻을 알려 드려요.</p>${wonguk}${legend}` + insight(D.wonguk, "원국 요약"), "누르면 해석"),
    card("오행 분석", elementTable + summary +
      `<p class="sub-head">오행의 힘 (지장간·계절까지 반영)</p><div class="bars">${elementBars}</div>` +
      `<p class="sub-head">기둥별 오행</p><div class="bars">${stacks}</div>` + insight(D.elementText), "누르면 해석"),
    card("십성 분포", tenTable + `<p class="sub-head">십성 요약</p>` + groupTable +
      `<p class="sub-head">십성별 비중</p><div class="bars">${tenBars}</div>` + insight(D.tenText), "누르면 해석"),
    card("대운", daeunMeta + daeunTable + insight(D.daeunText, "지금의 대운"), "누르면 해석"),
    card("신살 분석", starTable + insight(D.starText, "신살 종합 해석"), "누르면 해석"),
    card("12운성", unTable + insight(D.unseongText, "일주 운성 해석")),
    card("지장간", `<p class="meta-line">지지 속에 숨어 있는 기운이에요. 겉으로 드러나지 않지만 필요할 때 꺼내 쓰는 힘이에요.</p>` + hidTable + insight(D.hiddenText, "숨은 기운 보완")),
    card("형충회합", (relTable || `<p class="empty-note">글자 사이에 합이나 충이 없어요.</p>`) + insight(D.relText)),
    card("적성 · 직업", `<p class="sub-head" style="margin-top:0">추천 직업군</p>` + jobs + insight(D.careerText, "커리어 조언")),
  ].join("");
}

// ---------- 세로 막대 차트 (월별 / 시간대별) ----------
function columns(items, { onKey, explain }) {
  return `<div class="columns">${items.map((it) => {
    const on = !!it[onKey];
    return `<button type="button" class="column ${on ? "on" : ""}" title="${esc(it.title || "")}" ${tapAttr(() => explain(it))}>
      <span class="c-area"><span class="c-bar" style="height:${it.value}%">${on || it.showVal ? `<span class="c-val">${it.value}</span>` : ""}</span></span>
      <span class="c-label">${esc(it.label)}</span></button>`;
  }).join("")}</div>`;
}

// ---------- 탭 2: 올해 운세 ----------
function renderYear(A) {
  const Y = A.year;
  const hero = `
    <p class="eyebrow">${esc(Y.ganji)}년 · ${esc(Y.name)}</p>
    <div class="hero-score"><span class="num">${Y.value}</span><span class="of">/ 100</span></div>
    <span class="hero-label">${esc(Y.label)}</span>
    <div style="margin-top:12px">${Y.text.map((t) => `<p>${esc(t)}</p>`).join("")}</div>
    ${Y.daeunNow ? `<p class="footnote">지금은 ${Y.daeunNow.age}세부터 시작된 ${esc(Y.daeunNow.ganji)} 대운, '${esc(GROUP_YEAR[Y.daeunNow.stemG].daeun)}' 안에 있어요.</p>`
      : Y.firstDaeun ? `<p class="footnote">첫 대운은 ${Y.firstDaeun.age}세(${Y.firstDaeun.year}년)부터 시작돼요.</p>` : ""}`;

  const fields = Y.fields.map((fd) => `
    <button type="button" class="bar tap" ${tapAttr(() => ({ title: `${fd.title} · ${fd.value}점`, body: [indexLabel(fd.value), ...fd.text] }))}>
      <span class="bar-name">${esc(fd.title.replace(" · ", "·").replace("운", ""))}</span>
      <span class="bar-track"><span class="bar-fill" style="width:${fd.value}%"></span></span>
      <span class="bar-val">${fd.value}<small>${esc(indexLabel(fd.value))}</small></span>
    </button>`).join("");

  const best = Math.max(...Y.months.map((m) => m.value));
  const worst = Math.min(...Y.months.map((m) => m.value));
  const mName = (m) => (m.nextYear ? "다음 해 1월" : m.label);
  const monthChart = columns(
    Y.months.map((m) => ({ ...m, showVal: m.value === best, label: m.nextYear ? "1*" : m.label.replace("월", ""), title: `${mName(m)} ${m.value}점` })),
    { onKey: "now", explain: (m) => ({ title: `${mName(m)} · ${m.value}점`, body: [`${m.ganji}월 · ${indexLabel(m.value)}`, m.text] }) },
  );

  const remedy = A.remedy.elements.map((e) => `
    <div class="remedy">
      <p class="remedy-head"><i class="dot" style="${elVar(e.el)}"></i>${e.el} ${ELEMENT_HANJA[e.el]} 기운 채우기 <small>${e.main ? "가장 필요한 기운" : "부족한 기운"}</small></p>
      <dl class="kv">
        <div><dt>행운의 색</dt><dd>${swatches(e.color)}${esc(e.color)}</dd></div>
        <div><dt>좋은 방향</dt><dd>${esc(e.dir)}</dd></div>
        <div><dt>행운의 숫자</dt><dd>${esc(e.nums)}</dd></div>
        <div><dt>음식</dt><dd>${esc(e.food)}</dd></div>
        <div class="wide"><dt>생활 습관</dt><dd>${esc(e.act)}</dd></div>
        <div class="wide"><dt>가까이 둘 물건</dt><dd>${esc(e.item)}</dd></div>
      </dl>
    </div>`).join("");

  const K = A.detail.yearKeys;
  const keys = K ? `<p class="sub-head">운세 키워드</p>` + table(null, [
      `<tr><th scope="row">총운</th><td class="left" colspan="2"><b>${esc(K.total)}</b></td></tr>`,
      ...K.rows.map((r) => `<tr class="tap-row" ${tapAttr(() => ({ title: `${r.title} · ${r.value}점`, body: [indexLabel(r.value), ...Y.fields.find((f) => f.title === r.title).text] }))}>
        <th scope="row">${esc(r.title)}</th><td class="rate">${"★".repeat(r.stars)}<span class="off">${"★".repeat(5 - r.stars)}</span></td><td class="left">${esc(r.line)}</td></tr>`),
    ], "keys-tbl") + insight(K.advice, `${Y.year}년 조언`) : "";

  return [
    card(`${Y.year}년 세운 · ${Y.ganji}(${Y.hanja})년`, hero + keys),
    card("분야별 지수", `<div class="bars">${fields}</div>`, "누르면 풀이"),
    card("월별 흐름", monthChart +
      `<div class="col-legend"><span>좋은 달 <b>${Y.months.filter((m) => m.value === best).map(mName).join(", ")}</b></span>` +
      (worst < best ? `<span>조심할 달 <b>${Y.months.filter((m) => m.value === worst).map(mName).join(", ")}</b></span>` : "") +
      `</div><p class="footnote">진하게 표시된 막대가 이번 달이에요. 사주 달력은 입춘(2월 초)부터 시작하고, 1*은 다음 해 1월이에요.</p>`, "누르면 풀이"),
    card("올해 주의할 점", `<ul class="list">${Y.cautions.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>`),
    card("개운법", remedy + `<p class="footnote">${esc(A.remedy.habit)}</p>`),
  ].join("");
}

// ---------- 탭 3: 오늘의 운세 ----------
function renderToday(A) {
  const T = A.today;
  const d = new Date(T.date + "T12:00:00");
  const dateText = `${d.getMonth() + 1}월 ${d.getDate()}일 ${"일월화수목금토"[d.getDay()]}요일`;
  const hero = `
    <p class="eyebrow">${dateText} · ${esc(T.ganji)}일</p>
    <div class="hero-score"><span class="num">${T.value}</span><span class="of">/ 100</span></div>
    <span class="hero-label">${esc(T.label)}</span>
    <p class="hero-title">${esc(T.title)}</p>
    <p>${esc(T.summary)}</p>
    <div class="areas" style="margin-top:14px">${T.areas.map((a) => `<div><b>${a.title}</b><span>${esc(a.text)}</span></div>`).join("")}</div>`;

  const L = T.lucky;
  const lucky = `
    <dl class="kv">
      <div><dt>행운의 색</dt><dd>${swatches(L.color)}${esc(L.color)}</dd></div>
      <div><dt>행운의 숫자</dt><dd>${esc(L.number)}</dd></div>
      <div><dt>좋은 방향</dt><dd>${esc(L.dir)}</dd></div>
      <div><dt>행운의 아이템</dt><dd>${esc(L.item)}</dd></div>
      <div class="wide"><dt>음식</dt><dd>${esc(L.food)}</dd></div>
      <div class="wide"><dt>하면 좋은 일</dt><dd>${esc(L.todo)}</dd></div>
      <div class="wide"><dt>피하면 좋은 일</dt><dd>${esc(L.avoid)}</dd></div>
    </dl>
    <p class="footnote">${esc(L.why)}</p>`;

  const hourChart = columns(
    T.hours.map((h) => ({ ...h, on: h.best, showVal: h.worst, title: `${h.label}시 ${h.range} · ${h.value}점` })),
    { onKey: "on", explain: (h) => ({ title: `${h.label}시 · ${h.range} · ${h.value}점`, body: [`${h.ganji}시 · ${indexLabel(h.value)}`, `이 시간은 '${DAY_TEXT[h.group].title.replace("날", "시간")}'이에요. ${DAY_TEXT[h.group].work}`] }) },
  );
  const bestH = T.hours.filter((h) => h.best).map((h) => `${h.label}시 ${h.range}`);
  const worstH = T.hours.filter((h) => h.worst).map((h) => `${h.label}시 ${h.range}`);
  const deep = `
    ${hourChart}
    <div class="col-legend"><span>좋은 시간 <b>${bestH.join(", ")}</b></span>${worstH.length ? `<span>조심할 시간 <b>${worstH.join(", ")}</b></span>` : ""}</div>
    <p class="hero-title" style="font-size:16px;margin-top:24px">오늘의 기운과 나</p>
    <ul class="list">${T.flow.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
    <p class="footnote">오늘은 나에게 '${esc(T.dayGod.name)}'의 기운이 들어오는 날이에요. ${esc(T.dayGod.info?.body || "")}</p>
    ${T.month ? `<p class="footnote">${esc(T.month)}</p>` : ""}`;

  return [
    card("오늘의 점수", hero),
    card("오늘의 개운법", lucky),
    card("더 깊은 오늘의 흐름", deep, "시간대별 · 누르면 풀이"),
  ].join("");
}

// 행운의 색 이름 -> 색 견본
const COLOR_HEX = { 초록: "#3a9a5b", 청록: "#2a9d8f", 빨강: "#d94040", 주황: "#e8833a", 노랑: "#e3b23c", 베이지: "#d8c3a5", 흰색: "#ffffff", 은색: "#c4c4c8", 검정: "#1f1f22", 남색: "#283a74" };
function swatches(text) {
  return text.split(" · ").map((n) => (COLOR_HEX[n] ? `<i class="swatch" style="background:${COLOR_HEX[n]}"></i>` : "")).join("");
}
