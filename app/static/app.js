// 화면: 입력 폼 -> /api/fortune -> analyze()(interpret.js) -> 탭 3개 + 해석 시트

const $ = (sel, el = document) => el.querySelector(sel);
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const pad = (n) => String(n).padStart(2, "0");
const elVar = (el) => `--el:var(--el-${ELEMENTS.indexOf(el)})`;

// ================= 입력 폼 =================
const form = $("#fortune-form");
const f = form.elements;
const options = (from, to, label, selected) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i)
    .map((v) => `<option value="${v}"${v === selected ? " selected" : ""}>${label(v)}</option>`)
    .join("");

const thisYear = new Date().getFullYear();
f.year.innerHTML = `<option value="">년</option>` +
  Array.from({ length: thisYear - 1899 }, (_, i) => thisYear - i).map((v) => `<option value="${v}">${v}년</option>`).join("");
f.month.innerHTML = `<option value="">월</option>` + options(1, 12, (v) => `${v}월`);
f.hour.innerHTML = options(0, 23, (v) => `${v < 12 ? "오전" : "오후"} ${v % 12 || 12}시`, 12);
f.minute.innerHTML = options(0, 59, (v) => `${pad(v)}분`, 0);

function refreshDays() {
  // 양력은 그 달의 실제 일수, 음력은 최대 30일 (음력 2월 30일 같은 날도 고를 수 있게)
  const y = +f.year.value || 2000, m = +f.month.value || 1;
  const max = f.calendar.value === "S" ? new Date(y, m, 0).getDate() : 30;
  const keep = +f.day.value;
  f.day.innerHTML = `<option value="">일</option>` + options(1, max, (v) => `${v}일`, keep <= max ? keep : 0);
}
["year", "month", "calendar"].forEach((n) => f[n].addEventListener("change", refreshDays));
refreshDays();
f.unknown_time.addEventListener("change", () => (f.hour.disabled = f.minute.disabled = f.unknown_time.checked));

// 태어난 곳 검색 (포스텔러 도시 검색 -> GeoNames ID)
const cityInput = $("#city-input");
const cityResults = $("#city-results");
let cityTimer;
async function searchCities(q) {
  let list = [];
  try {
    const res = await fetch(`/api/cities?q=${encodeURIComponent(q)}`);
    if (res.ok) list = await res.json();
  } catch {}
  cityResults.innerHTML = list.length
    ? list.map((c) => `<li><button type="button" data-id="${c.id}" data-name="${esc(c.name)}">${esc(c.name)}</button></li>`).join("")
    : `<li class="empty">검색 결과가 없어요. 시·군·구 이름으로 검색해 보세요.</li>`;
  cityResults.hidden = false;
}
cityInput.addEventListener("input", () => {
  clearTimeout(cityTimer);
  const q = cityInput.value.trim();
  cityTimer = setTimeout(() => searchCities(q), q ? 300 : 0);
});
cityInput.addEventListener("focus", () => !cityInput.value.trim() && searchCities(""));
cityResults.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-id]");
  if (!b) return;
  f.location_id.value = b.dataset.id;
  f.location_name.value = b.dataset.name;
  $("#city-picked").textContent = b.dataset.name;
  cityInput.value = "";
  cityResults.hidden = true;
});
document.addEventListener("click", (e) => {
  if (!e.target.closest(".city-field")) cityResults.hidden = true;
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!f.name.value.trim()) return showError("이름을 입력해 주세요.");
  if (!f.year.value || !f.month.value || !f.day.value) return showError("생년월일을 모두 선택해 주세요.");
  const body = {
    name: f.name.value.trim(),
    gender: f.gender.value,
    birthday: `${f.year.value}-${pad(f.month.value)}-${pad(f.day.value)}`,
    time: f.unknown_time.checked ? null : `${pad(f.hour.value)}:${pad(f.minute.value)}`,
    lunar: f.calendar.value !== "S",
    leap_month: f.calendar.value === "L",
    location_id: +f.location_id.value,
    location_name: f.location_name.value,
  };
  load(() => fetch("/api/fortune", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }));
});
$("#sample-btn").addEventListener("click", () => load(() => fetch("/api/fortune/sample")));

