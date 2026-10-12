"""포스텔러 만세력 API 클라이언트. 명세는 references/forceteller-api.md 참고."""
import asyncio
import datetime as dt
import json

import httpx

API = "https://api.forceteller.com"
SITE = "https://pro.forceteller.com"
HEADERS = {
    "Content-Type": "application/json; charset=utf-8",
    "Origin": SITE,
    "Referer": SITE + "/result",
    "User-Agent": "Mozilla/5.0",
}

# 화면 섹션 이름 -> (엔드포인트, 쿼리 파라미터)
ENDPOINTS = {
    "사주명식": ("/api/pro/profile/saju/chart", {}),
    "오행십성": ("/api/pro/profile/saju/points", {}),
    "신강신약": ("/api/pro/profile/saju/power", {}),
    "용신": ("/api/pro/profile/saju/useful", {}),
    "대운_연운_월운": ("/api/pro/profile/saju/daeun", {}),
    "사주풀이": ("/api/pro/profile/saju/details/v2", {"cat": 1}),
    "길흉성": ("/api/pro/profile/saju/details/v2", {"cat": 2}),
}

# 검색어 없이 보여줄 기본 도시 (GeoNames ID — 0이면 API가 에러를 냄)
DEFAULT_CITIES = [
    {"id": 1835848, "name": "서울특별시"},
    {"id": 1838524, "name": "부산광역시"},
    {"id": 1843564, "name": "인천광역시"},
    {"id": 1835329, "name": "대구광역시"},
    {"id": 1835235, "name": "대전광역시"},
    {"id": 1841811, "name": "광주광역시"},
    {"id": 1833747, "name": "울산광역시"},
]


# ---- 간지·십성 계산 (API가 주지 않는 해를 보충할 때 사용) ----
STEMS = "갑을병정무기경신임계"
STEMS_HANJA = "甲乙丙丁戊己庚辛壬癸"
BRANCHES = "자축인묘진사오미신유술해"
BRANCHES_HANJA = "子丑寅卯辰巳午未申酉戌亥"
ELEMENTS = "목화토금수"
STEM_ELEMENT = "목목화화토토금금수수"
BRANCH_ELEMENT = "수토목목토화화토금금토수"
# 지지의 음양은 십성 계산용(본기 기준): 자·오는 음, 사·해는 양
BRANCH_YANG = [False, False, True, False, True, True, False, False, True, False, True, True]
TEN_GODS = [("비견", "겁재"), ("식신", "상관"), ("편재", "정재"), ("편관", "정관"), ("편인", "정인")]


def ten_god(me_el, me_yang, el, yang):
    """일간 기준 십성. 거리 0=같은 오행, 1=내가 생, 2=내가 극, 3=나를 극, 4=나를 생."""
    d = (ELEMENTS.index(el) - ELEMENTS.index(me_el)) % 5
    return TEN_GODS[d][0 if me_yang == yang else 1]


def ganji(stem_idx, branch_idx, day_stem):
    """간지를 API의 '_간지'와 같은 모양으로 만든다 (십성은 일간 기준)."""
    me = STEMS.index(day_stem)
    me_el, me_yang = STEM_ELEMENT[me], me % 2 == 0

    def part(name, hanja, el, yang):
        return {"name": name, "chinese": hanja, "_오행": {"name": el},
                "_십성": {"name": ten_god(me_el, me_yang, el, yang)}}

    return {
        "_천간": part(STEMS[stem_idx], STEMS_HANJA[stem_idx], STEM_ELEMENT[stem_idx], stem_idx % 2 == 0),
        "_지지": part(BRANCHES[branch_idx], BRANCHES_HANJA[branch_idx], BRANCH_ELEMENT[branch_idx], BRANCH_YANG[branch_idx]),
    }


def year_ganji(year, day_stem):
    return ganji((year - 4) % 10, (year - 4) % 12, day_stem)


def day_index(date):
    """60갑자 일진 번호 (0=갑자). 율리우스 적일 기준: 1900-01-01은 갑술(10)."""
    return (date.toordinal() - dt.date(1900, 1, 1).toordinal() + 10) % 60


def day_ganji(date, day_stem):
    i = day_index(date)
    return ganji(i % 10, i % 12, day_stem)