async function load(request) {
  const btn = $("#submit-btn");
  showError("");
  btn.disabled = true;
  btn.textContent = "풀이하는 중…";
  try {
    const res = await request();
    const data = await res.json();
    if (!res.ok) throw new Error(errorMessage(data));
    render(data);
  } catch (err) {
    showError(err.message || "결과를 불러오지 못했어요.");
  } finally {
    btn.disabled = false;
    btn.textContent = "사주 풀이 보기";
  }
}
function errorMessage(data) {
  if (Array.isArray(data.detail)) return data.detail.map((d) => d.msg.replace(/^Value error, /, "")).join(" / ");
  return data.detail || "결과를 불러오지 못했어요. 입력값을 확인해 주세요.";
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

// ---------- 탭 1: 내 사주 ----------
function renderChart(A) {
  const shown = [...A.pillars].reverse(); // 전통 표기: 시·일·월·년 (오른쪽이 년주)
  const tile = (p, which) => {
    if (p.unknown) return `<div class="ch empty"><span class="han">?</span><span class="kor">모름</span></div>`;
    const c = p[which];
    const tg = which === "stem" && p.idx === 2 ? "나" : c.tenGod;
    return `<button type="button" class="ch" style="${elVar(c.el)}" ${tapAttr(() => explainChar(A, p, which))}>
      <span class="han">${esc(c.chinese)}</span>
      <span class="kor"><i class="dot"></i>${esc(c.name)} · ${esc(c.el)}</span>
      <span class="tg">${esc(tg)}</span></button>`;
  };
  const palja = `
    <div class="palja">
      ${shown.map((p) => `<button type="button" class="col-head ${p.idx === 2 ? "me" : ""}" ${tapAttr(() => explainPillar(A, p))}>${p.label}</button>`).join("")}
      ${shown.map((p) => tile(p, "stem")).join("")}
      ${shown.map((p) => tile(p, "branch")).join("")}
    </div>
    <p class="palja-meta-label">12운성</p>
    <div class="palja-meta" style="margin-top:0">${shown.map((p) => `<span>${p.unknown ? "-" : esc(p.unseong || "")}</span>`).join("")}</div>
    <p class="footnote">일주의 위 글자가 '나'예요. 글자나 기둥 이름을 누르면 뜻을 알려 드려요.</p>`;

  // 기둥별 오행: 천간 1 + 지지 1 + 지장간 1(나눠서)의 비중
  const legend = `<div class="legend">${ELEMENTS.map((e) => `<span><i class="dot" style="${elVar(e)}"></i>${e} ${ELEMENT_HANJA[e]}</span>`).join("")}</div>`;
  const stacks = A.pillars.map((p) => {
    if (p.unknown) return `<div class="stack-row"><span class="stack-name">${p.label}<small>시간 모름</small></span><div class="stack empty"></div></div>`;
    const w = {};
    const add = (el, v) => (w[el] = (w[el] || 0) + v);
    add(p.stem.el, 1);
    add(p.branch.el, 1);
    p.hiddenStems.forEach((h) => add(h.el, 1 / p.hiddenStems.length));
    const total = Object.values(w).reduce((a, b) => a + b, 0);
    const segs = ELEMENTS.filter((e) => w[e])
      .map((e) => `<span style="${elVar(e)};flex:${w[e] / total}" title="${e} ${Math.round((w[e] / total) * 100)}%"></span>`).join("");
    return `<button type="button" class="stack-row tap" ${tapAttr(() => explainPillar(A, p))}>
      <span class="stack-name">${p.label}<small>${esc(p.stem.name + p.branch.name)}</small></span><div class="stack">${segs}</div></button>`;
  }).join("");

  // 오행 분포
  const maxEl = Math.max(...A.elementRows.map((r) => r.percent), 1);
  const elementBars = A.elementRows.map((r) => `
    <button type="button" class="bar tap" ${tapAttr(() => explainElement(A, r))}>
      <span class="bar-name"><i class="dot" style="${elVar(r.el)}"></i>${r.el} ${ELEMENT_HANJA[r.el]}</span>
      <span class="bar-track"><span class="bar-fill" style="width:${(r.percent / maxEl) * 100}%;background:var(--el-${r.id})"></span></span>
      <span class="bar-val">${Math.round(r.percent)}%<small>${esc(r.desc)}</small></span>
    </button>`).join("");
  const elementSummary = `<div class="summary-chips">
      <span class="pill">나의 기운 <b>${esc(A.strength || "-")}</b></span>
      ${A.useful ? `<span class="pill">필요한 기운 <b>${esc(A.useful)} ${ELEMENT_HANJA[A.useful]}</b></span>` : ""}
    </div>`;

  // 십신 분포 (그룹별)
  const maxTG = Math.max(...A.tenGods.map((t) => t.share), 1);
  const tenGodBars = Object.keys(GROUP_LABEL).map((g) => `
    <p class="group-label">${GROUP_LABEL[g]} · ${Math.round(A.groupShare[g] || 0)}%</p>
    ${A.tenGods.filter((t) => t.group === g).map((t) => `
      <button type="button" class="bar tap" ${tapAttr(() => explainTenGod(A, t))}>
        <span class="bar-name">${t.name}</span>
        <span class="bar-track"><span class="bar-fill" style="width:${(t.share / maxTG) * 100}%"></span></span>
        <span class="bar-val">${Math.round(t.share)}%</span>
      </button>`).join("")}`).join("");

  const chips = (list, good) => list.length
    ? `<div class="chips">${list.map((s) => `<button type="button" class="chip ${good ? "good" : ""}" ${tapAttr(() => explainStar(A, s))}>${esc(s.name)}<small>${esc(s.where.join("·"))}</small></button>`).join("")}</div>`
    : `<p class="empty-note">${good ? "사주에 드러난 귀인이 없어요." : "사주에 드러난 신살이 없어요."}</p>`;

  const daeun = `<div class="daeun">${A.daeun.map((d) => `
      <button type="button" class="${d.now ? "now" : ""}" ${tapAttr(() => explainDaeun(A, d))}>
        <span class="age">${d.age}세</span>
        <span class="mini"><span style="${elVar(d.stemEl)}">${esc(d.hanja[0] || d.stem)}</span><span style="${elVar(d.branchEl)}">${esc(d.hanja[1] || d.branch)}</span></span>
        <span class="yr">${d.year}</span>${d.now ? `<span class="now-tag">지금</span>` : ""}
      </button>`).join("")}</div>`;

  return [
    card("사주팔자", palja, "누르면 해석"),
    card("기둥별 오행", legend + `<div class="bars">${stacks}</div>`, "누르면 해석"),
    card("오행 분포", `<div class="bars">${elementBars}</div>${elementSummary}`, "누르면 해석"),
    card("십신 분포", `<div class="bars">${tenGodBars}</div>`, "누르면 해석"),
    card("귀인", chips(A.guiin, true), "누르면 해석"),
    card("신살", chips(A.sinsal, false), "누르면 해석"),
    card("대운", daeun + `<p class="footnote">10년마다 바뀌는 큰 흐름이에요. 카드를 누르면 그 시기의 풀이를 볼 수 있어요.</p>`),
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

  return [
    card(`${Y.year}년 운세`, hero),
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