def hour_ganjis(date, day_stem):
    """그날 12시진의 간지. 시두법: 자시 천간 = (일간 번호 % 5) * 2.
    자시는 23:00~01:00이지만 여기서는 그날 00시대 자시부터 해시까지(야자시 미적용)."""
    d = day_index(date) % 10
    out = []
    for b in range(12):
        start = (b * 2 - 1) % 24
        out.append({"branch": BRANCHES[b], "start": f"{start:02d}:00", "end": f"{(start + 2) % 24:02d}:00",
                    "_간지": ganji((d % 5 * 2 + b) % 10, b, day_stem)})
    return out


KST = dt.timezone(dt.timedelta(hours=9))


def today_section(sections, now=None):
    """오늘(한국 시간)의 일진과 12시진. 매 요청마다 새로 계산."""
    today = (now or dt.datetime.now(KST)).date()
    day_stem = sections["사주명식"]["_기본명식"]["_일진"]["_천간"]["name"]
    return {"date": today.isoformat(), "_간지": day_ganji(today, day_stem), "hours": hour_ganjis(today, day_stem)}


def fill_current_year(sections, year=None):
    """첫 대운이 시작되기 전(어린 나이)이면 API 연운에 올해가 없으므로 직접 계산해 넣는다."""
    year = year or dt.date.today().year
    luck = sections["대운_연운_월운"]
    if any(y.get("year") == year for y in luck["_연운"]):
        return
    day_stem = sections["사주명식"]["_기본명식"]["_일진"]["_천간"]["name"]
    luck["_연운"].insert(0, {"year": year, "_간지": year_ganji(year, day_stem), "computed": True})


class ForcetellerError(Exception):
    pass


def build_profile(*, birthday, time=None, gender="F", lunar=False, leap_month=False,
                  midnight_adjust=False, name="", location_id=1835848, location_name="서울특별시"):
    """birthday: 'YYYY-MM-DD', time: 'HH:MM' 또는 None(시간 모름)."""
    y, m, d = (int(x) for x in birthday.split("-"))
    hh, mm = (int(x) for x in (time or "00:00").split(":"))
    return {
        "name": name, "gender": gender, "birthday": birthday,
        "birthtime": f"{hh:02d}:{mm:02d}" if time else "",
        "calendar": ("L" if leap_month else "M") if lunar else "S",  # S=양력, M=음력, L=음력(윤달)
        "hmUnsure": time is None, "midnightAdjust": midnight_adjust,
        "locationId": location_id, "locationName": location_name,
        "year": y, "month": m, "day": d, "hour": hh, "min": mm, "saved": False,
        "_합보정": False, "_조후궁성보정": False,
    }


async def _fetch(client, section, profile):
    path, params = ENDPOINTS[section]
    body = json.dumps(profile, ensure_ascii=False).encode("utf-8")
    r = await client.post(API + path, params=params, content=body)
    r.raise_for_status()
    res = r.json()
    if res.get("status") != 200:
        raise ForcetellerError(f"{section}: {res.get('statusMsg')}")
    return res["data"]


async def fetch_saju(profile):
    """7개 섹션을 동시에 요청해 {섹션이름: data} 로 반환."""
    async with httpx.AsyncClient(headers=HEADERS, timeout=30) as client:
        sections = list(ENDPOINTS)
        try:
            results = await asyncio.gather(*(_fetch(client, s, profile) for s in sections))
        except httpx.HTTPError as e:
            raise ForcetellerError(f"포스텔러 요청 실패: {e}") from e
    data = dict(zip(sections, results))
    fill_current_year(data)
    return data


async def search_cities(query):
    """포스텔러 도시 검색 (전 세계, 시·군·구 단위). [{id, name}]"""
    async with httpx.AsyncClient(headers=HEADERS, timeout=15) as client:
        try:
            r = await client.get(API + "/api/pro/cities", params={"q": query})
            r.raise_for_status()
            cities = r.json().get("data", {}).get("cities", [])
        except (httpx.HTTPError, ValueError) as e:
            raise ForcetellerError(f"도시 검색 실패: {e}") from e
    return [{"id": c["geonameId"], "name": (c.get("fullName") or c["name"]).strip()} for c in cities]


async def is_valid_date(profile):
    """존재하는 날짜인지 포스텔러에 확인 (음력 30일, 윤달 유무 등 포함)."""
    body = json.dumps(profile, ensure_ascii=False).encode("utf-8")
    async with httpx.AsyncClient(headers=HEADERS, timeout=15) as client:
        try:
            r = await client.post(API + "/api/calendar/validate", content=body)
            return r.json().get("status") == 200
        except (httpx.HTTPError, ValueError) as e:
            raise ForcetellerError(f"날짜 확인 실패: {e}") from e
